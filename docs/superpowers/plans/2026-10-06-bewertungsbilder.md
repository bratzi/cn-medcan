# Bilder zur Bewertung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bewertende können bis zu drei Bilder zu ihrer Bewertung abgeben; im Buch füllen sie links unter dem Text den Leerraum (Diashow), ohne eigenes Bild steht ab `lg` das Herstellerbild oder das Musterbild, und freigegebene Bewertungsbilder sind zugleich Budpics der Sorte.

**Architecture:** Ein Bewertungsbild ist eine Zeile in `budpics` mit der neuen Spalte `review_id` (keine zweite Ablage). Upload je Datei über eine eigene Server Action nach erfolgreichem `bewertungSpeichern`; Freigabe, Auslieferung und Sortendiashow bleiben die der Budpics. Im Buch wandert das Bildfeld in die gemessene Fläche von `BuchNotiz`, damit die rechte Seite weiter die Höhe vorgibt.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), Prisma 7 mit D1, Tailwind 4, `node:test` über `tsx --test`, `better-sqlite3` für Migrationstests.

**Spec:** `docs/superpowers/specs/2026-10-06-bewertungsbilder-design.md`

## Global Constraints

- Next.js 16 App Router auf Cloudflare Workers (OpenNext). Vor Next-API-Nutzung `node_modules/next/dist/docs/` lesen (AGENTS.md).
- Kein `next dev`, `next build`, `next preview` lokal. Prüfen nur per `npm test`, `npx tsc --noEmit -p .`, `npx eslint <geänderte Dateien>`. Die Live-Prüfung macht der Controller nach dem Push.
- Design-Regelwerk: Skill `ui-design-engine` (8-px-Raster, Tokens aus `app/globals.css`, Buch und Handschrift). Vor UI-Arbeit laden.
- Zeilenenden je Datei erhalten: `git ls-files --eol <datei>` zeigt `i/crlf` oder `i/lf`. Nie eine CRLF-Datei als LF zurückschreiben (Python: `open(..., newline="")`). CRLF sind hier u. a. `prisma/schema.prisma`, `lib/query/strains.ts`, `components/review/BewertungsFormular.tsx`, `app/[lang]/admin/page.tsx`, `app/[lang]/datenschutz/page.tsx`.
- Texte in `lib/i18n/de.ts` und `lib/i18n/en.ts`, keine Literale in Komponenten (`tests/i18n-literale.test.ts`). Alle neuen Texte legt Task 1 an; spätere Tasks fügen keine Schlüssel hinzu.
- Kommentare und Commits auf Deutsch in Prosa, im Stil der Umgebung. Commit-Ende: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Bewegung nur bei `prefers-reduced-motion: no-preference`, Sparmodus `[data-sparmodus]` beachten.
- Kein Push, kein Merge. Nur Commits im eigenen Worktree-Branch.
- Komplett kostenfrei: kein R2, kein Images-Dienst. Bilder als WebP-BLOB in D1, höchstens 150 KB (`BUDPIC_MAX_BYTES`), lange Kante höchstens 1280 px (`BUDPIC_MAX_KANTE`), verkleinert im Browser.
- D1: eine Zeile höchstens 2 MB, höchstens 100 gebundene Werte je Abfrage, jede Liste mit `take`. Nie `daten` (BLOB) in Listenabfragen auswählen. Workers-CPU 10 ms: keine Bildverarbeitung auf dem Server außer `bildPruefen`.
- Migration: Implementer legen nur die Datei an und testen sie lokal mit `better-sqlite3`. Kein `wrangler d1 … --remote` durch Implementer. **Remote-D1 spielt der Controller selbst ein**, exakt `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0016_bewertungsbilder.sql`, und zwar **vor** dem ersten Push von Code, der `review_id` liest (die Migration ist rein additiv, alter Code läuft damit weiter).
- Nach Änderungen an `prisma/schema.prisma`: `npm run db:generate` (erzeugt `lib/generated/prisma`, kein Download nötig). Keine zusätzlichen npm-Installationen.

## Review Focus

1. Langer Text plus drei Bilder ab `lg` (z. B. 1143 px): der Text muss früher mit „Weiterlesen“ enden, das Bildfeld behält mindestens 192 px, die Doppelseite wächst nicht über `--buch-h`. Abgesichert durch `notizZeilen` (Task 5, Step 1).
2. Bewertung gespeichert, aber ein Bild scheitert (Sitzung abgelaufen, zu groß): die Bewertung bleibt gespeichert, das gescheiterte Bild bleibt vorgemerkt, ein erneutes Absenden schickt nur dieses. Abgesichert durch `bilderSenden` (Task 3, Step 1).
3. Erneutes Speichern einer Bewertung mit Bildern: die Bilder bleiben (Upsert behält die Review-Id) und schon gesendete Bilder gehen nicht noch einmal raus. Abgesichert im Migrationstest (Task 1) und durch `bilderSenden` (Task 3).
4. Zwei Bilder vorhanden, drei gewählt: nur eines wird angenommen, der Rest mit Hinweis verworfen; der Server lehnt ein viertes ohnehin ab. Abgesichert durch `annehmbareDateien` und `bilderFrei` (Task 1).
5. Abgelehntes Bild: zählt nicht zur Grenze, macht den Platz frei, erscheint nirgends. Abgesichert durch `bilderFrei` (Task 1) und die bestehende Route (`FREIGEGEBEN` only).

## Stränge und Reihenfolge

```
Task 1 (Fundament: Migration, Prisma, reine Logik, alle Texte)   ← zuerst, allein
   ├── Strang A: Task 2 (Server Actions, offene Vorschau) → Task 3 (Formular)
   ├── Strang B: Task 4 (Daten fürs Buch) → Task 5 (Bildfeld im Buch)
   └── Strang C: Task 6 (/admin-Vermerk, Datenschutz)
Task 7 (Controller: Remote-D1, Merge, Push, Live-Prüfung)        ← zuletzt
```

Strang A, B und C laufen nach Task 1 parallel, je ein Worktree. Berührungspunkte beim Zusammenführen:
`lib/query/strains.ts` (Task 3 ändert nur `ladeEigeneBewertung`, Task 4 nur `ReviewEintrag` und die
Bewertungsabfrage in `ladeStrainDetail`) und `tests/i18n-literale.test.ts` (Task 2 und 3 nach Zeile
62/64, Task 5 nach Zeile 57). Andere Dateien überschneiden sich nicht.

---

### Task 1: Fundament (Migration, Prisma, reine Logik, Texte)

**Files:**
- Create: `migrations/0016_bewertungsbilder.sql` (LF)
- Modify: `prisma/schema.prisma` (CRLF; `model Budpic` ab Zeile 676, `model Review` ab Zeile 228)
- Modify: `lib/budpics.ts` (Konstante nach `BUDPIC_MAX_ANZEIGE`)
- Create: `lib/bewertungsbilder.ts` (LF)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (Blöcke `buch`, `bewerten`, `meldung`)
- Test: `tests/bewertungsbilder.test.ts` (neu), `tests/bewertungsbilder-migration.test.ts` (neu)

**Interfaces:**
- Consumes: `musterBildId(slug)`, `BudpicStatus` aus `lib/budpics.ts`; `blueteBild(id)` aus `lib/medien.ts`.
- Produces:
  - `BEWERTUNGSBILD_MAX = 3` in `lib/budpics.ts`
  - `bildStatusFuer(rolle: string): "FREIGEGEBEN" | "OFFEN"`
  - `bilderFrei(status: readonly string[]): number`
  - `annehmbareDateien(gewaehlt: number, frei: number): number`
  - `ersatzBildId(bildPfad: string | null | undefined, slug: string): string`
  - Prisma: `Budpic.reviewId: string | null`, `Budpic.review`, `Review.bilder: Budpic[]`
  - Texte: `w.buch.bilderDiashow`; `w.bewerten.bilder`, `bilderHinweis`, `bilderPruefung`, `bilderWaehlen`, `bildEntfernen`, `bildAbwaehlen`, `bildVorgemerkt`, `bildStatus.{OFFEN,FREIGEGEBEN,ABGELEHNT}`, `bildLaeuft`, `bildFehler`, `bildAlt`, `bilderVoll`; `w.meldung["bewertungsbild.ohneBewertung"]`, `["bewertungsbild.zuViele"]`, `["bewertungsbild.unbekannt"]`

- [ ] **Step 1: Failing tests für die reine Logik schreiben**

`tests/bewertungsbilder.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { annehmbareDateien, bildStatusFuer, bilderFrei, ersatzBildId } from "@/lib/bewertungsbilder";
import { BEWERTUNGSBILD_MAX, musterBildId } from "@/lib/budpics";

test("drei Bilder je Bewertung", () => {
  assert.equal(BEWERTUNGSBILD_MAX, 3);
});

test("bildStatusFuer: Betreiber sofort sichtbar, alle anderen offen", () => {
  assert.equal(bildStatusFuer("ADMIN"), "FREIGEGEBEN");
  assert.equal(bildStatusFuer("MITGLIED"), "OFFEN");
  assert.equal(bildStatusFuer(""), "OFFEN");
});

test("bilderFrei: offene und freigegebene belegen, abgelehnte nicht", () => {
  assert.equal(bilderFrei([]), 3);
  assert.equal(bilderFrei(["OFFEN"]), 2);
  assert.equal(bilderFrei(["OFFEN", "FREIGEGEBEN", "FREIGEGEBEN"]), 0);
  assert.equal(bilderFrei(["ABGELEHNT", "ABGELEHNT", "OFFEN"]), 2);
  assert.equal(bilderFrei(["OFFEN", "OFFEN", "OFFEN", "OFFEN"]), 0);
});

test("annehmbareDateien: nie mehr als frei, nie negativ", () => {
  assert.equal(annehmbareDateien(3, 1), 1);
  assert.equal(annehmbareDateien(2, 3), 2);
  assert.equal(annehmbareDateien(5, 0), 0);
  assert.equal(annehmbareDateien(0, 3), 0);
  assert.equal(annehmbareDateien(1, -2), 0);
});

test("ersatzBildId: Herstellerbild vor Musterbild, unbekanntes Herstellerbild zählt nicht", () => {
  assert.equal(ersatzBildId(null, "nebelharz-22"), musterBildId("nebelharz-22"));
  assert.equal(ersatzBildId("gibt-es-nicht", "nebelharz-22"), musterBildId("nebelharz-22"));
  assert.equal(ersatzBildId("bluete-03", "nebelharz-22"), "bluete-03");
});
```

(`bluete-03` ist ein Foto aus `lib/medien.ts`; `blueteBild` liefert für Fotos die Id selbst.)

- [ ] **Step 2: Failing Migrationstest schreiben**

`tests/bewertungsbilder-migration.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/**
 * Migration 0016 (Spec 2026-10-06): budpics bekommt review_id. Bestehende
 * Bilder bleiben frei (NULL), Bilder einer Bewertung gehen mit ihr, ein
 * Aktualisieren der Bewertung lässt sie stehen. D1 prüft Fremdschlüssel,
 * deshalb hier PRAGMA foreign_keys = ON.
 */
const sql = (name: string) => readFileSync(join(process.cwd(), "migrations", name), "utf8");

function datenbank() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE "strains" ("id" TEXT NOT NULL PRIMARY KEY);
    CREATE TABLE "mitglied" ("id" TEXT NOT NULL PRIMARY KEY);
    CREATE TABLE "reviews" ("id" TEXT NOT NULL PRIMARY KEY, "notiz" TEXT);
    INSERT INTO "strains" VALUES ('s1');
    INSERT INTO "mitglied" VALUES ('m1');
    INSERT INTO "reviews" VALUES ('r1', NULL);
  `);
  db.exec(sql("0012_budpics.sql"));
  db.prepare(`INSERT INTO "budpics" ("id", "strain_id", "mitglied_id", "daten", "breite", "hoehe") VALUES ('alt', 's1', 'm1', x'00', 1, 1)`).run();
  db.exec(sql("0016_bewertungsbilder.sql"));
  return db;
}

const neu = (db: Database.Database, id: string, review: string | null) =>
  db
    .prepare(`INSERT INTO "budpics" ("id", "strain_id", "mitglied_id", "daten", "breite", "hoehe", "review_id") VALUES (?, 's1', 'm1', x'00', 1, 1, ?)`)
    .run(id, review);

test("0016: bestehende Budpics bleiben frei", () => {
  const db = datenbank();
  assert.deepEqual(db.prepare(`SELECT "review_id" FROM "budpics" WHERE "id" = 'alt'`).get(), { review_id: null });
});

test("0016: Bild an einer Bewertung, Aktualisieren lässt es stehen, Löschen nimmt es mit", () => {
  const db = datenbank();
  neu(db, "b1", "r1");
  db.prepare(`UPDATE "reviews" SET "notiz" = 'neu' WHERE "id" = 'r1'`).run();
  assert.equal((db.prepare(`SELECT COUNT(*) AS n FROM "budpics" WHERE "review_id" = 'r1'`).get() as { n: number }).n, 1);
  db.prepare(`DELETE FROM "reviews" WHERE "id" = 'r1'`).run();
  assert.equal((db.prepare(`SELECT COUNT(*) AS n FROM "budpics" WHERE "id" = 'b1'`).get() as { n: number }).n, 0);
  assert.equal((db.prepare(`SELECT COUNT(*) AS n FROM "budpics" WHERE "id" = 'alt'`).get() as { n: number }).n, 1);
});

test("0016: unbekannte Bewertung wird abgewiesen", () => {
  const db = datenbank();
  assert.throws(() => neu(db, "b2", "gibt-es-nicht"), /FOREIGN KEY/);
});

test("0016: Index für Bilder je Bewertung und Status", () => {
  const db = datenbank();
  const index = db.prepare(`SELECT "name" FROM sqlite_master WHERE "type" = 'index' AND "name" = 'budpics_review_id_status_idx'`).get();
  assert.ok(index);
});
```

- [ ] **Step 3: Tests laufen lassen, sie scheitern**

Run: `npx tsx --test tests/bewertungsbilder.test.ts tests/bewertungsbilder-migration.test.ts`
Expected: FAIL („Cannot find module '@/lib/bewertungsbilder'“ bzw. ENOENT für `0016_bewertungsbilder.sql`).

- [ ] **Step 4: Migration anlegen**

`migrations/0016_bewertungsbilder.sql` (LF):

```sql
-- 0016_bewertungsbilder
--
-- Bilder zur Bewertung (Spec 2026-10-06): ein Budpic kann zu einer Bewertung
-- gehoeren. Kein neues Bildlager: dieselbe Tabelle, dieselbe Freigabe, dieselbe
-- Route. Ein Bild ohne review_id ist ein freies Budpic wie bisher.
--
-- SQLite erlaubt ADD COLUMN mit REFERENCES, wenn der Standardwert NULL ist.
-- Wird die Bewertung geloescht (Verwerfen in /admin), gehen ihre Bilder mit.

-- AlterTable
ALTER TABLE "budpics" ADD COLUMN "review_id" TEXT
  REFERENCES "reviews" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "budpics_review_id_status_idx" ON "budpics"("review_id", "status");
```

- [ ] **Step 5: Prisma-Schema ergänzen** (CRLF erhalten)

In `model Budpic` nach `erstelltAm …`:

```prisma
  /// Bewertung, zu der das Bild gehoert (Spec 2026-10-06); null = freies Budpic.
  /// Geht mit der Bewertung (Verwerfen in /admin loescht sie).
  reviewId   String?  @map("review_id")
  review     Review?  @relation(fields: [reviewId], references: [id], onDelete: Cascade)
```

und nach `@@index([mitgliedId, status])`:

```prisma
  @@index([reviewId, status])
```

In `model Review` vor dem `@@map("reviews")`-Block (bei den anderen Relationen):

```prisma
  /// Bilder zur Bewertung (Spec 2026-10-06), hoechstens drei belegte.
  bilder Budpic[]
```

Run: `npm run db:generate`
Expected: „Generated Prisma Client“ ohne Fehler.

- [ ] **Step 6: Konstante und reine Logik**

`lib/budpics.ts` nach `BUDPIC_MAX_ANZEIGE`:

```ts
/** Bilder je Bewertung (Spec 2026-10-06, Nutzer): offene und freigegebene zaehlen, abgelehnte nicht. */
export const BEWERTUNGSBILD_MAX = 3;
```

`lib/bewertungsbilder.ts` (LF):

```ts
/**
 * Bilder zur Bewertung (Spec 2026-10-06): reine Regeln ohne Datenbank und
 * Sitzung, damit Server Action, Formular und Tests dieselben nutzen.
 */
import { BEWERTUNGSBILD_MAX, musterBildId } from "@/lib/budpics";
import { blueteBild } from "@/lib/medien";

/** Der Betreiber zeigt sofort, alle anderen warten auf die Freigabe in /admin. */
export function bildStatusFuer(rolle: string): "FREIGEGEBEN" | "OFFEN" {
  return rolle === "ADMIN" ? "FREIGEGEBEN" : "OFFEN";
}

/** Freie Plaetze einer Bewertung: offene und freigegebene belegen, abgelehnte (BLOB geleert) nicht. */
export function bilderFrei(status: readonly string[]): number {
  const belegt = status.filter((s) => s === "OFFEN" || s === "FREIGEGEBEN").length;
  return Math.max(0, BEWERTUNGSBILD_MAX - belegt);
}

/** Wie viele der gewaehlten Dateien der Browser annimmt. */
export function annehmbareDateien(gewaehlt: number, frei: number): number {
  return Math.max(0, Math.min(gewaehlt, frei));
}

/** Ersatzbild ohne eigenes Bild, wie in der Produktkarte: Herstellerbild, sonst Musterbild. */
export function ersatzBildId(bildPfad: string | null | undefined, slug: string): string {
  return blueteBild(bildPfad) ?? musterBildId(slug);
}
```

- [ ] **Step 7: Texte anlegen** (beide Dateien LF, gleiche Schlüssel in gleicher Reihenfolge)

`lib/i18n/de.ts`, Block `buch` (nach `keinText`):

```ts
    bilderDiashow: "Bilder zur Bewertung von {name}",
```

Block `bewerten` (nach `speichert`):

```ts
    bilder: "Bilder zur Bewertung",
    bilderHinweis: "Freiwillig. Bis zu {max} Bilder als JPEG, PNG oder WebP. Sie werden im Browser auf höchstens 1280 Pixel und 150 KB verkleinert.",
    bilderPruefung: "Bilder erscheinen erst nach unserer Prüfung.",
    bilderWaehlen: "Bilder wählen",
    bildEntfernen: "Entfernen",
    bildAbwaehlen: "Nicht senden",
    bildVorgemerkt: "Wird mit der Bewertung gesendet",
    bildStatus: { OFFEN: "Wartet auf Freigabe", FREIGEGEBEN: "Freigegeben", ABGELEHNT: "Abgelehnt" },
    bildLaeuft: "Bild {nr} von {gesamt} wird hochgeladen …",
    bildFehler: "{name}: {grund}",
    bildAlt: "Dein Bild zur Bewertung",
    bilderVoll: "Es gehen nur {max} Bilder je Bewertung. Überzählige Dateien wurden nicht übernommen.",
```

Block `meldung` (nach `"budpic.fehlgeschlagen"`):

```ts
    "bewertungsbild.ohneBewertung": "Speichere zuerst deine Bewertung, dann lassen sich Bilder dazu hochladen.",
    "bewertungsbild.zuViele": "Zu einer Bewertung gehören höchstens {max} Bilder.",
    "bewertungsbild.unbekannt": "Das Bild gibt es nicht mehr.",
```

`lib/i18n/en.ts`, an denselben Stellen:

```ts
    bilderDiashow: "Images with the review by {name}",
```

```ts
    bilder: "Images with your review",
    bilderHinweis: "Optional. Up to {max} images as JPEG, PNG or WebP. Your browser scales them down to at most 1280 pixels and 150 KB.",
    bilderPruefung: "Images appear only after we have reviewed them.",
    bilderWaehlen: "Choose images",
    bildEntfernen: "Remove",
    bildAbwaehlen: "Do not send",
    bildVorgemerkt: "Will be sent with the review",
    bildStatus: { OFFEN: "Awaiting approval", FREIGEGEBEN: "Approved", ABGELEHNT: "Rejected" },
    bildLaeuft: "Uploading image {nr} of {gesamt} …",
    bildFehler: "{name}: {grund}",
    bildAlt: "Your image with the review",
    bilderVoll: "A review can have only {max} images. Extra files were not added.",
```

```ts
    "bewertungsbild.ohneBewertung": "Save your review first, then you can upload images with it.",
    "bewertungsbild.zuViele": "A review can have at most {max} images.",
    "bewertungsbild.unbekannt": "This image no longer exists.",
```

- [ ] **Step 8: Tests laufen lassen, sie bestehen**

Run: `npx tsx --test tests/bewertungsbilder.test.ts tests/bewertungsbilder-migration.test.ts tests/i18n-woerterbuch.test.ts tests/i18n-schema.test.ts`
Expected: PASS.
Run: `npx tsc --noEmit -p .` und `npx eslint lib/bewertungsbilder.ts lib/budpics.ts lib/i18n/de.ts lib/i18n/en.ts tests/bewertungsbilder.test.ts tests/bewertungsbilder-migration.test.ts`
Expected: keine Fehler.

- [ ] **Step 9: Commit**

```bash
git add migrations/0016_bewertungsbilder.sql prisma/schema.prisma lib/budpics.ts lib/bewertungsbilder.ts lib/i18n/de.ts lib/i18n/en.ts tests/bewertungsbilder.test.ts tests/bewertungsbilder-migration.test.ts
git commit -m "feat: Fundament für Bilder zur Bewertung (review_id an budpics, Regeln, Texte)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Server Actions und Vorschau eigener offener Bilder (Strang A)

**Files:**
- Create: `app/[lang]/blueten/[slug]/bewertungsbild-aktionen.ts` (LF)
- Modify: `app/api/bild/offen/[id]/route.ts` (LF, ganze Datei)
- Modify: `components/medien/Bild.tsx` (nur Kommentar an `offen`)
- Test: `tests/bewertungsbild-aktionen.test.ts` (neu), `tests/i18n-literale.test.ts` (Eintrag nach Zeile 62)

**Interfaces:**
- Consumes (Task 1): `bildStatusFuer`, `bilderFrei`, `BEWERTUNGSBILD_MAX`, Meldungen `bewertungsbild.*`, `Budpic.reviewId`, `Review.bilder`.
- Produces:
  - `bewertungsbildHochladen(formData: FormData): Promise<BewertungsbildErgebnis>`; Felder `strainId`, `bild` (File).
  - `BewertungsbildErgebnis = { ok: true; id: string; sofortSichtbar: boolean } | { ok: false; fehler: string }`
  - `bewertungsbildEntfernen(formData: FormData): Promise<{ ok: true } | { ok: false; fehler: string }>`; Feld `id`.
  - `/api/bild/offen/<id>` liefert dem Eigentümer und dem Betreiber.

- [ ] **Step 1: Failing Wächtertest schreiben**

Die Aktionen brauchen D1 und Sitzung und lassen sich hier nicht ausführen; die Regeln liegen in Task 1 getestet vor. Dieser Test sichert die Sicherheitsregeln am Quelltext ab, wie `tests/i18n-literale.test.ts`.

`tests/bewertungsbild-aktionen.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const lies = (pfad: string) => readFileSync(join(process.cwd(), pfad), "utf8");
const AKTION = lies("app/[lang]/blueten/[slug]/bewertungsbild-aktionen.ts");
const OFFEN = lies("app/api/bild/offen/[id]/route.ts");

test("Aktion: Server Action, Sitzung zuerst, Mitglied nie aus dem Formular", () => {
  assert.match(AKTION, /^"use server";/);
  assert.ok(AKTION.indexOf("freigabeErforderlich()") < AKTION.indexOf("formData.get(\"bild\")"));
  assert.doesNotMatch(AKTION, /formData\.get\("(mitgliedId|autorId|reviewId|status)"\)/);
});

test("Aktion: Größe vor dem Einlesen, dann bildPruefen, Status aus der Rolle, Grenze aus bilderFrei", () => {
  assert.ok(AKTION.indexOf("BUDPIC_MAX_BYTES)") < AKTION.indexOf("arrayBuffer()"));
  assert.match(AKTION, /bildPruefen\(bytes/);
  assert.match(AKTION, /bildStatusFuer\(mitglied\.rolle\)/);
  assert.match(AKTION, /bilderFrei\(/);
  assert.match(AKTION, /BUDPIC_MAX_OFFEN/);
});

test("Aktion: Entfernen nur eigener Bilder einer Bewertung", () => {
  assert.match(AKTION, /mitgliedId: mitglied\.mitgliedId, reviewId: \{ not: null \}/);
});

test("Offene Vorschau: Betreiber oder Eigentümer, sonst 404, nie gecacht", () => {
  assert.match(OFFEN, /mitglied\.rolle !== "ADMIN" && bild\.mitgliedId !== mitglied\.mitgliedId/);
  assert.match(OFFEN, /private, no-store/);
});
```

- [ ] **Step 2: Test laufen lassen, er scheitert**

Run: `npx tsx --test tests/bewertungsbild-aktionen.test.ts`
Expected: FAIL mit ENOENT für `bewertungsbild-aktionen.ts`.

- [ ] **Step 3: Server Actions schreiben**

`app/[lang]/blueten/[slug]/bewertungsbild-aktionen.ts`:

```ts
"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";

import { bildStatusFuer, bilderFrei } from "@/lib/bewertungsbilder";
import { BEWERTUNGSBILD_MAX, BUDPIC_MAX_BYTES, BUDPIC_MAX_KANTE, BUDPIC_MAX_OFFEN, istBudpicId } from "@/lib/budpics";
import { bildPruefen } from "@/lib/bild-pruefen";
import { holeWoerterbuchAusAnfrage } from "@/lib/i18n/anfrage";
import { meldungText } from "@/lib/i18n/text";
import type { Meldung } from "@/lib/i18n/typen";
import { getPrisma } from "@/lib/prisma";
import { freigabeErforderlich } from "@/lib/session";

export type BewertungsbildErgebnis = { ok: true; id: string; sofortSichtbar: boolean } | { ok: false; fehler: string };
export type BewertungsbildEntfernenErgebnis = { ok: true } | { ok: false; fehler: string };

/** Blütenseite und /admin immer; Katalog und Startseite nur, wenn das Bild öffentlich war oder ist. */
function neuLaden(slug: string, oeffentlich: boolean) {
  revalidiereSprachen("/admin");
  revalidiereSprachen(`/blueten/${slug}`);
  if (!oeffentlich) return;
  revalidiereSprachen("/blueten");
  revalidiereSprachen("/");
}

/**
 * Ein Bild zur eigenen Bewertung (Spec 2026-10-06). Eine Datei je Aufruf, wie
 * budpicHochladen: der Browser hat sie schon verkleinert, der Server prüft
 * trotzdem Größe (vor dem Lesen), Typ und Maße. Mitglied und Bewertung kommen
 * aus der Sitzung, nie aus dem Formular. Der Betreiber zeigt sofort, alle
 * anderen warten auf die Freigabe in /admin. Ein einziges INSERT, also atomar.
 */
export async function bewertungsbildHochladen(formData: FormData): Promise<BewertungsbildErgebnis> {
  const w = await holeWoerterbuchAusAnfrage();
  const fehler = (meldung: Meldung): BewertungsbildErgebnis => ({ ok: false, fehler: meldungText(w, meldung) });

  let mitglied;
  try {
    mitglied = await freigabeErforderlich();
  } catch {
    return fehler({ schluessel: "budpic.nurFreigeschaltet" });
  }

  const datei = formData.get("bild");
  if (!(datei instanceof File) || datei.size === 0) return fehler({ schluessel: "bild.fehlt" });
  // Vor dem Einlesen ablehnen: ein großer Body soll keinen Speicher kosten.
  if (datei.size > BUDPIC_MAX_BYTES) return fehler({ schluessel: "bild.zuGross", parameter: { max: BUDPIC_MAX_BYTES / 1024 } });
  const bytes = new Uint8Array(await datei.arrayBuffer());
  const geprueft = bildPruefen(bytes, { maxBytes: BUDPIC_MAX_BYTES, maxBreite: BUDPIC_MAX_KANTE, maxHoehe: BUDPIC_MAX_KANTE });
  if (!geprueft.ok) return fehler(geprueft.fehler);

  const prisma = await getPrisma();
  const strain = await prisma.strain.findUnique({
    where: { id: String(formData.get("strainId") ?? "") },
    select: { id: true, slug: true, aktiv: true },
  });
  if (!strain || !strain.aktiv) return fehler({ schluessel: "budpic.sorteUnbekannt" });

  const review = await prisma.review.findUnique({
    where: { autorId_strainId: { autorId: mitglied.mitgliedId, strainId: strain.id } },
    select: { id: true, bilder: { select: { status: true }, take: 50 } },
  });
  if (!review) return fehler({ schluessel: "bewertungsbild.ohneBewertung" });
  if (bilderFrei(review.bilder.map((b) => b.status)) === 0) {
    return fehler({ schluessel: "bewertungsbild.zuViele", parameter: { max: BEWERTUNGSBILD_MAX } });
  }

  const status = bildStatusFuer(mitglied.rolle);
  if (status === "OFFEN") {
    // Dieselbe Warteschlange wie die Budpics: dieselbe Grenze je Mitglied.
    const offen = await prisma.budpic.count({ where: { mitgliedId: mitglied.mitgliedId, status: "OFFEN" } });
    if (offen >= BUDPIC_MAX_OFFEN) return fehler({ schluessel: "budpic.zuVieleOffen", parameter: { max: BUDPIC_MAX_OFFEN } });
  }

  const bild = await prisma.budpic.create({
    data: {
      strainId: strain.id,
      mitgliedId: mitglied.mitgliedId,
      reviewId: review.id,
      daten: bytes,
      breite: geprueft.breite,
      hoehe: geprueft.hoehe,
      status,
    },
    select: { id: true },
  });
  neuLaden(strain.slug, status === "FREIGEGEBEN");
  return { ok: true, id: bild.id, sofortSichtbar: status === "FREIGEGEBEN" };
}

/** Entfernt ein eigenes Bild einer Bewertung; fremde Bilder und freie Budpics bleiben unberührt. */
export async function bewertungsbildEntfernen(formData: FormData): Promise<BewertungsbildEntfernenErgebnis> {
  const w = await holeWoerterbuchAusAnfrage();
  let mitglied;
  try {
    mitglied = await freigabeErforderlich();
  } catch {
    return { ok: false, fehler: meldungText(w, { schluessel: "budpic.nurFreigeschaltet" }) };
  }
  const id = formData.get("id");
  const unbekannt = { ok: false as const, fehler: meldungText(w, { schluessel: "bewertungsbild.unbekannt" }) };
  if (!istBudpicId(id)) return unbekannt;

  const prisma = await getPrisma();
  const bild = await prisma.budpic.findFirst({
    where: { id, mitgliedId: mitglied.mitgliedId, reviewId: { not: null } },
    select: { status: true, strain: { select: { slug: true } } },
  });
  if (!bild) return unbekannt;
  await prisma.budpic.delete({ where: { id } });
  neuLaden(bild.strain.slug, bild.status === "FREIGEGEBEN");
  return { ok: true };
}
```

- [ ] **Step 4: Offene Vorschau für den Eigentümer öffnen**

`app/api/bild/offen/[id]/route.ts` vollständig:

```ts
import { getPrisma } from "@/lib/prisma";
import { istBudpicId } from "@/lib/budpics";
import { aktuellesMitglied } from "@/lib/session";

/**
 * Vorschau eines noch nicht freigegebenen Budpics (T9, Nutzer 2026-09-29) für
 * den Betreiber und, seit den Bildern zur Bewertung (Spec 2026-10-06), für das
 * Mitglied, dem das Bild gehört. Alle anderen bekommen 404, auch bei einer
 * echten id: sie sollen nicht erfahren, dass es das Bild gibt. Nie cachen, nie
 * über die öffentliche Route (/api/bild/<id>) ausliefern.
 */
export async function GET(_anfrage: Request, ctx: { params: Promise<{ id: string }> }) {
  const nichtDa = () => new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const { id } = await ctx.params;
  if (!istBudpicId(id)) return nichtDa();
  const mitglied = await aktuellesMitglied();
  if (!mitglied) return nichtDa();

  const prisma = await getPrisma();
  const bild = await prisma.budpic.findUnique({ where: { id }, select: { daten: true, mitgliedId: true } });
  if (!bild) return nichtDa();
  if (mitglied.rolle !== "ADMIN" && bild.mitgliedId !== mitglied.mitgliedId) return nichtDa();
  return new Response(bild.daten as BodyInit, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
```

In `components/medien/Bild.tsx` den Kommentar an `offen` ersetzen durch:
`/** Vorschau eines noch nicht freigegebenen Bildes (Betreiber oder Eigentümer, /api/bild/offen/<id>, ohne Cache). */`

In `tests/i18n-literale.test.ts` nach `"app/[lang]/blueten/[slug]/aktionen.ts",` einfügen:
`  "app/[lang]/blueten/[slug]/bewertungsbild-aktionen.ts",`

- [ ] **Step 5: Tests laufen lassen, sie bestehen**

Run: `npx tsx --test tests/bewertungsbild-aktionen.test.ts tests/i18n-literale.test.ts`
Expected: PASS.
Run: `npx tsc --noEmit -p .` und `npx eslint "app/[lang]/blueten/[slug]/bewertungsbild-aktionen.ts" "app/api/bild/offen/[id]/route.ts" components/medien/Bild.tsx tests/bewertungsbild-aktionen.test.ts`
Expected: keine Fehler.

- [ ] **Step 6: Commit**

```bash
git add "app/[lang]/blueten/[slug]/bewertungsbild-aktionen.ts" "app/api/bild/offen/[id]/route.ts" components/medien/Bild.tsx tests/bewertungsbild-aktionen.test.ts tests/i18n-literale.test.ts
git commit -m "feat: Bilder zur eigenen Bewertung hochladen und entfernen, offene Vorschau für den Eigentümer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Bilder im Bewertungsformular (Strang A, nach Task 2)

Vor dem Start Skill `ui-design-engine` laden.

**Files:**
- Create: `lib/bewertungsbilder-senden.ts` (LF)
- Create: `components/review/BewertungsBilder.tsx` (LF)
- Modify: `lib/bewertung-vorbelegung.ts` (Typen `GespeicherteBewertung`, `Vorbelegung`, Funktion `vorbelegungAus`)
- Modify: `lib/query/strains.ts` (CRLF; nur `ladeEigeneBewertung`, ab Zeile 1194)
- Modify: `components/review/BewertungsFormular.tsx` (CRLF)
- Modify: `app/[lang]/blueten/[slug]/page.tsx` (Prop `bildMeldungen` an `BewertungsFormular`)
- Test: `tests/bewertungsbilder-senden.test.ts` (neu), `tests/bewertung-vorbelegung.test.ts`, `tests/bewertungs-bilder.test.ts` (neu), `tests/i18n-literale.test.ts` (Eintrag nach `"components/review/BewertungsFormular.tsx",`)

**Interfaces:**
- Consumes: Task 1 (`annehmbareDateien`, `bilderFrei`, `BEWERTUNGSBILD_MAX`, Texte `w.bewerten.bild*`), Task 2 (`bewertungsbildHochladen`, `bewertungsbildEntfernen`, `BewertungsbildErgebnis`), bestehend `bildVerkleinernFrei(datei, { maxKante, maxBytes })`, `budpicMeldungen(w)`.
- Produces:
  - `VorgemerktesBild = { schluessel: string; name: string; blob: Blob; breite: number; hoehe: number; vorschau: string }`
  - `bilderSenden(bilder, strainId, senden, optionen): Promise<{ gesendet: number; uebrig: VorgemerktesBild[]; fehler: string[] }>`
  - `VorbelegtesBild = { id: string; breite: number; hoehe: number; status: BudpicStatus }`, `Vorbelegung.bilder: VorbelegtesBild[]`

- [ ] **Step 1: Failing Test für das Senden schreiben**

`tests/bewertungsbilder-senden.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { bilderSenden, type VorgemerktesBild } from "@/lib/bewertungsbilder-senden";

const bild = (name: string): VorgemerktesBild => ({
  schluessel: name,
  name,
  blob: new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" }),
  breite: 10,
  hoehe: 10,
  vorschau: `blob:${name}`,
});
const OPTIONEN = { fehlgeschlagen: "Sitzung weg", dateiFehler: "{name}: {grund}" };

test("bilderSenden: eine Datei je Aufruf mit strainId, Fortschritt je Bild", async () => {
  const gesehen: string[] = [];
  const stand: string[] = [];
  const lauf = await bilderSenden([bild("a.jpg"), bild("b.jpg")], "s1", async (daten) => {
    const datei = daten.get("bild") as File;
    gesehen.push(`${daten.get("strainId")}|${datei.type}|${datei.name}`);
    return { ok: true, id: "x", sofortSichtbar: false };
  }, { ...OPTIONEN, fortschritt: (nr, gesamt) => stand.push(`${nr}/${gesamt}`) });
  assert.deepEqual(gesehen, ["s1|image/webp|bewertungsbild.webp", "s1|image/webp|bewertungsbild.webp"]);
  assert.deepEqual(stand, ["1/2", "2/2"]);
  assert.deepEqual(lauf, { gesendet: 2, uebrig: [], fehler: [] });
});

test("bilderSenden: Fehler und geworfene Fehler bleiben vorgemerkt, die übrigen laufen weiter", async () => {
  const a = bild("a.jpg");
  const b = bild("b.jpg");
  const c = bild("c.jpg");
  let n = 0;
  const lauf = await bilderSenden([a, b, c], "s1", async () => {
    n += 1;
    if (n === 1) return { ok: false, fehler: "zu groß" };
    if (n === 2) throw new Error("Netz");
    return { ok: true, id: "x", sofortSichtbar: true };
  }, { ...OPTIONEN, fortschritt: () => {} });
  assert.equal(lauf.gesendet, 1);
  assert.deepEqual(lauf.uebrig, [a, b]);
  assert.deepEqual(lauf.fehler, ["a.jpg: zu groß", "b.jpg: Sitzung weg"]);
});

test("bilderSenden: ohne Bilder kein Aufruf", async () => {
  let aufrufe = 0;
  const lauf = await bilderSenden([], "s1", async () => {
    aufrufe += 1;
    return { ok: true, id: "x", sofortSichtbar: false };
  }, { ...OPTIONEN, fortschritt: () => {} });
  assert.equal(aufrufe, 0);
  assert.deepEqual(lauf, { gesendet: 0, uebrig: [], fehler: [] });
});
```

- [ ] **Step 2: Failing Tests für Vorbelegung und Komponente schreiben**

In `tests/bewertung-vorbelegung.test.ts` ergänzen (die Hilfsfunktion `gespeichert` existiert dort):

```ts
test("vorbelegungAus: Bilder der eigenen Bewertung mit Status, ohne Angabe leer", () => {
  assert.deepEqual(vorbelegungAus(gespeichert()).bilder, []);
  const bilder = [
    { id: "3f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc", breite: 800, hoehe: 600, status: "OFFEN" },
    { id: "4f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc", breite: 600, hoehe: 800, status: "unsinn" },
  ];
  assert.deepEqual(vorbelegungAus(gespeichert({ bilder })).bilder, [
    { id: "3f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc", breite: 800, hoehe: 600, status: "OFFEN" },
    { id: "4f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc", breite: 600, hoehe: 800, status: "ABGELEHNT" },
  ]);
});
```

`tests/bewertungs-bilder.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BewertungsBilder } from "@/components/review/BewertungsBilder";
import { budpicMeldungen } from "@/lib/budpic-anzeige";
import { de } from "@/lib/i18n/de";

const ID = (n: number) => `${n}f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc`;
const zeige = (vorhanden: { id: string; breite: number; hoehe: number; status: "OFFEN" | "FREIGEGEBEN" | "ABGELEHNT" }[], istBetreiber = false) =>
  renderToStaticMarkup(
    createElement(BewertungsBilder, {
      vorhanden,
      vorgemerkt: [],
      setVorgemerkt: () => {},
      istBetreiber,
      gesperrt: false,
      meldungen: budpicMeldungen(de),
      texte: de.bewerten,
      onGeaendert: () => {},
    }),
  );

test("Bilder: Überschrift, Hinweis mit Höchstzahl, Prüfhinweis nur für die Community", () => {
  const html = zeige([]);
  assert.match(html, /Bilder zur Bewertung/);
  assert.match(html, /Bis zu 3 Bilder/);
  assert.match(html, /erst nach unserer Prüfung/);
  assert.doesNotMatch(zeige([], true), /erst nach unserer Prüfung/);
});

test("Bilder: vorhandene mit Status; offene über die private Vorschau, abgelehnte ohne Bild", () => {
  const html = zeige([
    { id: ID(1), breite: 800, hoehe: 600, status: "FREIGEGEBEN" },
    { id: ID(2), breite: 800, hoehe: 600, status: "OFFEN" },
    { id: ID(3), breite: 800, hoehe: 600, status: "ABGELEHNT" },
  ]);
  assert.match(html, new RegExp(`src="/api/bild/${ID(1)}"`));
  assert.match(html, new RegExp(`src="/api/bild/offen/${ID(2)}"`));
  assert.doesNotMatch(html, new RegExp(`/api/bild/(offen/)?${ID(3)}`));
  assert.match(html, /Freigegeben/);
  assert.match(html, /Wartet auf Freigabe/);
  assert.match(html, /Abgelehnt/);
});

test("Bilder: Wählen bis zur Hydrierung gesperrt, bei drei belegten gar nicht da", () => {
  assert.match(zeige([]), /<button[^>]*disabled[^>]*>Bilder wählen<\/button>/);
  const voll = zeige([1, 2, 3].map((n) => ({ id: ID(n), breite: 1, hoehe: 1, status: "OFFEN" as const })));
  assert.doesNotMatch(voll, /Bilder wählen/);
});
```

- [ ] **Step 3: Tests laufen lassen, sie scheitern**

Run: `npx tsx --test tests/bewertungsbilder-senden.test.ts tests/bewertung-vorbelegung.test.ts tests/bewertungs-bilder.test.ts`
Expected: FAIL (Module fehlen, `bilder` undefined).

- [ ] **Step 4: `lib/bewertungsbilder-senden.ts` schreiben**

```ts
/**
 * Vorgemerkte Bilder nach dem Speichern der Bewertung senden (Spec 2026-10-06):
 * eines nach dem anderen, ein Fehler trifft nur diese Datei. Was scheitert,
 * bleibt vorgemerkt, damit ein erneutes Absenden nur das schickt. Der Sender
 * wird hereingereicht (Server Action im Browser, Attrappe im Test).
 */
import { t } from "@/lib/i18n/text";

export type VorgemerktesBild = {
  /** Stabiler Schlüssel für die Liste. */
  schluessel: string;
  /** Dateiname der Auswahl, nur für Meldungen. */
  name: string;
  /** Schon verkleinertes WebP (lib/bild-verkleinern.ts). */
  blob: Blob;
  breite: number;
  hoehe: number;
  /** Object-URL für die Vorschau; wer sie anlegt, gibt sie wieder frei. */
  vorschau: string;
};

type SendeErgebnis = { ok: true; id: string; sofortSichtbar: boolean } | { ok: false; fehler: string };

export async function bilderSenden(
  bilder: readonly VorgemerktesBild[],
  strainId: string,
  senden: (daten: FormData) => Promise<SendeErgebnis>,
  optionen: { fortschritt: (nr: number, gesamt: number) => void; fehlgeschlagen: string; dateiFehler: string },
): Promise<{ gesendet: number; uebrig: VorgemerktesBild[]; fehler: string[] }> {
  let gesendet = 0;
  const uebrig: VorgemerktesBild[] = [];
  const fehler: string[] = [];
  for (const [i, bild] of bilder.entries()) {
    optionen.fortschritt(i + 1, bilder.length);
    const daten = new FormData();
    daten.set("strainId", strainId);
    daten.set("bild", new File([bild.blob], "bewertungsbild.webp", { type: "image/webp" }));
    let ergebnis: SendeErgebnis;
    try {
      ergebnis = await senden(daten);
    } catch {
      // Geworfener Serverfehler (z. B. abgelaufene Sitzung): weiter mit dem nächsten Bild.
      ergebnis = { ok: false, fehler: optionen.fehlgeschlagen };
    }
    if (ergebnis.ok) {
      gesendet += 1;
    } else {
      uebrig.push(bild);
      fehler.push(t(optionen.dateiFehler, { name: bild.name, grund: ergebnis.fehler }));
    }
  }
  return { gesendet, uebrig, fehler };
}
```

- [ ] **Step 5: Vorbelegung und Abfrage erweitern**

`lib/bewertung-vorbelegung.ts`: oben `import { BUDPIC_STATUS, type BudpicStatus } from "@/lib/budpics";` ergänzen.

In `GespeicherteBewertung` ergänzen:

```ts
  /** Bilder der eigenen Bewertung (Spec 2026-10-06), ohne BLOB; fehlt bei Altaufrufen. */
  bilder?: { id: string; breite: number; hoehe: number; status: string }[];
```

Neuer Typ vor `Vorbelegung`:

```ts
export type VorbelegtesBild = { id: string; breite: number; hoehe: number; status: BudpicStatus };
```

In `Vorbelegung` ergänzen:

```ts
  /** Eigene Bilder zur Bewertung mit Status; leer ohne Bilder. */
  bilder: VorbelegtesBild[];
```

In `vorbelegungAus` im Rückgabeobjekt nach `instagramReelUrl` ergänzen:

```ts
    // Unbekannter Status zählt als abgelehnt: dann wird nichts angezeigt und der Platz bleibt frei.
    bilder: (review.bilder ?? []).map((b) => ({
      id: b.id,
      breite: b.breite,
      hoehe: b.hoehe,
      status: (BUDPIC_STATUS as readonly string[]).includes(b.status) ? (b.status as BudpicStatus) : "ABGELEHNT",
    })),
```

`lib/query/strains.ts`, in `ladeEigeneBewertung` im `select` nach `charge: …`:

```ts
      bilder: { select: { id: true, breite: true, hoehe: true, status: true }, orderBy: { erstelltAm: "asc" }, take: 10 },
```

- [ ] **Step 6: Komponente `components/review/BewertungsBilder.tsx` schreiben**

```tsx
"use client";

import { useRef, useState } from "react";

import { bewertungsbildEntfernen } from "@/app/[lang]/blueten/[slug]/bewertungsbild-aktionen";
import { BudpicBild } from "@/components/medien/Bild";
import { Button } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import type { VorbelegtesBild } from "@/lib/bewertung-vorbelegung";
import { annehmbareDateien, bilderFrei } from "@/lib/bewertungsbilder";
import type { VorgemerktesBild } from "@/lib/bewertungsbilder-senden";
import { bildVerkleinernFrei } from "@/lib/bild-verkleinern";
import { BEWERTUNGSBILD_MAX, BUDPIC_MAX_BYTES, BUDPIC_MAX_KANTE } from "@/lib/budpics";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = {
  vorhanden: readonly VorbelegtesBild[];
  vorgemerkt: readonly VorgemerktesBild[];
  setVorgemerkt: (neu: VorgemerktesBild[]) => void;
  istBetreiber: boolean;
  /** Während des Speicherns: nichts wählen, nichts entfernen. */
  gesperrt: boolean;
  /** budpicMeldungen(w): Texte für Fehler beim Verkleinern. */
  meldungen: Record<string, string>;
  texte: Woerterbuch["bewerten"];
  /** Nach dem Entfernen eines gespeicherten Bildes: Seite neu vom Server. */
  onGeaendert: () => void;
};

/** 96 px Kante je Kachel (8-px-Raster). */
const KACHEL = "size-24 overflow-hidden border border-border bg-surface-sunken";

/**
 * Bilder zur Bewertung im Formular (Spec 2026-10-06): gespeicherte mit Status,
 * vorgemerkte mit Vorschau. Gewählte Dateien werden sofort im Browser
 * verkleinert; gesendet wird erst nach dem Speichern der Bewertung
 * (BewertungsFormular, lib/bewertungsbilder-senden.ts).
 */
export function BewertungsBilder({ vorhanden, vorgemerkt, setVorgemerkt, istBetreiber, gesperrt, meldungen, texte, onGeaendert }: Props) {
  const hydriert = useHydriert();
  const eingabe = useRef<HTMLInputElement>(null);
  const [fehler, setFehler] = useState<string[]>([]);
  const [entfernt, setEntfernt] = useState<string | null>(null);
  const frei = bilderFrei(vorhanden.map((b) => b.status)) - vorgemerkt.length;

  async function gewaehlt(ereignis: React.ChangeEvent<HTMLInputElement>) {
    const alle = Array.from(ereignis.target.files ?? []);
    ereignis.target.value = "";
    const anzahl = annehmbareDateien(alle.length, frei);
    const zeilen: string[] = alle.length > anzahl ? [t(texte.bilderVoll, { max: BEWERTUNGSBILD_MAX })] : [];
    const neu: VorgemerktesBild[] = [];
    for (const datei of alle.slice(0, anzahl)) {
      const klein = await bildVerkleinernFrei(datei, { maxKante: BUDPIC_MAX_KANTE, maxBytes: BUDPIC_MAX_BYTES });
      if (!klein.ok) {
        const grund = t(meldungen[klein.fehler.schluessel] ?? meldungen["budpic.fehlgeschlagen"], klein.fehler.parameter);
        zeilen.push(t(texte.bildFehler, { name: datei.name, grund }));
        continue;
      }
      neu.push({
        schluessel: `${datei.name}-${datei.lastModified}-${neu.length}-${vorgemerkt.length}`,
        name: datei.name,
        blob: klein.blob,
        breite: klein.breite,
        hoehe: klein.hoehe,
        vorschau: URL.createObjectURL(klein.blob),
      });
    }
    setFehler(zeilen);
    setVorgemerkt([...vorgemerkt, ...neu]);
  }

  function abwaehlen(bild: VorgemerktesBild) {
    URL.revokeObjectURL(bild.vorschau);
    setVorgemerkt(vorgemerkt.filter((b) => b !== bild));
  }

  async function entfernen(id: string) {
    setEntfernt(id);
    const daten = new FormData();
    daten.set("id", id);
    const ergebnis = await bewertungsbildEntfernen(daten);
    setEntfernt(null);
    setFehler(ergebnis.ok ? [] : [ergebnis.fehler]);
    if (ergebnis.ok) onGeaendert();
  }

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-body font-medium text-text">{texte.bilder}</h4>
      <p className="max-w-[60ch] text-small text-text-muted">
        {t(texte.bilderHinweis, { max: BEWERTUNGSBILD_MAX })}
        {istBetreiber ? null : ` ${texte.bilderPruefung}`}
      </p>
      {vorhanden.length + vorgemerkt.length > 0 ? (
        <ul className="flex flex-wrap gap-4">
          {vorhanden.map((b) => (
            <li key={b.id} className="flex w-24 flex-col gap-2">
              <div className={KACHEL}>
                {b.status === "ABGELEHNT" ? null : (
                  <BudpicBild id={b.id} offen={b.status === "OFFEN"} breite={b.breite} hoehe={b.hoehe} alt={texte.bildAlt} className="size-full object-cover" />
                )}
              </div>
              <span className="text-caption text-text-muted">{texte.bildStatus[b.status]}</span>
              <Button type="button" variante="ghost" groesse="sm" disabled={!hydriert || gesperrt || entfernt !== null} onClick={() => entfernen(b.id)}>
                {texte.bildEntfernen}
              </Button>
            </li>
          ))}
          {vorgemerkt.map((b) => (
            <li key={b.schluessel} className="flex w-24 flex-col gap-2">
              <div className={KACHEL}>
                <img src={b.vorschau} width={b.breite} height={b.hoehe} alt={texte.bildAlt} className="size-full object-cover" />
              </div>
              <span className="text-caption text-text-muted">{texte.bildVorgemerkt}</span>
              <Button type="button" variante="ghost" groesse="sm" disabled={gesperrt} onClick={() => abwaehlen(b)}>
                {texte.bildAbwaehlen}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {frei > 0 ? (
        <>
          <input
            ref={eingabe}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={gewaehlt}
            tabIndex={-1}
            aria-hidden="true"
          />
          <div>
            <Button type="button" variante="secondary" groesse="sm" disabled={!hydriert || gesperrt} onClick={() => eingabe.current?.click()}>
              {texte.bilderWaehlen}
            </Button>
          </div>
        </>
      ) : null}
      {fehler.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-1 text-small text-danger">
          {fehler.map((zeile, i) => (
            <li key={i}>{zeile}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
```

Die Datei-Eingabe hat kein `name`: sie geht nicht in das `FormData` der Bewertung.

- [ ] **Step 7: Formular verdrahten** (CRLF erhalten)

`components/review/BewertungsFormular.tsx`:

Imports ergänzen:

```tsx
import { bewertungsbildHochladen } from "@/app/[lang]/blueten/[slug]/bewertungsbild-aktionen";
import { BewertungsBilder } from "@/components/review/BewertungsBilder";
import { bilderSenden, type VorgemerktesBild } from "@/lib/bewertungsbilder-senden";
```

In `Props` ergänzen:

```tsx
  /** budpicMeldungen(w): Fehlertexte für das Verkleinern der Bilder im Browser. */
  bildMeldungen: Record<string, string>;
```

und `bildMeldungen` in der Destrukturierung der Props aufnehmen. Zustände nach `eigeneGesamtnote`:

```tsx
  const [vorgemerkt, setVorgemerkt] = useState<VorgemerktesBild[]>([]);
  const [bildLauf, setBildLauf] = useState<{ nr: number; gesamt: number } | null>(null);
```

`absenden` ab `const ergebnis = await bewertungSpeichern(formular);` ersetzen durch:

```tsx
    const ergebnis = await bewertungSpeichern(formular);
    if (!ergebnis.ok) {
      setLaeuft(false);
      setFehler(ergebnis.fehler);
      return;
    }
    // Die Bewertung steht; erst jetzt die Bilder, eines nach dem anderen (Spec 2026-10-06).
    const mitBildern = vorgemerkt.length > 0;
    let bildFehler: string[] = [];
    if (mitBildern) {
      const lauf = await bilderSenden(vorgemerkt, strainId, bewertungsbildHochladen, {
        fortschritt: (nr, gesamt) => setBildLauf({ nr, gesamt }),
        fehlgeschlagen: bildMeldungen["budpic.fehlgeschlagen"],
        dateiFehler: texte.bildFehler,
      });
      for (const bild of vorgemerkt) if (!lauf.uebrig.includes(bild)) URL.revokeObjectURL(bild.vorschau);
      setVorgemerkt(lauf.uebrig);
      bildFehler = lauf.fehler;
      setBildLauf(null);
    }
    setLaeuft(false);
    setGespeichert(true);
    const basis = ergebnis.sofortSichtbar ? texte.gespeichert : texte.eingegangen;
    setErfolg(mitBildern && !istBetreiber ? `${basis} ${texte.bilderPruefung}` : basis);
    if (bildFehler.length > 0) setFehler(bildFehler.join(" "));
    // Community-Werte, Vorbelegung und Bilder neu vom Server; die Maske bleibt stehen.
    router.refresh();
```

(Der bisherige Block `setLaeuft(false); if (!ergebnis.ok) {…} setGespeichert(true); setErfolg(…); router.refresh();` entfällt dabei vollständig.)

Im Abschnitt „Charge und Notiz“ nach dem Notiz-`Field` und vor dem Reel einfügen:

```tsx
        <BewertungsBilder
          vorhanden={vorbelegung?.bilder ?? []}
          vorgemerkt={vorgemerkt}
          setVorgemerkt={setVorgemerkt}
          istBetreiber={istBetreiber}
          gesperrt={laeuft}
          meldungen={bildMeldungen}
          texte={texte}
          onGeaendert={() => router.refresh()}
        />
```

Knopftext: den Ausdruck `laeuft ? texte.speichert : …` ersetzen durch `bildLauf ? t(texte.bildLaeuft, bildLauf) : laeuft ? texte.speichert : …` (Rest unverändert).

`app/[lang]/blueten/[slug]/page.tsx`: am `<BewertungsFormular …>` die Prop `bildMeldungen={budpicMeldungen(w)}` ergänzen und `budpicMeldungen` aus `@/lib/budpic-anzeige` zum bestehenden Import `alsDiashow` hinzunehmen.

`tests/i18n-literale.test.ts`: nach `"components/review/BewertungsFormular.tsx",` einfügen `  "components/review/BewertungsBilder.tsx",`.

- [ ] **Step 8: Tests laufen lassen, sie bestehen**

Run: `npx tsx --test tests/bewertungsbilder-senden.test.ts tests/bewertung-vorbelegung.test.ts tests/bewertungs-bilder.test.ts tests/bewertung-maske.test.ts tests/i18n-literale.test.ts`
Expected: PASS.
Run: `npm test`, `npx tsc --noEmit -p .`, `npx eslint lib/bewertungsbilder-senden.ts lib/bewertung-vorbelegung.ts lib/query/strains.ts components/review/BewertungsBilder.tsx components/review/BewertungsFormular.tsx "app/[lang]/blueten/[slug]/page.tsx"`
Expected: alles grün. Meldet eslint `@next/next/no-img-element` für die Vorschau, eine Zeile `{/* eslint-disable-next-line @next/next/no-img-element -- Object-URL der lokalen Vorschau */}` direkt über dem `<img>` setzen.

- [ ] **Step 9: Commit**

```bash
git add lib/bewertungsbilder-senden.ts lib/bewertung-vorbelegung.ts lib/query/strains.ts components/review/BewertungsBilder.tsx components/review/BewertungsFormular.tsx "app/[lang]/blueten/[slug]/page.tsx" tests/bewertungsbilder-senden.test.ts tests/bewertung-vorbelegung.test.ts tests/bewertungs-bilder.test.ts tests/i18n-literale.test.ts
git commit -m "feat: Bilder im Bewertungsformular wählen, vormerken und nach dem Speichern senden

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Bilder der Bewertungen für das Buch laden (Strang B)

**Files:**
- Modify: `lib/query/strains.ts` (CRLF; Typ `ReviewEintrag` ab Zeile 169, `reviews`-Select und -Mapping in der Detailabfrage ab Zeile ~600 und ~694)
- Modify: `components/review/eintrag.ts` (Typ `EintragDaten`, Funktion `alsEintrag`)
- Modify: `lib/budpic-anzeige.ts` (neue Funktion `alsBuchBilder`)
- Test: `tests/budpics-anzeige.test.ts`, `tests/autoren.test.ts`

**Interfaces:**
- Consumes: Task 1 (`Review.bilder`).
- Produces:
  - `ReviewBild = { id: string; breite: number; hoehe: number; erstelltAm: Date }` (exportiert aus `lib/query/strains.ts`)
  - `ReviewEintrag.bilder?: ReviewBild[]`, `EintragDaten.bilder?: ReviewBild[]`
  - `alsBuchBilder(liste: readonly ReviewBild[], sprache: Sprache): DiashowBild[]` (Beschriftung nur Datum)

- [ ] **Step 1: Failing Tests schreiben**

In `tests/budpics-anzeige.test.ts` den Import auf `import { alsBuchBilder, alsDiashow, budpicMeldungen } from "@/lib/budpic-anzeige";` ändern und ergänzen:

```ts
test("alsBuchBilder: nur das Datum, der Name steht schon im Kopf der Seite", () => {
  const bilder = alsBuchBilder([{ id: liste[0].id, breite: 1280, hoehe: 960, erstelltAm: TAG }], "de");
  assert.deepEqual(bilder, [{ id: liste[0].id, breite: 1280, hoehe: 960, beschriftung: "12.09.2026" }]);
  assert.deepEqual(alsBuchBilder([], "en"), []);
});
```

In `tests/autoren.test.ts` (Fixture `REVIEW` existiert dort) ergänzen:

```ts
test("alsEintrag reicht die Bilder der Bewertung durch, ohne Bilder leer", () => {
  const produkt = { handelsname: "Nebelharz 22 (fiktiv)", slug: "nebelharz-22" };
  const bilder = [{ id: "3f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc", breite: 800, hoehe: 600, erstelltAm: new Date("2026-10-01T10:00:00Z") }];
  assert.deepEqual(alsEintrag({ ...REVIEW, bilder }, produkt).bilder, bilder);
  assert.deepEqual(alsEintrag(REVIEW, produkt).bilder, []);
});
```

- [ ] **Step 2: Tests laufen lassen, sie scheitern**

Run: `npx tsx --test tests/budpics-anzeige.test.ts tests/autoren.test.ts`
Expected: FAIL (`alsBuchBilder` fehlt, `bilder` undefined).

- [ ] **Step 3: Typen und Abfrage** (CRLF erhalten)

`lib/query/strains.ts` vor `export type ReviewEintrag`:

```ts
/** Ein freigegebenes Bild zu einer Bewertung (Spec 2026-10-06), ohne BLOB. */
export type ReviewBild = { id: string; breite: number; hoehe: number; erstelltAm: Date };
```

In `ReviewEintrag` ergänzen:

```ts
  /** Freigegebene Bilder der Bewertung, älteste zuerst, höchstens drei; fehlt außerhalb der Blütenseite. */
  bilder?: ReviewBild[];
```

Im `reviews`-Select der Detailabfrage (nach `autor: { select: … }`):

```ts
          // Nur freigegebene, nie mit BLOB; Prisma lädt sie in einer Abfrage mit IN über höchstens 20 Ids.
          bilder: {
            where: { status: "FREIGEGEBEN" },
            select: { id: true, breite: true, hoehe: true, erstelltAm: true },
            orderBy: { erstelltAm: "asc" },
            take: 3,
          },
```

Im Mapping `reviews: zeile.reviews.map((review) => ({ … }))` nach `erstelltAm: review.erstelltAm,`:

```ts
      bilder: review.bilder,
```

`components/review/eintrag.ts`: `ReviewBild` zum bestehenden Typimport aus `@/lib/query/strains` hinzunehmen; in `EintragDaten` nach `bildPfad`:

```ts
  /** Freigegebene Bilder zur Bewertung (Spec 2026-10-06); leer: Ersatzbild ab lg. */
  bilder?: ReviewBild[];
```

In `alsEintrag` nach `bildPfad: …`:

```ts
    bilder: review.bilder ?? [],
```

`lib/budpic-anzeige.ts`: Imports `import type { ReviewBild } from "@/lib/query/strains";` ergänzen, dann:

```ts
/** Bilder einer Bewertung für das Buch: Beschriftung nur das Datum, der Name steht im Kopf der Seite. */
export function alsBuchBilder(liste: readonly ReviewBild[], sprache: Sprache): DiashowBild[] {
  return liste.map((b) => ({ id: b.id, breite: b.breite, hoehe: b.hoehe, beschriftung: formatiereDatum(b.erstelltAm, sprache) }));
}
```

- [ ] **Step 4: Tests laufen lassen, sie bestehen**

Run: `npx tsx --test tests/budpics-anzeige.test.ts tests/autoren.test.ts tests/doppelseite.test.ts`
Expected: PASS.
Run: `npx tsc --noEmit -p .` und `npx eslint lib/query/strains.ts components/review/eintrag.ts lib/budpic-anzeige.ts`
Expected: keine Fehler.

- [ ] **Step 5: Commit**

```bash
git add lib/query/strains.ts components/review/eintrag.ts lib/budpic-anzeige.ts tests/budpics-anzeige.test.ts tests/autoren.test.ts
git commit -m "feat: freigegebene Bilder der Bewertungen für das Buch laden

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Bildfeld links im Buch (Strang B, nach Task 4)

Vor dem Start Skill `ui-design-engine` laden.

**Files:**
- Modify: `components/produkt/BudpicDiashow.tsx` (Prop `className`)
- Modify: `components/review/NurAufgeschlagen.tsx` (Prop `ersatz`)
- Modify: `components/review/BuchNotiz.tsx` (Props `bild`, `bildNurGross`; Funktion `notizZeilen`)
- Create: `components/review/BuchBildfeld.tsx` (LF)
- Modify: `components/review/BuchDoppelseite.tsx`
- Test: `tests/buch-notiz.test.ts`, `tests/buch-doppelseite.test.ts`, `tests/budpics-anzeige.test.ts`, `tests/i18n-literale.test.ts` (Eintrag nach `"components/review/BuchNotiz.tsx",`)

**Interfaces:**
- Consumes: Task 1 (`ersatzBildId`, `w.buch.bilderDiashow`), Task 4 (`EintragDaten.bilder`, `alsBuchBilder`).
- Produces: `notizZeilen(platz: number, textHoehe: number, mitBild: boolean): number`, `BILD_PLATZ = 208`; `BuchBildfeld({ eintrag, name, w, sprache })`; `BudpicDiashow` Prop `className?: string`; `NurAufgeschlagen` Prop `ersatz?: ReactNode`.

- [ ] **Step 1: Failing Tests schreiben**

In `tests/buch-notiz.test.ts` den Import auf `import { BILD_PLATZ, BuchNotiz, notizZeilen } from "@/components/review/BuchNotiz";` ändern und ergänzen:

```ts
test("notizZeilen ohne Bild wie bisher: passt ganz = 0, sonst Zeilen über dem Knopf", () => {
  assert.equal(notizZeilen(300, 200, false), 0);
  assert.equal(notizZeilen(300, 600, false), Math.floor((300 - 44) / 28));
  assert.equal(notizZeilen(40, 600, false), 1);
});

test("notizZeilen mit Bild: 192 px Bild und 16 px Abstand gehen ab, der Text endet früher", () => {
  assert.equal(BILD_PLATZ, 208);
  assert.equal(notizZeilen(500, 200, true), 0);
  assert.equal(notizZeilen(500, 300, true), Math.floor((500 - 208 - 44) / 28));
  assert.equal(notizZeilen(220, 600, true), 1);
});

test("Bewertungstext mit Bild: Bildfeld in derselben Fläche, ab lg absolut, mindestens 192 px", () => {
  const html = renderToStaticMarkup(
    createElement(BuchNotiz, { text: "Kurz.", weiterlesen: "Weiterlesen", schliessen: "Schließen", bild: createElement("figure", { id: "f" }) }),
  );
  assert.match(html, /<div [^>]*class="[^"]*\brelative\b[^"]*\bmt-2\b[^"]*\blg:min-h-48\b[^"]*\blg:flex-1\b[^"]*"><div class="lg:absolute lg:inset-0"><figure id="f">/);
});

test("Bewertungstext: Bild nur ab lg, wenn es ein Ersatzbild ist", () => {
  const html = renderToStaticMarkup(
    createElement(BuchNotiz, { text: "Kurz.", weiterlesen: "W", schliessen: "S", bild: createElement("figure"), bildNurGross: true }),
  );
  assert.match(html, /\bmax-lg:hidden\b/);
});
```

In `tests/buch-doppelseite.test.ts` ergänzen (Imports `musterBildId` aus `@/lib/budpics` hinzufügen):

```ts
const BILD = (n: number) => ({ id: `${n}f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc`, breite: 800, hoehe: 600, erstelltAm: new Date("2026-10-01T10:00:00Z") });

test("Bildfeld: ein Bild statisch, ohne Diashow-Knöpfe, Beschriftung nur Datum", () => {
  const { links } = seiten(zeige({ bilder: [BILD(1)] }));
  assert.match(links, new RegExp(`src="/api/bild/${BILD(1).id}"`));
  assert.doesNotMatch(links, /Diashow anhalten/);
  assert.match(links, /01\.10\.2026/);
});

test("Bildfeld: drei Bilder als Diashow mit 1 / 3 und eigener Bezeichnung", () => {
  const { links } = seiten(zeige({ bilder: [BILD(1), BILD(2), BILD(3)] }));
  assert.match(links, /1 \/ 3/);
  assert.match(links, /aria-label="Bilder zur Bewertung von Waldi"/);
});

test("Bildfeld: ohne Bild und ohne Herstellerbild das Musterbild, Symbolbild, nur ab lg", () => {
  const { links } = seiten(zeige({ bilder: [], bildPfad: null }));
  assert.match(links, new RegExp(musterBildId("nebelharz-22")));
  assert.match(links, /Symbolbild/);
  assert.match(links, /data-bildfeld="ersatz"[^>]*class="[^"]*\bmax-lg:hidden\b/);
});

test("Bildfeld: ohne Bild mit Herstellerbild dieses, ebenfalls als Symbolbild", () => {
  // Ein Herstellerbild, das nicht zufällig das Musterbild der Sorte ist.
  const hersteller = musterBildId("nebelharz-22") === "bluete-03" ? "bluete-04" : "bluete-03";
  const { links } = seiten(zeige({ bilder: [], bildPfad: hersteller }));
  assert.match(links, new RegExp(`/medien/${hersteller}-`));
  assert.doesNotMatch(links, new RegExp(`/medien/${musterBildId("nebelharz-22")}-`));
  assert.match(links, /Symbolbild/);
});

test("Linke Seite: Kopf, Text, Bildfeld, Kolophon in dieser Reihenfolge", () => {
  const { links } = seiten(zeige({ bilder: [BILD(1)] }));
  assert.ok(aufsteigend(stellen(links, ["<header", "Sehr dichte Blüten.", "data-bildfeld=", "<dl"])));
});

test("Ohne Text: Bildfeld füllt die Seite, der Platzhalter nimmt keinen Raum mehr", () => {
  const { links } = seiten(zeige({ notiz: null, bilder: [BILD(1)] }));
  assert.match(links, /Kein Text zu dieser Bewertung\./);
  assert.doesNotMatch(links, /<p class="[^"]*italic[^"]*lg:flex-1/);
  assert.match(links, /lg:flex-\[1_1_0px\][^"]*"><div class="lg:absolute lg:inset-0"><figure data-bildfeld="bild"/);
});
```

(`<dl` ist der Beginn des Kolophons, `components/review/BuchKolophon.tsx`.)

Den bestehenden Test „Ohne Text steht ruhig ein Hinweis, ohne Knopf“ (Zeile ~108) auf das neue
Verhalten umstellen, der Platzhalter verliert `lg:flex-1`:

```ts
  assert.match(links, /<p class="text-body text-text-muted italic">Kein Text zu dieser Bewertung\.<\/p>/);
```

In `tests/budpics-anzeige.test.ts` ergänzen:

```ts
test("Diashow: eigene Klasse am figure, Standard unverändert", () => {
  const mit = renderToStaticMarkup(createElement(BudpicDiashow, { bilder: alsDiashow(liste, de, "de"), name: "N", texte: de.budpic, className: "flex size-full flex-col gap-2" }));
  assert.match(mit, /<figure class="flex size-full flex-col gap-2"/);
  const ohne = renderToStaticMarkup(createElement(BudpicDiashow, { bilder: alsDiashow(liste, de, "de"), name: "N", texte: de.budpic }));
  assert.match(ohne, /<figure class="flex w-full flex-col gap-2"/);
});
```

- [ ] **Step 2: Tests laufen lassen, sie scheitern**

Run: `npx tsx --test tests/buch-notiz.test.ts tests/buch-doppelseite.test.ts tests/budpics-anzeige.test.ts`
Expected: FAIL (`notizZeilen` fehlt, kein Bildfeld).

- [ ] **Step 3: `BudpicDiashow` und `NurAufgeschlagen` erweitern**

`components/produkt/BudpicDiashow.tsx`: in `Props` ergänzen

```ts
  /** Klassen des äußeren figure; Standard "flex w-full flex-col gap-2". Im Buch füllt es die Höhe. */
  className?: string;
```

Signatur `({ bilder, name, texte, rahmen = "aspect-square w-full", className = "flex w-full flex-col gap-2" }: Props)` und am `<figure` `className={className}` statt der festen Klasse.

`components/review/NurAufgeschlagen.tsx`:

```tsx
/** `ersatz` steht auf fernen Seiten statt nichts, z. B. das erste Bild statt der Diashow. */
export function NurAufgeschlagen({ children, ersatz = null }: { children: ReactNode; ersatz?: ReactNode }) {
  return useContext(AufgeschlagenKontext) ? children : ersatz;
}
```

- [ ] **Step 4: `BuchNotiz` um das Bild erweitern**

In `components/review/BuchNotiz.tsx`:

Import `type ReactNode` zu den React-Imports hinzunehmen. Nach `KNOPF_PLATZ`:

```ts
/** Platz des Bildfelds unter dem Text (Spec 2026-10-06): min-h-48 (192 px) plus 16 px aus gap-2 und mt-2. */
export const BILD_PLATZ = 208;

/** Zeilen bis zur Auslassung; 0 = der Text passt ganz. Mit Bild geht dessen Mindestplatz vorher ab. */
export function notizZeilen(platz: number, textHoehe: number, mitBild: boolean): number {
  const rest = platz - (mitBild ? BILD_PLATZ : 0);
  if (textHoehe <= rest) return 0;
  return Math.max(1, Math.floor((rest - KNOPF_PLATZ) / ZEILE));
}
```

Signatur:

```tsx
export function BuchNotiz({
  text,
  weiterlesen,
  schliessen,
  bild,
  bildNurGross = false,
}: {
  text: string;
  weiterlesen: string;
  schliessen: string;
  /** Bildfeld unter dem Text, in derselben gemessenen Fläche (BuchBildfeld). */
  bild?: ReactNode;
  /** Ersatzbild: unter lg ausgeblendet. */
  bildNurGross?: boolean;
}) {
```

In `messen` die zwei Zeilen ab `const platz` ersetzen durch:

```ts
      const platz = element.clientHeight;
      setZeilen(notizZeilen(platz, p.scrollHeight, Boolean(bild)));
```

und das Effekt-Array auf `[offen, text, bild]` setzen. Nach dem Knopf-Block (vor dem schließenden `</div>` des Containers):

```tsx
      {bild ? (
        // Das Bild nimmt den Rest der Fläche; ab lg absolut, damit es nichts zur Höhe beiträgt.
        <div className={cn("relative mt-2 w-full lg:min-h-48 lg:flex-1", bildNurGross && "max-lg:hidden", offen && "lg:hidden")}>
          <div className="lg:absolute lg:inset-0">{bild}</div>
        </div>
      ) : null}
```

Der Absatz bekommt zusätzlich `flex-none` in seiner Klassenliste (erste Zeichenkette von `cn(...)`), damit er beim Wachsen des Bildes nicht gestreckt wird.

- [ ] **Step 5: `components/review/BuchBildfeld.tsx` schreiben**

```tsx
import { Bild, BudpicBild } from "@/components/medien/Bild";
import { BudpicDiashow } from "@/components/produkt/BudpicDiashow";
import type { EintragDaten } from "@/components/review/eintrag";
import { NurAufgeschlagen } from "@/components/review/NurAufgeschlagen";
import { alsBuchBilder } from "@/lib/budpic-anzeige";
import { ersatzBildId } from "@/lib/bewertungsbilder";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

/** Rahmen des Bildes: unter lg 4:3 und nie höher als 60 % des Fensters, ab lg der Rest der Fläche. */
const RAHMEN = "relative aspect-[4/3] max-h-[60svh] w-full border border-border lg:aspect-auto lg:max-h-none lg:min-h-0 lg:flex-1";
const FIGUR = "flex flex-col gap-2 lg:h-full";
const UNTERSCHRIFT = "text-caption text-text-muted";

/**
 * Das Bildfeld links im Buch (Spec 2026-10-06): freigegebene Bilder der
 * Bewertung, eines statisch, mehrere als Diashow (nur auf nahen Seiten,
 * CPU-Limit; ferne Seiten zeigen das erste Bild). Ohne Bild ab lg das
 * Ersatzbild wie in der Produktkarte, Herstellerbild vor Musterbild, beide als
 * Symbolbild gekennzeichnet; unter lg dann nichts.
 */
export function BuchBildfeld({ eintrag, name, w, sprache }: { eintrag: EintragDaten; name: string; w: Woerterbuch; sprache: Sprache }) {
  const bilder = alsBuchBilder(eintrag.bilder ?? [], sprache);
  const alt = t(w.budpic.alt, { name: eintrag.handelsname });

  const erstes = bilder[0];
  if (!erstes) {
    return (
      <figure data-bildfeld="ersatz" title={w.budpic.muster} className={`${FIGUR} max-lg:hidden`}>
        <div className="relative min-h-0 flex-1 bg-surface-sunken">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Bild id={ersatzBildId(eintrag.bildPfad, eintrag.slug)} dekorativ sizes="(min-width: 1024px) 40vw, 1px" className="h-full! min-h-0 w-full object-contain" />
          </div>
        </div>
        <figcaption className={UNTERSCHRIFT}>{w.katalog.karte.symbolbild}</figcaption>
      </figure>
    );
  }

  const statisch = (
    <figure data-bildfeld="bild" className={FIGUR}>
      <div className={`${RAHMEN} overflow-hidden bg-surface-sunken`}>
        <BudpicBild id={erstes.id} breite={erstes.breite} hoehe={erstes.hoehe} alt={alt} className="absolute inset-0 size-full object-cover" />
      </div>
      <figcaption className={UNTERSCHRIFT}>{erstes.beschriftung}</figcaption>
    </figure>
  );
  if (bilder.length === 1) return statisch;

  return (
    <NurAufgeschlagen ersatz={statisch}>
      <div data-bildfeld="diashow" className="lg:h-full">
        <BudpicDiashow
          bilder={bilder}
          name={name}
          texte={{ ...w.budpic, diashow: w.buch.bilderDiashow }}
          className={FIGUR}
          rahmen={RAHMEN}
        />
      </div>
    </NurAufgeschlagen>
  );
}
```

- [ ] **Step 6: `BuchDoppelseite` verdrahten**

In `components/review/BuchDoppelseite.tsx` Import `import { BuchBildfeld } from "@/components/review/BuchBildfeld";` ergänzen. Nach `const reel = …`:

```tsx
  const bildfeld = <BuchBildfeld eintrag={eintrag} name={name} w={w} sprache={sprache} />;
  // Ohne eigenes Bild steht ein Ersatzbild, das unter lg entfällt (Nutzer 2026-10-06).
  const nurErsatz = (eintrag.bilder ?? []).length === 0;
```

Den Text-Block ersetzen durch:

```tsx
        {eintrag.notiz ? (
          <BuchNotiz text={eintrag.notiz} weiterlesen={w.buch.weiterlesen} schliessen={w.buch.schliessen} bild={bildfeld} bildNurGross={nurErsatz} />
        ) : (
          <>
            <p className="text-body text-text-muted italic">{w.buch.keinText}</p>
            <div className={cn("relative w-full lg:min-h-48 lg:flex-[1_1_0px]", nurErsatz && "max-lg:hidden")}>
              <div className="lg:absolute lg:inset-0">{bildfeld}</div>
            </div>
          </>
        )}
```

Den Kommentar über der Komponente um einen Satz ergänzen: „Unter dem Text das Bildfeld (Spec 2026-10-06), in der gemessenen Fläche des Textes, damit die rechte Seite weiter die Höhe vorgibt.“

`tests/i18n-literale.test.ts`: nach `"components/review/BuchNotiz.tsx",` einfügen `  "components/review/BuchBildfeld.tsx",`.

- [ ] **Step 7: Tests laufen lassen, sie bestehen**

Run: `npx tsx --test tests/buch-notiz.test.ts tests/buch-doppelseite.test.ts tests/budpics-anzeige.test.ts tests/buch.test.ts tests/i18n-literale.test.ts`
Expected: PASS.
Run: `npm test`, `npx tsc --noEmit -p .`, `npx eslint components/produkt/BudpicDiashow.tsx components/review/NurAufgeschlagen.tsx components/review/BuchNotiz.tsx components/review/BuchBildfeld.tsx components/review/BuchDoppelseite.tsx`
Expected: alles grün.

- [ ] **Step 8: Commit**

```bash
git add components/produkt/BudpicDiashow.tsx components/review/NurAufgeschlagen.tsx components/review/BuchNotiz.tsx components/review/BuchBildfeld.tsx components/review/BuchDoppelseite.tsx tests/buch-notiz.test.ts tests/buch-doppelseite.test.ts tests/budpics-anzeige.test.ts tests/i18n-literale.test.ts
git commit -m "feat: Bildfeld links im Buch unter dem Text, Diashow und Ersatzbild ab lg

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Vermerk in /admin und Datenschutz (Strang C)

**Files:**
- Modify: `lib/query/budpics.ts` (LF; `OffenesBudpic`, `ladeBudpicsNachStatus`)
- Modify: `app/[lang]/admin/page.tsx` (CRLF; `BudpicListe`, ab Zeile ~407)
- Modify: `app/[lang]/datenschutz/page.tsx` (CRLF; Absatz Budpics ab Zeile ~217, Quellenkommentar ab Zeile 46)
- Test: `tests/budpics.test.ts`

**Interfaces:**
- Consumes: Task 1 (`Budpic.reviewId`).
- Produces: `OffenesBudpic.ausBewertung: boolean`, `budpicAusBewertung(reviewId: string | null): boolean`.

- [ ] **Step 1: Failing Test schreiben**

`lib/query/budpics.ts` ist wegen `getPrisma` nicht direkt testbar; die Ableitung kommt als reine Funktion nach `lib/budpics.ts`.

In `tests/budpics.test.ts` ergänzen (Import von `budpicAusBewertung` aus `@/lib/budpics` hinzufügen):

```ts
test("budpicAusBewertung: nur mit Review-Id", () => {
  assert.equal(budpicAusBewertung("3f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc"), true);
  assert.equal(budpicAusBewertung(null), false);
});
```

- [ ] **Step 2: Test laufen lassen, er scheitert**

Run: `npx tsx --test tests/budpics.test.ts`
Expected: FAIL („budpicAusBewertung is not a function“ bzw. Exportfehler).

- [ ] **Step 3: Umsetzung**

`lib/budpics.ts` am Ende:

```ts
/** Gehört das Bild zu einer Bewertung (Spec 2026-10-06)? Für den Vermerk in /admin. */
export function budpicAusBewertung(reviewId: string | null): boolean {
  return reviewId !== null;
}
```

`lib/query/budpics.ts`: Import `budpicAusBewertung` zu `BUDPIC_MAX_ANZEIGE` hinzunehmen. `OffenesBudpic` um `ausBewertung: boolean` ergänzen. Im `select` von `ladeBudpicsNachStatus` `reviewId: true` ergänzen, im Mapping `ausBewertung: budpicAusBewertung(z.reviewId),`.

`app/[lang]/admin/page.tsx`, in `BudpicListe` direkt nach der Zeile `von {b.nutzer}, …` (das schließende `</p>`):

```tsx
                  {b.ausBewertung ? (
                    <p>
                      <Badge variante="neutral" zeichen={false}>
                        aus einer Bewertung
                      </Badge>
                    </p>
                  ) : null}
```

(Die Admin-Seite ist einsprachig deutsch und steht nicht in `UMGESTELLT`; die Liste nebenan nutzt ebenfalls Literale.)

`app/[lang]/datenschutz/page.tsx`: im Absatz zu den Budpics nach dem Satz „Erst nach unserer Freigabe erscheint es bei der Blüte, mit deinem Anzeigenamen und dem Datum, und ist über seine Adresse abrufbar.“ einfügen:

```
Bilder, die du zu deiner Bewertung hochlädst, speichern wir genauso; nach der Freigabe erscheinen
sie bei deiner Bewertung und in den Bildern der Blüte. Löschst du ein solches Bild oder verwerfen
wir die Bewertung, verschwindet es an beiden Stellen. Beim Verkleinern im Browser fallen
eingebettete Angaben wie der Aufnahmeort weg.
```

Im Quellenkommentar oben (Zeile ~46) nach `app/admin/budpic-aktionen.ts …` ergänzen: `app/blueten/[slug]/bewertungsbild-aktionen.ts (Bilder zur Bewertung, review_id an budpics, Spec 2026-10-06)`.

- [ ] **Step 4: Tests laufen lassen, sie bestehen**

Run: `npx tsx --test tests/budpics.test.ts`
Expected: PASS.
Run: `npx tsc --noEmit -p .` und `npx eslint lib/budpics.ts lib/query/budpics.ts "app/[lang]/admin/page.tsx" "app/[lang]/datenschutz/page.tsx"`
Expected: keine Fehler.

- [ ] **Step 5: Commit**

```bash
git add lib/budpics.ts lib/query/budpics.ts "app/[lang]/admin/page.tsx" "app/[lang]/datenschutz/page.tsx" tests/budpics.test.ts
git commit -m "feat: Bewertungsbilder in /admin kennzeichnen, Datenschutz ergänzt

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Remote-D1, Zusammenführen, Push, Live-Prüfung (Controller)

Nur der Controller. Keine Implementer-Aufgabe.

- [ ] **Step 1:** Stränge A, B, C auf `main` zusammenführen. Konflikte nur in `lib/query/strains.ts` und `tests/i18n-literale.test.ts` erwartet (siehe „Stränge und Reihenfolge“); beide Seiten behalten. Danach `npm test`, `npx tsc --noEmit -p .`, `npx eslint` über alle geänderten Dateien.
- [ ] **Step 2:** Remote-D1 **vor** dem Push einspielen: `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0016_bewertungsbilder.sql`. Erwartet: Erfolg ohne Fehler. Bei Auth-Fehler 10000 übernimmt der Nutzer genau diesen Befehl. Prüfen: `npx wrangler d1 execute cn-medcan-db --remote --command "SELECT name FROM pragma_table_info('budpics') WHERE name = 'review_id'"` liefert eine Zeile.
- [ ] **Step 3:** Push nach `main` (Dauerregel), dann Live-Prüfung im Browser:
  - Als Community-Mitglied: Bewertung mit drei Bildern speichern; ein viertes lässt sich nicht wählen; im Formular „Wartet auf Freigabe“ mit Vorschau.
  - In /admin: die drei mit „aus einer Bewertung“; eines freigeben, eines ablehnen. Im Formular wird der Platz des abgelehnten frei.
  - Buch bei 1143 px: kurzer Text mit Bild füllt bis zum Kolophon; langer Text endet mit „Weiterlesen“, das Bild bleibt mindestens 192 px; die Doppelseite wächst nicht.
  - Buch unter 640 px: eigenes Bild 4:3, ohne eigenes Bild kein Ersatzbild.
  - Sorte ohne Bild ab `lg`: Herstellerbild (wenn gesetzt) oder Musterbild mit „Symbolbild“.
  - Freigegebenes Bild erscheint auch in der Diashow der Produktkarte und der Blütenseite.
  - Als Betreiber: ein Bild ist sofort im Buch und in der Sortendiashow.
- [ ] **Step 4:** HANDOFF.md mit Stand, Befunden und offenen Resten aktualisieren und committen.
