# Profil Stufe 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jedes Mitglied hat unter `/profil` ein privates Dashboard mit Aroma-Netz und Terpen-Rangliste, bestätigten Vorschlägen, Top/Flop, Vergleich mit der Community und Schnitten je Kategorie; „Mein Konto“ heißt „Mein Profil“ und führt dorthin.

**Architecture:** Profilwerte rechnet die Bewertungs-Action beim Speichern (wie die Empfehlungen, T11) und legt sie in `nutzer_profil` ab; `/profil` rechnet nur neu, wenn der Stand älter als 24 h ist. Bestätigt-Regel und Rang laufen in `empfehlungenBerechnen` mit den Community-Werten aus `sorten_kennwerte`. Auswertungen sind reine Arithmetik je Aufruf über die eigenen Bewertungen.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), Prisma 7 mit D1, Tailwind 4, `node:test` über `tsx --test`, `better-sqlite3` für SQL-Tests, `react-dom/server` für Render-Tests.

**Spec:** `docs/superpowers/specs/2026-10-07-profil-dashboard-design.md`

## Global Constraints

- Next.js 16 App Router auf Cloudflare Workers (OpenNext). Vor Next-API-Nutzung `node_modules/next/dist/docs/` lesen (AGENTS.md).
- Kein `next dev`, `next build`, `next preview` lokal. Prüfen nur per `npm test`, `npx tsc --noEmit -p .`, `npx eslint <geänderte Dateien>`. Die Live-Prüfung macht der Controller nach dem Push.
- Design-Regelwerk: Skill `ui-design-engine` (8-px-Raster, Tokens aus `app/globals.css`, Buch und Handschrift). Vor UI-Arbeit laden. Datengrafik in Tinte (`currentColor` auf `text-text`), nie in Blattgrün.
- Zeilenenden je Datei erhalten: `git ls-files --eol <datei>` zeigt `i/crlf` oder `i/lf`. Nie eine CRLF-Datei als LF zurückschreiben. CRLF sind hier: `prisma/schema.prisma`, `app/[lang]/blueten/[slug]/aktionen.ts`, `tests/navigation.test.ts`, `app/[lang]/datenschutz/page.tsx`. Neue Dateien in LF.
- Texte in `lib/i18n/de.ts` und `lib/i18n/en.ts`, keine Literale in Komponenten (`tests/i18n-literale.test.ts`). Alle neuen Texte legt Task 1 an; spätere Tasks fügen keine Schlüssel hinzu.
- HWG: Netz und Vorschläge nur Aroma, nie Wirkung. Kein Kauf- oder Apothekenlink im Profil. Wirkung steht nur in „Deine Schnitte“ (privat).
- Workers-CPU 10 ms: keine Rechnung über alle Sorten je Seitenaufruf. Jede Prisma-Liste mit `take`.
- Kommentare und Commits auf Deutsch in Prosa, im Stil der Umgebung. Commit-Ende: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Kein Push, kein Merge. Nur Commits im eigenen Worktree-Branch.
- Migration: Implementer legen nur die Datei an und testen sie mit `better-sqlite3`. **Remote-D1 spielt der Controller selbst ein**, exakt `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0017_nutzer_profil.sql`, **vor** dem ersten Push von Code, der `nutzer_profil` oder `bestaetigt` liest.
- Nach Änderungen an `prisma/schema.prisma`: `npm run db:generate`. Keine zusätzlichen npm-Installationen.

## Review Focus

1. Mitglied mit nur Altbewertungen (`gesamtnote` NULL): das Netz entsteht trotzdem über das Mittel der fünf Noten. Abgesichert durch `noteOderErsatz` (Task 3, Step 1) und die Query (Task 4).
2. Mitglied mit Bewertungen nur im Mittelfeld (2,1 bis 3,4): kein leeres Netz ohne Erklärung, sondern der Hinweis `nurMittelfeld`. Abgesichert in `ProfilNetz` (Task 5, Step 1).
3. Eigene Bewertung freigegeben und einzige der Sorte: kein Vergleich gegen sich selbst. Abgesichert durch `auswertungen` (Task 3, Step 1, Fall „nur eigene“).
4. Kaputter JSON-Text in `nutzer_profil`: die Seite zeigt den Leerzustand statt eines Fehlers. Abgesichert durch `profilAusDaten` (Task 3, Step 1).
5. `/mitglied` bleibt als Reiter „Konto“ erreichbar und der Kopfknopf ist dort aktiv markiert. Abgesichert durch `istAktiv` (Task 7, Step 1).

## Stränge und Reihenfolge

```
Task 1 (Fundament: Migration, Prisma, Typen, alle Texte)          ← zuerst, allein, auf main
   ├── Strang A: Task 2 (Bestätigt) → Task 3 (Profilrechnung) → Task 4 (Query, Action)
   ├── Strang B: Task 5 (ProfilNetz, Terpenliste) → Task 6 (Auswertungskarten, Vorschlagsmarke)
   └── Strang C: Task 7 (Navigation, Reiter, /mitglied)
Task 8 (Seite /profil, Literal-Wächter)                           ← nach Merge von A, B, C
Task 9 (Controller: Remote-D1, Push, Live-Prüfung)                ← zuletzt
```

Strang A, B und C laufen nach Task 1 parallel, je ein Worktree vom Stand nach Task 1. Sie teilen keine
Datei. `tests/i18n-literale.test.ts` fasst nur Task 8 an.

---

### Task 1: Fundament (Migration, Prisma, Typen, Texte)

**Files:**
- Create: `migrations/0017_nutzer_profil.sql`
- Create: `tests/profil-migration.test.ts`
- Modify: `prisma/schema.prisma` (CRLF; `model NutzerEmpfehlung` ab Zeile 707, `model Mitglied` ab Zeile 400)
- Create: `lib/profil-typen.ts`
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (neuer Block `profil` nach `empfehlung`; `kopf.navigation.konto`; Vorschlag-Texte)
- Modify: `tests/navigation.test.ts` (CRLF; nur die Textzeile für `konto`)

**Interfaces:**
- Produces: Tabelle `nutzer_profil`, Spalte `nutzer_empfehlungen.bestaetigt`; Prisma-Modell `NutzerProfil` (`prisma.nutzerProfil`) und Feld `NutzerEmpfehlung.bestaetigt: boolean`; Typen aus `lib/profil-typen.ts` (unten); Wörterbuch `w.profil` (unten).

- [ ] **Step 1: Migrationstest schreiben**

```ts
// tests/profil-migration.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/**
 * Migration 0017 (Spec 2026-10-07): nutzer_profil je Mitglied, dazu
 * nutzer_empfehlungen.bestaetigt mit Vorgabe 0. Rein additiv.
 */
const sql = (name: string) => readFileSync(join(process.cwd(), "migrations", name), "utf8");

function datenbank() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE "strains" ("id" TEXT NOT NULL PRIMARY KEY);
    CREATE TABLE "mitglied" ("id" TEXT NOT NULL PRIMARY KEY);
    INSERT INTO "strains" VALUES ('s1');
    INSERT INTO "mitglied" VALUES ('m1');
  `);
  db.exec(sql("0014_nutzer_empfehlungen.sql"));
  db.prepare(`INSERT INTO "nutzer_empfehlungen" ("mitglied_id", "strain_id", "rang", "score", "bezug_strain_id", "gemeinsam") VALUES ('m1', 's1', 1, 0.9, 's1', '[]')`).run();
  db.exec(sql("0017_nutzer_profil.sql"));
  return db;
}

test("0017: bestehende Empfehlungen gelten als nicht bestätigt", () => {
  const db = datenbank();
  assert.deepEqual(db.prepare(`SELECT "bestaetigt" FROM "nutzer_empfehlungen"`).get(), { bestaetigt: 0 });
});

test("0017: ein Profil je Mitglied, geht mit dem Mitglied", () => {
  const db = datenbank();
  const neu = db.prepare(`INSERT INTO "nutzer_profil" ("mitglied_id", "geschmack", "terpene", "anzahl", "gewichtet", "berechnet_am") VALUES ('m1', '{}', '[]', 0, 0, CURRENT_TIMESTAMP)`);
  neu.run();
  assert.throws(() => neu.run(), /UNIQUE|PRIMARY KEY/);
  db.prepare(`DELETE FROM "mitglied" WHERE "id" = 'm1'`).run();
  assert.equal((db.prepare(`SELECT COUNT(*) AS n FROM "nutzer_profil"`).get() as { n: number }).n, 0);
});

test("0017: unbekanntes Mitglied wird abgewiesen", () => {
  const db = datenbank();
  assert.throws(
    () => db.prepare(`INSERT INTO "nutzer_profil" ("mitglied_id", "geschmack", "terpene", "anzahl", "gewichtet", "berechnet_am") VALUES ('x', '{}', '[]', 0, 0, CURRENT_TIMESTAMP)`).run(),
    /FOREIGN KEY/,
  );
});
```

- [ ] **Step 2: Test laufen lassen, er scheitert**

Run: `npx tsx --test tests/profil-migration.test.ts`
Expected: FAIL mit `ENOENT` für `0017_nutzer_profil.sql`.

- [ ] **Step 3: Migration anlegen**

```sql
-- 0017_nutzer_profil
--
-- Profil und Dashboard, Stufe 1 (Spec 2026-10-07). Profilwerte eines Mitglieds,
-- beim Speichern einer Bewertung vorberechnet (CPU-Limit 10 ms); /profil rechnet
-- nur neu, wenn der Stand aelter als 24 h ist. Nur Aroma, nie Wirkung (HWG).
-- Dazu die Markierung bestaetigter Vorschlaege. Rein additiv: alter Code laeuft weiter.

-- CreateTable
CREATE TABLE "nutzer_profil" (
    "mitglied_id" TEXT NOT NULL PRIMARY KEY,
    "geschmack" TEXT NOT NULL,
    "terpene" TEXT NOT NULL,
    "anzahl" INTEGER NOT NULL,
    "gewichtet" INTEGER NOT NULL,
    "berechnet_am" DATETIME NOT NULL,
    CONSTRAINT "nutzer_profil_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AlterTable
ALTER TABLE "nutzer_empfehlungen" ADD COLUMN "bestaetigt" BOOLEAN NOT NULL DEFAULT false;
```

Hinweis: SQLite speichert `false` als 0; Prisma liest `Boolean`. Den Test aus Step 1 prüft genau das.

- [ ] **Step 4: Test laufen lassen, er besteht**

Run: `npx tsx --test tests/profil-migration.test.ts`
Expected: PASS (3 Tests).

- [ ] **Step 5: Prisma-Schema ergänzen (CRLF erhalten)**

In `model NutzerEmpfehlung` nach `gemeinsam     String`:

```prisma
  /// Mindestens 2 freigegebene Bewertungen mit Median ab 3,5 (Spec Profil 4.3).
  bestaetigt    Boolean  @default(false)
```

Neues Modell direkt nach `model NutzerEmpfehlung`:

```prisma
/// Profilwerte eines Mitglieds (Spec Profil 4.1), beim Speichern einer
/// Bewertung vorberechnet. `geschmack` ist JSON {KATEGORIE: -1..1},
/// `terpene` JSON [{name, wert}]. Gelesen ueber profilAusDaten() in lib/profil.ts.
model NutzerProfil {
  mitgliedId  String   @id @map("mitglied_id")
  mitglied    Mitglied @relation(fields: [mitgliedId], references: [id], onDelete: Cascade)
  geschmack   String
  terpene     String
  anzahl      Int
  gewichtet   Int
  berechnetAm DateTime @map("berechnet_am")

  @@map("nutzer_profil")
}
```

In `model Mitglied` neben der bestehenden Relation zu `NutzerEmpfehlung` (Feldliste nach `avatar NutzerAvatar?` ansehen) ergänzen:

```prisma
  profil             NutzerProfil?
```

Mit Python schreiben und `newline=""` nutzen, damit CRLF bleibt. Danach `git ls-files --eol prisma/schema.prisma` muss weiter `w/crlf` zeigen.

Run: `npm run db:generate`
Expected: „Generated Prisma Client“ ohne Fehler.

- [ ] **Step 6: Typen anlegen**

```ts
// lib/profil-typen.ts
import type { GeschmacksKategorie } from "@/db/enums";

/**
 * Profilwerte eines Mitglieds (Spec Profil 4.2). Je Geschmacksachse -1..1,
 * normiert auf das stärkste |Gewicht|: positiv heißt „mag ich“, negativ
 * „mag ich nicht“. Nur Aroma, nie Wirkung (HWG).
 */
export type ProfilWerte = {
  geschmack: Record<GeschmacksKategorie, number>;
  /** Erst höchstens 8 positive (stärkste zuerst), dann höchstens 3 negative (stärkste Ablehnung zuerst). */
  terpene: { name: string; wert: number }[];
  /** Alle eigenen Bewertungen. */
  anzahl: number;
  /** Davon mit Gewicht ungleich 0 (ab 3,5 oder bis 2). */
  gewichtet: number;
};

/** Eine eigene Bewertung, wie die Auswertungen sie brauchen (Spec Profil 4.5). */
export type AuswertungsZeile = {
  slug: string;
  handelsname: string;
  erstelltAm: Date;
  gesamtnote: number | null;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  freigegeben: boolean;
  /** Aus `sorten_kennwerte`; null ohne Zeile. */
  community: { mittel: number | null; anzahl: number } | null;
};

export type BewertungsKurz = { slug: string; handelsname: string; note: number };

export type CommunityVergleich = {
  /** Mittel (eigene − Community), auf 0,1 gerundet; null unter 2 vergleichbaren Bewertungen. */
  differenz: number | null;
  vergleichbar: number;
  /** Höchstens 3, größte |Differenz| zuerst. */
  abweichungen: { slug: string; handelsname: string; eigene: number; community: number }[];
};

export type Schnitte = {
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  gesamt: number;
};

export type Auswertungen = {
  top: BewertungsKurz[];
  /** Schlechteste zuerst; leer bei 3 oder weniger Bewertungen. */
  flop: BewertungsKurz[];
  community: CommunityVergleich;
  /** null ohne Bewertung. */
  schnitte: Schnitte | null;
};
```

- [ ] **Step 7: Texte anlegen (de)**

In `lib/i18n/de.ts`:
- `kopf.navigation.konto: "Mein Konto"` → `"Mein Profil"`.
- Im Block `vorschlag`: in `satz`, `zuKonto`, `danke` „Mein Konto“ → „Mein Profil“ (`zuKonto: "Zu Mein Profil"`), in `meldung["vorschlag.schonVorgeschlagen"]` ebenso.
- Neuer Block `profil` direkt nach dem Block `empfehlung`:

```ts
  profil: {
    titel: "Mein Profil",
    reiterLeiste: "Profil und Konto",
    reiterProfil: "Profil",
    reiterKonto: "Konto",
    anzahl: { one: "{anzahl} Bewertung", other: "{anzahl} Bewertungen" },
    fehler: "Dein Profil lässt sich gerade nicht laden. Lade die Seite in ein paar Minuten neu.",
    netzTitel: "Deine Aromen",
    netzSatz: "Aus deinen Bewertungen: Fläche für das, was du magst, gestrichelt für das, was du eher nicht magst.",
    magIch: "mag ich",
    magIchNicht: "mag ich nicht",
    netzSkala: "Geschmack, gemessen an deiner stärksten Vorliebe",
    vorlaeufig: "Vorläufig: {anzahl} von 3 Bewertungen. Ab 3 ist dein Netz aussagekräftig.",
    nurMittelfeld: "Dein Netz formen nur Bewertungen ab 3,5 oder bis 2. Deine bisherigen liegen dazwischen.",
    leer: "Noch keine Bewertung. Mit der ersten entsteht dein Netz.",
    ersteBewertung: "Erste Bewertung abgeben",
    srMag: "{achse}: mag ich, {wert} von 5",
    srMagNicht: "{achse}: mag ich nicht, {wert} von 5",
    srNeutral: "{achse}: neutral",
    terpeneTitel: "Terpene",
    terpeneEherNicht: "eher nicht",
    vorschlaegeTitel: "Ähnlich im Aroma wie deine Favoriten",
    nichtBestaetigt: "noch nicht bestätigt",
    bestaetigtHinweis: "Bestätigt heißt: mindestens zwei Bewertungen mit einem Median ab 3,5.",
    topFlopTitel: "Top und Flop",
    top: "Top",
    flop: "Flop",
    flopLeer: "Ab vier Bewertungen steht hier auch dein Flop.",
    note: "{note} von 5",
    communityTitel: "Du und die Community",
    strenger: "Du bewertest im Schnitt {wert} strenger als die Community.",
    milder: "Du bewertest im Schnitt {wert} milder als die Community.",
    gleich: "Du bewertest im Schnitt wie die Community.",
    communityLeer: "Sobald zwei deiner Sorten auch von anderen bewertet sind, steht hier der Vergleich.",
    abweichungen: "Größte Abweichungen",
    duNote: "du {note}",
    communityNote: "Community {note}",
    schnitteTitel: "Deine Schnitte",
    schnitteSatz: "Mittel über alle deine Bewertungen. Nur für dich sichtbar.",
    gesamt: "Gesamt",
  },
```

- [ ] **Step 8: Texte anlegen (en)**

In `lib/i18n/en.ts`: `kopf.navigation.konto: "My profile"`; „My account“ → „My profile“ in `vorschlag.satz`, `vorschlag.zuKonto` (`"To My profile"`), `vorschlag.danke`, `meldung["vorschlag.schonVorgeschlagen"]`. Neuer Block `profil` nach `empfehlung`:

```ts
  profil: {
    titel: "My profile",
    reiterLeiste: "Profile and account",
    reiterProfil: "Profile",
    reiterKonto: "Account",
    anzahl: { one: "{anzahl} review", other: "{anzahl} reviews" },
    fehler: "Your profile cannot be loaded right now. Reload the page in a few minutes.",
    netzTitel: "Your aromas",
    netzSatz: "From your reviews: filled for what you like, dashed for what you tend not to like.",
    magIch: "like",
    magIchNicht: "dislike",
    netzSkala: "Taste, measured against your strongest preference",
    vorlaeufig: "Preliminary: {anzahl} of 3 reviews. From 3 on, your web is meaningful.",
    nurMittelfeld: "Only reviews of 3.5 and above or 2 and below shape your web. Yours so far lie in between.",
    leer: "No review yet. Your web starts with the first one.",
    ersteBewertung: "Write your first review",
    srMag: "{achse}: like, {wert} of 5",
    srMagNicht: "{achse}: dislike, {wert} of 5",
    srNeutral: "{achse}: neutral",
    terpeneTitel: "Terpenes",
    terpeneEherNicht: "rather not",
    vorschlaegeTitel: "Similar in aroma to your favourites",
    nichtBestaetigt: "not yet confirmed",
    bestaetigtHinweis: "Confirmed means: at least two reviews with a median of 3.5 or more.",
    topFlopTitel: "Top and flop",
    top: "Top",
    flop: "Flop",
    flopLeer: "From four reviews on, your flop appears here too.",
    note: "{note} of 5",
    communityTitel: "You and the community",
    strenger: "On average you rate {wert} stricter than the community.",
    milder: "On average you rate {wert} milder than the community.",
    gleich: "On average you rate like the community.",
    communityLeer: "As soon as two of your strains are also reviewed by others, the comparison appears here.",
    abweichungen: "Largest differences",
    duNote: "you {note}",
    communityNote: "community {note}",
    schnitteTitel: "Your averages",
    schnitteSatz: "Mean over all your reviews. Visible only to you.",
    gesamt: "Overall",
  },
```

- [ ] **Step 9: Navigationstest an den neuen Text anpassen (CRLF erhalten)**

In `tests/navigation.test.ts` die Zeile `assert.equal(de.kopf.navigation.konto, "Mein Konto");` → `assert.equal(de.kopf.navigation.konto, "Mein Profil");`. Die `KONTO_LINK`-Zeile bleibt hier unverändert (Task 7 ändert sie).

- [ ] **Step 10: Alles prüfen**

Run: `npx tsc --noEmit -p . && npm test`
Expected: tsc ohne Fehler (das Schema-Gleichheitsprüfung `Woerterbuch` erzwingt dieselben Schlüssel in en), alle Tests grün. Scheitert ein Test, der „Mein Konto“ im Text erwartet, dort den Text nachziehen.

- [ ] **Step 11: Commit**

```bash
git add migrations/0017_nutzer_profil.sql tests/profil-migration.test.ts prisma/schema.prisma lib/generated lib/profil-typen.ts lib/i18n/de.ts lib/i18n/en.ts tests/navigation.test.ts
git commit -m "feat: Fundament Profil Stufe 1 (Migration 0017, Typen, Texte)"
```

(`lib/generated` nur hinzufügen, wenn es versioniert ist: `git ls-files lib/generated | head -1`.)

---

### Task 2: Bestätigte Vorschläge (Strang A)

**Files:**
- Modify: `lib/empfehlung.ts`
- Modify: `tests/empfehlung.test.ts`

**Interfaces:**
- Consumes: Spalte `nutzer_empfehlungen.bestaetigt` (Task 1).
- Produces:
  - `SortenAroma.community?: { median: number | null; anzahl: number }`
  - `Empfehlung.bestaetigt: boolean`
  - `SortenAromaZeile` mit optionalen `gn?: number | null; an?: number | null`
  - `export function istBestaetigt(c: SortenAroma["community"]): boolean`
  - `export const BESTAETIGT_MIN_ANZAHL = 2; BESTAETIGT_MIN_MEDIAN = 3.5; BESTAETIGT_MINDESTENS = 3`
  - `export function profilAus(bewertungen, sorten): { profil: Vektor; positive: {strainId; vektor}[]; bewertet: Set<string> }` (bisher privat, jetzt exportiert)

- [ ] **Step 1: Tests schreiben**

In `tests/empfehlung.test.ts` den Import um `istBestaetigt` ergänzen und anhängen:

```ts
const mitCommunity = (s: SortenAroma, median: number | null, anzahl: number): SortenAroma => ({ ...s, community: { median, anzahl } });

test("istBestaetigt: ab 2 Bewertungen und Median ab 3,5", () => {
  assert.equal(istBestaetigt({ median: 3.5, anzahl: 2 }), true);
  assert.equal(istBestaetigt({ median: 3.4, anzahl: 5 }), false);
  assert.equal(istBestaetigt({ median: 5, anzahl: 1 }), false);
  assert.equal(istBestaetigt({ median: null, anzahl: 4 }), false);
  assert.equal(istBestaetigt(undefined), false);
});

test("empfehlungen: ab drei bestätigten nur bestätigte, Rang nach Kosinus mal Median", () => {
  const basis = Array.from({ length: 8 }, (_, i) => sorte(`k${i}`, [["Limonen", "ZITRUS"], ["Myrcen", "ERDIG"]]));
  const sorten = [
    ZITRUS,
    mitCommunity(basis[0], 3.5, 2),
    mitCommunity(basis[1], 5, 3),
    mitCommunity(basis[2], 4, 2),
    mitCommunity(basis[3], 5, 1), // zu wenige Stimmen
    mitCommunity(basis[4], 3, 9), // Median zu niedrig
    basis[5],
  ];
  const liste = empfehlungenBerechnen([{ strainId: "zitrus", gesamtnote: 5, terpene: {}, geschmack: {} }], sorten);
  assert.deepEqual(liste.map((e) => e.strainId), ["k1", "k2", "k0"]);
  assert.ok(liste.every((e) => e.bestaetigt));
  assert.deepEqual(liste.map((e) => e.rang), [1, 2, 3]);
});

test("empfehlungen: unter drei bestätigten mit unbestätigten nach Aroma aufgefüllt", () => {
  const basis = Array.from({ length: 8 }, (_, i) => sorte(`k${i}`, [["Limonen", "ZITRUS"], ["Myrcen", "ERDIG"]]));
  const sorten = [ZITRUS, mitCommunity(basis[0], 4, 2), ...basis.slice(1)];
  const liste = empfehlungenBerechnen([{ strainId: "zitrus", gesamtnote: 5, terpene: {}, geschmack: {} }], sorten);
  assert.equal(liste.length, 6);
  assert.equal(liste[0].strainId, "k0");
  assert.equal(liste[0].bestaetigt, true);
  assert.ok(liste.slice(1).every((e) => !e.bestaetigt));
});

test("sortenAusZeilen: Community-Median und Anzahl aus gn und an", () => {
  const [s] = sortenAusZeilen([{ id: "m", name: "Myrcen", geschmack: "ERDIG" }], [{ sid: "a", tp: "m:1", gm: null, gn: 4.2, an: 3 }]);
  assert.deepEqual(s.community, { median: 4.2, anzahl: 3 });
  const [ohne] = sortenAusZeilen([{ id: "m", name: "Myrcen", geschmack: "ERDIG" }], [{ sid: "b", tp: "m:1", gm: null }]);
  assert.equal(ohne.community, undefined);
});
```

Außerdem in derselben Datei die beiden synthetischen Tabellen an die neuen Spalten anpassen:
- in `synthetischeDatenbank`: `CREATE TABLE sorten_kennwerte (strain_id TEXT PRIMARY KEY, geschmack_median TEXT, gesamtnote_median REAL, anzahl INTEGER);` und das Insert zu `INSERT INTO sorten_kennwerte VALUES (?, ?, NULL, 3)`.
- im Test `empfehlungenErsetzen`: in `CREATE TABLE nutzer_empfehlungen (...)` die Spalte `bestaetigt INTEGER NOT NULL DEFAULT 0` ergänzen.

- [ ] **Step 2: Tests laufen lassen, sie scheitern**

Run: `npx tsx --test tests/empfehlung.test.ts`
Expected: FAIL (`istBestaetigt` nicht exportiert / `bestaetigt` undefined).

- [ ] **Step 3: Umsetzen in `lib/empfehlung.ts`**

1. `SortenAroma` ergänzen:

```ts
  /** Freigegebene Bewertungen der Sorte aus `sorten_kennwerte` (Spec Profil 4.3). */
  community?: { median: number | null; anzahl: number };
```

2. `Empfehlung` ergänzen: `/** Von der Community bestätigt (Spec Profil 4.3). */ bestaetigt: boolean;`

3. Nach `EMPFEHLUNGEN_ANZAHL`:

```ts
/** Bestätigt: so viele freigegebene Bewertungen und dieser Median der Gesamtnote (Nutzer 2026-10-07). */
export const BESTAETIGT_MIN_ANZAHL = 2;
export const BESTAETIGT_MIN_MEDIAN = 3.5;
/** Unter so vielen bestätigten wird nach Aroma aufgefüllt, sichtbar markiert. */
export const BESTAETIGT_MINDESTENS = 3;

export function istBestaetigt(c: SortenAroma["community"]): boolean {
  return !!c && c.anzahl >= BESTAETIGT_MIN_ANZAHL && c.median !== null && c.median >= BESTAETIGT_MIN_MEDIAN;
}
```

4. `function profilAus` → `export function profilAus` (Kommentar darüber: `/** Profilvektor, positive Bewertungen und bewertete Ids; auch Grundlage des Profilnetzes (lib/profil.ts). */`).

5. In `empfehlungenBerechnen` den Schluss ab `kandidaten.sort(...)` ersetzen:

```ts
  const nachId = (a: { strainId: string }, b: { strainId: string }) => (a.strainId < b.strainId ? -1 : a.strainId > b.strainId ? 1 : 0);
  kandidaten.sort((a, b) => b.score - a.score || nachId(a, b));

  // Bestätigt zuerst, Rang = Ähnlichkeit × Community-Note (Spec Profil 4.3).
  const bestaetigte = kandidaten
    .filter((k) => istBestaetigt(k.sorte.community))
    .map((k) => ({ k, wert: (k.score * k.sorte.community!.median!) / 5 }))
    .sort((a, b) => b.wert - a.wert || nachId(a.k, b.k))
    .map((x) => x.k)
    .slice(0, anzahl);
  const auswahl =
    bestaetigte.length >= BESTAETIGT_MINDESTENS
      ? bestaetigte
      : [...bestaetigte, ...kandidaten.filter((k) => !istBestaetigt(k.sorte.community))].slice(0, anzahl);

  return auswahl.map((kandidat, i) => {
```

Im folgenden `map` (bisher über `kandidaten.slice(0, anzahl)`) bleibt der Körper gleich; das Rückgabeobjekt bekommt `bestaetigt: istBestaetigt(kandidat.sorte.community),`.

6. `AROMA_SPALTEN`:

```ts
const AROMA_SPALTEN = `s.id AS sid,
           GROUP_CONCAT(st.terpen_id || ':' || st.rang, ',') AS tp,
           k.geschmack_median AS gm,
           k.gesamtnote_median AS gn,
           k.anzahl AS an`;
```

7. `SortenAromaZeile`: `{ sid: string; tp: string | null; gm: string | null; gn?: number | null; an?: number | null }`.

8. In `sortenAusZeilen` statt der letzten zwei Zeilen der Schleife:

```ts
    const geschmackMedian = medianAus(z.gm);
    const sorte: SortenAroma = geschmackMedian ? { strainId: z.sid, terpene: liste, geschmackMedian } : { strainId: z.sid, terpene: liste };
    if (typeof z.an === "number" && z.an > 0) sorte.community = { median: typeof z.gn === "number" ? z.gn : null, anzahl: z.an };
    aus.push(sorte);
```

9. `empfehlungenErsetzen`: Insert um `bestaetigt` erweitern:

```ts
      sql: `INSERT INTO nutzer_empfehlungen (mitglied_id, strain_id, rang, score, bezug_strain_id, gemeinsam, bestaetigt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      params: [mitgliedId, e.strainId, e.rang, e.score, e.bezugStrainId, JSON.stringify(e.gemeinsam), e.bestaetigt ? 1 : 0],
```

- [ ] **Step 4: Tests laufen lassen, sie bestehen**

Run: `npx tsx --test tests/empfehlung.test.ts && npx tsc --noEmit -p .`
Expected: PASS, auch „Vorauswahl in D1 … gleiche Top 6“ und das CPU-Budget.

- [ ] **Step 5: Commit**

```bash
git add lib/empfehlung.ts tests/empfehlung.test.ts
git commit -m "feat: bestätigte Vorschläge nach Community-Note, Auffüllen unter drei"
```

---

### Task 3: Profilrechnung und Auswertungen (Strang A, nach Task 2)

**Files:**
- Create: `lib/profil.ts`
- Create: `tests/profil.test.ts`

**Interfaces:**
- Consumes: `profilAus`, `bewertungsGewicht`, `type EigeneBewertung`, `type SortenAroma` aus `lib/empfehlung.ts`; Typen aus `lib/profil-typen.ts`; `berechneGesamtnote` aus `lib/query/bewertung.ts`.
- Produces:
  - `PROFIL_GUELTIG_MS = 86_400_000`, `PROFIL_AUSSAGEKRAEFTIG_AB = 3`
  - `profilVeraltet(berechnetAm: Date | null | undefined, jetzt: number): boolean`
  - `noteOderErsatz(r: { gesamtnote: number | null; aussehen: number; geruch: number; geschmack: number; wirkung: number; konsistenz: number }): number`
  - `leereProfilWerte(): ProfilWerte`
  - `profilAnzeige(bewertungen: readonly EigeneBewertung[], sorten: readonly SortenAroma[]): ProfilWerte`
  - `profilDaten(w: ProfilWerte): { geschmack: string; terpene: string; anzahl: number; gewichtet: number }`
  - `profilAusDaten(z: { geschmack: string; terpene: string; anzahl: number; gewichtet: number }): ProfilWerte`
  - `auswertungen(zeilen: readonly AuswertungsZeile[]): Auswertungen`

- [ ] **Step 1: Tests schreiben**

```ts
// tests/profil.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import type { GeschmacksKategorie } from "@/db/enums";
import type { SortenAroma } from "@/lib/empfehlung";
import {
  auswertungen,
  leereProfilWerte,
  noteOderErsatz,
  profilAnzeige,
  profilAusDaten,
  profilDaten,
  profilVeraltet,
  PROFIL_GUELTIG_MS,
} from "@/lib/profil";
import type { AuswertungsZeile } from "@/lib/profil-typen";

const sorte = (strainId: string, terpene: [string, GeschmacksKategorie][]): SortenAroma => ({
  strainId,
  terpene: terpene.map(([name, geschmack], i) => ({ name, geschmack, rang: i + 1 })),
});
const ZITRUS = sorte("zitrus", [["Limonen", "ZITRUS"], ["Myrcen", "ERDIG"]]);
const HOLZ = sorte("holz", [["Humulen", "HOLZIG"], ["beta-Caryophyllen", "WUERZIG"]]);

test("noteOderErsatz: Gesamtnote, sonst Mittel der fünf Noten", () => {
  const noten = { aussehen: 4, geruch: 4, geschmack: 5, wirkung: 3, konsistenz: 4 };
  assert.equal(noteOderErsatz({ gesamtnote: 2.5, ...noten }), 2.5);
  assert.equal(noteOderErsatz({ gesamtnote: null, ...noten }), 4);
});

test("profilAnzeige: mag ich positiv, mag ich nicht negativ, stärkste Achse 1", () => {
  const w = profilAnzeige(
    [
      { strainId: "zitrus", gesamtnote: 5, terpene: {}, geschmack: {} },
      { strainId: "holz", gesamtnote: 1, terpene: {}, geschmack: {} },
    ],
    [ZITRUS, HOLZ],
  );
  assert.ok(w.geschmack.ZITRUS > 0);
  assert.ok(w.geschmack.HOLZIG < 0);
  const betraege = Object.values(w.geschmack).map(Math.abs);
  assert.equal(Math.max(...betraege), 1);
  assert.ok(betraege.every((x) => x <= 1));
  assert.equal(w.anzahl, 2);
  assert.equal(w.gewichtet, 2);
  assert.equal(w.terpene[0].name, "Limonen");
  assert.equal(w.terpene[0].wert, 1);
  assert.ok(w.terpene.some((t) => t.name === "Humulen" && t.wert < 0));
  // Positive vor negativen.
  const ersteNegative = w.terpene.findIndex((t) => t.wert < 0);
  assert.ok(w.terpene.slice(ersteNegative).every((t) => t.wert < 0));
});

test("profilAnzeige: höchstens 8 positive und 3 negative Terpene", () => {
  const namen = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const viel = sorte("viel", namen.map((n): [string, GeschmacksKategorie] => [n, "SUESS"]));
  const wenig = sorte("wenig", ["K", "L", "M", "N", "O"].map((n): [string, GeschmacksKategorie] => [n, "ERDIG"]));
  const w = profilAnzeige(
    [
      { strainId: "viel", gesamtnote: 5, terpene: {}, geschmack: {} },
      { strainId: "wenig", gesamtnote: 0.5, terpene: {}, geschmack: {} },
    ],
    [viel, wenig],
  );
  assert.equal(w.terpene.filter((t) => t.wert > 0).length, 8);
  assert.equal(w.terpene.filter((t) => t.wert < 0).length, 3);
});

test("profilAnzeige: nur Mittelfeld ergibt Nullen, aber den Zähler", () => {
  const w = profilAnzeige([{ strainId: "zitrus", gesamtnote: 3, terpene: {}, geschmack: {} }], [ZITRUS]);
  assert.ok(Object.values(w.geschmack).every((x) => x === 0));
  assert.deepEqual(w.terpene, []);
  assert.equal(w.anzahl, 1);
  assert.equal(w.gewichtet, 0);
});

test("profilDaten und profilAusDaten: Hin und zurück, kaputter Text wird leer", () => {
  const w = profilAnzeige([{ strainId: "zitrus", gesamtnote: 4.5, terpene: {}, geschmack: {} }], [ZITRUS]);
  assert.deepEqual(profilAusDaten(profilDaten(w)), w);
  const kaputt = profilAusDaten({ geschmack: "{kaputt", terpene: "nein", anzahl: 4, gewichtet: 2 });
  assert.deepEqual(kaputt, { ...leereProfilWerte(), anzahl: 4, gewichtet: 2 });
  const fremd = profilAusDaten({ geschmack: '{"ZITRUS":0.5,"UNBEKANNT":1,"ERDIG":"x"}', terpene: '[{"name":"Myrcen","wert":0.4},{"name":3}]', anzahl: 1, gewichtet: 1 });
  assert.equal(fremd.geschmack.ZITRUS, 0.5);
  assert.equal(fremd.geschmack.ERDIG, 0);
  assert.deepEqual(fremd.terpene, [{ name: "Myrcen", wert: 0.4 }]);
});

test("profilVeraltet: fehlt oder älter als 24 h", () => {
  const jetzt = Date.parse("2026-10-07T12:00:00Z");
  assert.equal(profilVeraltet(null, jetzt), true);
  assert.equal(profilVeraltet(new Date(jetzt - PROFIL_GUELTIG_MS + 1000), jetzt), false);
  assert.equal(profilVeraltet(new Date(jetzt - PROFIL_GUELTIG_MS - 1000), jetzt), true);
});

const zeile = (slug: string, gesamtnote: number | null, extra: Partial<AuswertungsZeile> = {}): AuswertungsZeile => ({
  slug,
  handelsname: slug.toUpperCase(),
  erstelltAm: new Date("2026-10-01T00:00:00Z"),
  gesamtnote,
  aussehen: 4,
  geruch: 4,
  geschmack: 4,
  wirkung: 4,
  konsistenz: 4,
  freigegeben: false,
  community: null,
  ...extra,
});

test("auswertungen: Top drei, Flop aus dem Rest, schlechteste zuerst", () => {
  const a = auswertungen([zeile("a", 5), zeile("b", 1), zeile("c", 4), zeile("d", 2), zeile("e", 3), zeile("f", 4.5)]);
  assert.deepEqual(a.top.map((x) => x.slug), ["a", "f", "c"]);
  assert.deepEqual(a.flop.map((x) => x.slug), ["b", "d", "e"]);
  assert.equal(a.top[0].note, 5);
});

test("auswertungen: bei drei oder weniger kein Flop; leer ohne Schnitte", () => {
  assert.deepEqual(auswertungen([zeile("a", 5), zeile("b", 1)]).flop, []);
  const leer = auswertungen([]);
  assert.equal(leer.schnitte, null);
  assert.deepEqual(leer.top, []);
  assert.equal(leer.community.differenz, null);
});

test("auswertungen: Community ohne eigene Note, strenger negativ, ab zwei vergleichbaren", () => {
  const a = auswertungen([
    // eigene freigegeben, steckt im Mittel: (4 × 3 − 3) / 2 = 4,5 → −1,5
    zeile("a", 3, { freigegeben: true, community: { mittel: 4, anzahl: 3 } }),
    // eigene nicht freigegeben: Mittel 4 → 0
    zeile("b", 4, { community: { mittel: 4, anzahl: 1 } }),
    // nur die eigene: kein Vergleich
    zeile("c", 5, { freigegeben: true, community: { mittel: 5, anzahl: 1 } }),
  ]);
  assert.equal(a.community.vergleichbar, 2);
  // (−1,5 + 0) / 2 = −0,75; Math.round(−7,5) ergibt −7 → −0,7.
  assert.equal(a.community.differenz, -0.7);
  assert.deepEqual(a.community.abweichungen[0], { slug: "a", handelsname: "A", eigene: 3, community: 4.5 });
  assert.equal(a.community.abweichungen.length, 2);
  assert.equal(auswertungen([zeile("b", 4, { community: { mittel: 4, anzahl: 1 } })]).community.differenz, null);
});

test("auswertungen: Schnitte je Kategorie mit Ersatznote, auf 0,1 gerundet", () => {
  const a = auswertungen([zeile("a", null, { wirkung: 5 }), zeile("b", 3, { aussehen: 3 })]);
  assert.deepEqual(a.schnitte, { aussehen: 3.5, geruch: 4, geschmack: 4, wirkung: 4.5, konsistenz: 4, gesamt: 3.6 });
});
```

Rechenweg letzter Test: Ersatznote von `a` = (4+4+4+5+4)/5 = 4,2; gesamt (4,2+3)/2 = 3,6.

- [ ] **Step 2: Tests laufen lassen, sie scheitern**

Run: `npx tsx --test tests/profil.test.ts`
Expected: FAIL, `Cannot find module '@/lib/profil'`.

- [ ] **Step 3: `lib/profil.ts` schreiben**

```ts
import { GESCHMACKS_KATEGORIEN, istGeschmacksKategorie, type GeschmacksKategorie } from "@/db/enums";
import { bewertungsGewicht, profilAus, type EigeneBewertung, type SortenAroma } from "@/lib/empfehlung";
import type { AuswertungsZeile, Auswertungen, BewertungsKurz, ProfilWerte, Schnitte } from "@/lib/profil-typen";
import { berechneGesamtnote } from "@/lib/query/bewertung";

/**
 * Profil und Dashboard, Stufe 1 (Spec 2026-10-07). Reine Rechnung: das Netz
 * aus dem Empfehlungsprofil (lib/empfehlung.ts), die Auswertungen aus den
 * eigenen Bewertungen. Nur Aroma im Netz, nie Wirkung (HWG).
 */

/** So lange gilt der gespeicherte Stand; danach rechnet /profil neu (neue Community-Werte). */
export const PROFIL_GUELTIG_MS = 24 * 60 * 60 * 1000;
/** Ab so vielen gewichteten Bewertungen gilt das Netz als aussagekräftig. */
export const PROFIL_AUSSAGEKRAEFTIG_AB = 3;

const TERPENE_POSITIV = 8;
const TERPENE_NEGATIV = 3;

export function profilVeraltet(berechnetAm: Date | null | undefined, jetzt: number): boolean {
  return !berechnetAm || jetzt - berechnetAm.getTime() > PROFIL_GUELTIG_MS;
}

/** Altbewertungen vor v2 haben keine Gesamtnote: dann das Mittel der fünf Noten. */
export function noteOderErsatz(r: {
  gesamtnote: number | null;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
}): number {
  return r.gesamtnote ?? berechneGesamtnote(r);
}

const zwei = (x: number) => Math.round(x * 100) / 100 + 0;
const eine = (x: number) => Math.round(x * 10) / 10 + 0;

function leererGeschmack(): Record<GeschmacksKategorie, number> {
  return Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])) as Record<GeschmacksKategorie, number>;
}

export function leereProfilWerte(): ProfilWerte {
  return { geschmack: leererGeschmack(), terpene: [], anzahl: 0, gewichtet: 0 };
}

/** Netz und Terpenliste aus dem Profilvektor, je auf das stärkste |Gewicht| normiert (Spec 4.2). */
export function profilAnzeige(bewertungen: readonly EigeneBewertung[], sorten: readonly SortenAroma[]): ProfilWerte {
  const { profil } = profilAus(bewertungen, sorten);
  const geschmack = leererGeschmack();
  let maxG = 0;
  for (const k of GESCHMACKS_KATEGORIEN) maxG = Math.max(maxG, Math.abs(profil.get(`g:${k}`) ?? 0));
  if (maxG > 0) for (const k of GESCHMACKS_KATEGORIEN) geschmack[k] = zwei((profil.get(`g:${k}`) ?? 0) / maxG);

  const terpenWerte: { name: string; wert: number }[] = [];
  for (const [k, x] of profil) if (k.startsWith("t:") && x !== 0) terpenWerte.push({ name: k.slice(2), wert: x });
  const maxT = Math.max(0, ...terpenWerte.map((t) => Math.abs(t.wert)));
  const normiert = maxT > 0 ? terpenWerte.map((t) => ({ name: t.name, wert: zwei(t.wert / maxT) })) : [];
  const nachName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "de");
  const positiv = normiert.filter((t) => t.wert > 0).sort((a, b) => b.wert - a.wert || nachName(a, b)).slice(0, TERPENE_POSITIV);
  const negativ = normiert.filter((t) => t.wert < 0).sort((a, b) => a.wert - b.wert || nachName(a, b)).slice(0, TERPENE_NEGATIV);

  return {
    geschmack,
    terpene: [...positiv, ...negativ],
    anzahl: bewertungen.length,
    gewichtet: bewertungen.filter((b) => bewertungsGewicht(b.gesamtnote) !== 0).length,
  };
}

/** Spalten für `nutzer_profil`. */
export function profilDaten(w: ProfilWerte) {
  return { geschmack: JSON.stringify(w.geschmack), terpene: JSON.stringify(w.terpene), anzahl: w.anzahl, gewichtet: w.gewichtet };
}

function json(roh: string): unknown {
  try {
    return JSON.parse(roh);
  } catch {
    return undefined;
  }
}

/** Liest `nutzer_profil` und prüft jede Angabe; Unbekanntes und Kaputtes fällt auf 0 bzw. weg. */
export function profilAusDaten(z: { geschmack: string; terpene: string; anzahl: number; gewichtet: number }): ProfilWerte {
  const geschmack = leererGeschmack();
  const g = json(z.geschmack);
  if (g && typeof g === "object" && !Array.isArray(g)) {
    for (const [k, v] of Object.entries(g)) {
      if (istGeschmacksKategorie(k) && typeof v === "number" && Number.isFinite(v)) geschmack[k] = Math.max(-1, Math.min(1, v));
    }
  }
  const t = json(z.terpene);
  const terpene = Array.isArray(t)
    ? t.filter(
        (x): x is { name: string; wert: number } =>
          !!x && typeof x.name === "string" && typeof x.wert === "number" && Number.isFinite(x.wert),
      ).map((x) => ({ name: x.name, wert: x.wert }))
    : [];
  return { geschmack, terpene, anzahl: z.anzahl, gewichtet: z.gewichtet };
}

/** Top, Flop, Vergleich und Schnitte je Aufruf (Spec 4.5); reine Arithmetik. */
export function auswertungen(zeilen: readonly AuswertungsZeile[]): Auswertungen {
  const mitNote = zeilen.map((z) => ({ z, note: noteOderErsatz(z) }));
  const sortiert = [...mitNote].sort((a, b) => b.note - a.note || b.z.erstelltAm.getTime() - a.z.erstelltAm.getTime());
  const kurz = ({ z, note }: { z: AuswertungsZeile; note: number }): BewertungsKurz => ({ slug: z.slug, handelsname: z.handelsname, note });
  const top = sortiert.slice(0, 3).map(kurz);
  const flop = sortiert.slice(3).slice(-3).reverse().map(kurz);

  // Community-Mittel ohne die eigene Note: freigegeben steckt sie in `mittel`.
  // `anzahl` zählt alle freigegebenen, `mittel` nur die mit Gesamtnote; seit v2
  // haben alle neuen eine, Altbewertungen ohne sind selten.
  const vergleiche: { z: AuswertungsZeile; eigene: number; community: number }[] = [];
  for (const { z, note } of mitNote) {
    const c = z.community;
    if (!c || c.mittel === null) continue;
    const eigeneDrin = z.freigegeben && z.gesamtnote !== null;
    const fremde = eigeneDrin ? c.anzahl - 1 : c.anzahl;
    if (fremde < 1) continue;
    const community = eigeneDrin ? (c.mittel * c.anzahl - z.gesamtnote!) / fremde : c.mittel;
    vergleiche.push({ z, eigene: note, community: eine(community) });
  }
  const differenz =
    vergleiche.length >= 2 ? eine(vergleiche.reduce((s, v) => s + (v.eigene - v.community), 0) / vergleiche.length) : null;
  const abweichungen = [...vergleiche]
    .sort((a, b) => Math.abs(b.eigene - b.community) - Math.abs(a.eigene - a.community))
    .slice(0, 3)
    .map((v) => ({ slug: v.z.slug, handelsname: v.z.handelsname, eigene: v.eigene, community: v.community }));

  let schnitte: Schnitte | null = null;
  if (zeilen.length > 0) {
    const mittel = (f: (z: AuswertungsZeile) => number) => eine(zeilen.reduce((s, z) => s + f(z), 0) / zeilen.length);
    schnitte = {
      aussehen: mittel((z) => z.aussehen),
      geruch: mittel((z) => z.geruch),
      geschmack: mittel((z) => z.geschmack),
      wirkung: mittel((z) => z.wirkung),
      konsistenz: mittel((z) => z.konsistenz),
      gesamt: eine(mitNote.reduce((s, x) => s + x.note, 0) / mitNote.length),
    };
  }

  return { top, flop, community: { differenz, vergleichbar: vergleiche.length, abweichungen }, schnitte };
}
```

Prüfen, dass `istGeschmacksKategorie` und `GESCHMACKS_KATEGORIEN` aus `@/db/enums` exportiert sind (`lib/empfehlung.ts` importiert beide bereits).

- [ ] **Step 4: Tests laufen lassen, sie bestehen**

Run: `npx tsx --test tests/profil.test.ts && npx tsc --noEmit -p .`
Expected: PASS (11 Tests).

- [ ] **Step 5: Commit**

```bash
git add lib/profil.ts tests/profil.test.ts
git commit -m "feat: Profilnetz, Terpenliste und Auswertungen als reine Rechnung"
```

---

### Task 4: Profil fortschreiben und laden (Strang A, nach Task 3)

**Files:**
- Create: `lib/query/profil.ts`
- Modify: `lib/query/empfehlungen.ts` (`empfehlungenFortschreiben` entfällt, `ladeEmpfehlungen` liefert `bestaetigt`)
- Modify: `app/[lang]/blueten/[slug]/aktionen.ts` (CRLF; Zeilen 7 und 106–118)
- Test: `tests/profil.test.ts` (Quelltextprüfung der Action anhängen)

**Interfaces:**
- Consumes: `profilAnzeige`, `profilDaten`, `profilAusDaten`, `noteOderErsatz`, `auswertungen` (Task 3); `empfehlungenBerechnen`, `empfehlungenErsetzen`, `profilTerpene`, SQL-Konstanten (Task 2).
- Produces:
  - `profilFortschreiben(mitgliedId: string): Promise<void>`
  - `ladeProfil(mitgliedId: string): Promise<{ werte: ProfilWerte; berechnetAm: Date } | null>`
  - `ladeAuswertungsZeilen(mitgliedId: string): Promise<AuswertungsZeile[]>`
  - `GespeicherteEmpfehlung.bestaetigt: boolean`

- [ ] **Step 1: Quelltexttest anhängen**

In `tests/profil.test.ts` oben `import { readFileSync } from "node:fs";` ergänzen und anhängen:

```ts
test("Bewertung speichern schreibt das Profil fort und erneuert /profil", () => {
  const quelle = readFileSync("app/[lang]/blueten/[slug]/aktionen.ts", "utf8");
  assert.match(quelle, /await profilFortschreiben\(mitglied\.mitgliedId\)/);
  assert.doesNotMatch(quelle, /empfehlungenFortschreiben/);
  assert.match(quelle, /revalidiereSprachen\("\/profil"\)/);
});
```

- [ ] **Step 2: Test laufen lassen, er scheitert**

Run: `npx tsx --test tests/profil.test.ts`
Expected: FAIL im neuen Test.

- [ ] **Step 3: `lib/query/profil.ts` schreiben**

Die Rechnung aus `empfehlungenFortschreiben` (`lib/query/empfehlungen.ts`) zieht hierher um und rechnet das Profil gleich mit:

```ts
import {
  empfehlungenBerechnen,
  empfehlungenErsetzen,
  KANDIDATEN_ANZAHL,
  KANDIDATEN_SQL,
  profilTerpene,
  SORTEN_AROMA_SQL,
  sortenAusZeilen,
  TERPENE_SQL,
  type SortenAromaZeile,
  type TerpenZeile,
} from "@/lib/empfehlung";
import { getEnv } from "@/lib/cloudflare";
import { noteOderErsatz, profilAnzeige, profilAusDaten, profilDaten } from "@/lib/profil";
import type { AuswertungsZeile, ProfilWerte } from "@/lib/profil-typen";
import { getPrisma } from "@/lib/prisma";
import { parseGeschmacksMatrix, parseTerpenIntensitaet } from "@/lib/query/bewertung";

/** Obergrenze eigener Bewertungen im Profil; erreicht wird geloggt. */
const BEWERTUNGEN_HOECHSTENS = 1000;

/**
 * Empfehlungen und Profilwerte eines Mitglieds neu rechnen und ablegen (T11,
 * Spec Profil 4.4). Läuft beim Speichern einer Bewertung und auf /profil, wenn
 * der Stand älter als 24 h ist; nie über alle Sorten je Seitenaufruf. Zählen
 * alle eigenen Bewertungen, auch noch nicht freigegebene: es geht um den
 * Geschmack des Mitglieds. Altbewertungen ohne Gesamtnote zählen mit dem
 * Mittel ihrer fünf Noten.
 */
export async function profilFortschreiben(mitgliedId: string): Promise<void> {
  const prisma = await getPrisma();
  const [eigene, terpene] = await Promise.all([
    prisma.review.findMany({
      where: { autorId: mitgliedId },
      orderBy: { erstelltAm: "desc" },
      select: {
        strainId: true,
        gesamtnote: true,
        aussehen: true,
        geruch: true,
        geschmack: true,
        wirkung: true,
        konsistenz: true,
        terpenIntensitaet: true,
        geschmacksMatrix: true,
      },
      take: BEWERTUNGEN_HOECHSTENS,
    }),
    prisma.$queryRawUnsafe<TerpenZeile[]>(TERPENE_SQL),
  ]);
  if (eigene.length >= BEWERTUNGEN_HOECHSTENS) console.warn("profil: Bewertungsgrenze erreicht", BEWERTUNGEN_HOECHSTENS);
  const bewertungen = eigene.map((r) => ({
    strainId: r.strainId,
    gesamtnote: noteOderErsatz(r),
    terpene: parseTerpenIntensitaet(r.terpenIntensitaet),
    geschmack: parseGeschmacksMatrix(r.geschmacksMatrix),
  }));
  const bewerteteIds = JSON.stringify([...new Set(bewertungen.map((b) => b.strainId))]);

  // Erst das Profil aus den bewerteten Sorten, dann nur die Kandidaten, die D1
  // danach vorsortiert: der Worker rechnet über rund 150 statt 700 Sorten.
  const bewertete = sortenAusZeilen(terpene, await prisma.$queryRawUnsafe<SortenAromaZeile[]>(SORTEN_AROMA_SQL, bewerteteIds));
  const gewichte = profilTerpene(bewertungen, bewertete, terpene);
  const kandidaten =
    Object.keys(gewichte).length === 0
      ? []
      : sortenAusZeilen(
          terpene,
          await prisma.$queryRawUnsafe<SortenAromaZeile[]>(KANDIDATEN_SQL, JSON.stringify(gewichte), bewerteteIds, KANDIDATEN_ANZAHL),
        );
  const liste = empfehlungenBerechnen(bewertungen, [...bewertete, ...kandidaten]);
  const daten = { ...profilDaten(profilAnzeige(bewertungen, bewertete)), berechnetAm: new Date() };

  // Atomar ersetzen: D1-batch läuft als eine Transaktion, Prismas $transaction
  // auf D1 dagegen als Einzelabfragen (siehe lib/auth.ts).
  const { DB } = await getEnv();
  await DB.batch(empfehlungenErsetzen(mitgliedId, liste).map((a) => DB.prepare(a.sql).bind(...a.params)));
  await prisma.nutzerProfil.upsert({ where: { mitgliedId }, create: { mitgliedId, ...daten }, update: daten });
}

/** Der gespeicherte Stand, eine Abfrage; null, wenn noch nie gerechnet. */
export async function ladeProfil(mitgliedId: string): Promise<{ werte: ProfilWerte; berechnetAm: Date } | null> {
  const prisma = await getPrisma();
  const z = await prisma.nutzerProfil.findUnique({ where: { mitgliedId } });
  return z ? { werte: profilAusDaten(z), berechnetAm: z.berechnetAm } : null;
}

/** Eigene Bewertungen mit Sorte und Community-Werten für die Auswertungen (Spec 4.5). */
export async function ladeAuswertungsZeilen(mitgliedId: string): Promise<AuswertungsZeile[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.review.findMany({
    where: { autorId: mitgliedId },
    orderBy: { erstelltAm: "desc" },
    take: BEWERTUNGEN_HOECHSTENS,
    select: {
      erstelltAm: true,
      gesamtnote: true,
      aussehen: true,
      geruch: true,
      geschmack: true,
      wirkung: true,
      konsistenz: true,
      freigegeben: true,
      strain: { select: { slug: true, handelsname: true, kennwerte: { select: { gesamtnoteMittel: true, anzahl: true } } } },
    },
  });
  return zeilen.map((z) => ({
    slug: z.strain.slug,
    handelsname: z.strain.handelsname,
    erstelltAm: z.erstelltAm,
    gesamtnote: z.gesamtnote,
    aussehen: z.aussehen,
    geruch: z.geruch,
    geschmack: z.geschmack,
    wirkung: z.wirkung,
    konsistenz: z.konsistenz,
    freigegeben: z.freigegeben,
    community: z.strain.kennwerte ? { mittel: z.strain.kennwerte.gesamtnoteMittel, anzahl: z.strain.kennwerte.anzahl } : null,
  }));
}
```

- [ ] **Step 4: `lib/query/empfehlungen.ts` anpassen**

- `empfehlungenFortschreiben` samt `BEWERTUNGEN_HOECHSTENS` und den nur dort genutzten Imports löschen (`empfehlungenBerechnen`, `empfehlungenErsetzen`, `KANDIDATEN_ANZAHL`, `KANDIDATEN_SQL`, `profilTerpene`, `SORTEN_AROMA_SQL`, `sortenAusZeilen`, `TERPENE_SQL`, `SortenAromaZeile`, `TerpenZeile`, `getEnv`, `parseGeschmacksMatrix`, `parseTerpenIntensitaet`). Danach `npx eslint lib/query/empfehlungen.ts` zeigt keine unbenutzten Imports.
- `GespeicherteEmpfehlung` um `/** Von der Community bestätigt (Spec Profil 4.3). */ bestaetigt: boolean;` ergänzen.
- In `ladeEmpfehlungen`: `select` um `bestaetigt: true` ergänzen, Rückgabe um `bestaetigt: z.bestaetigt`.

`grep -rn "empfehlungenFortschreiben" app lib components tests` darf danach nur noch Kommentare in `tests/empfehlung.test.ts` zeigen; den Kommentar dort (Zeile 158) auf `profilFortschreiben` ändern.

- [ ] **Step 5: Action umstellen (CRLF erhalten)**

In `app/[lang]/blueten/[slug]/aktionen.ts`:
- Import Zeile 7: `import { profilFortschreiben } from "@/lib/query/profil";`
- Den Block nach `await kennwerteFortschreiben(strain.id);`:

```ts
  // Empfehlungen und Profil (T11, Spec Profil 4.4) hier vorberechnen, nie je Seitenaufruf.
  // Ein Fehler darin soll die gespeicherte Bewertung nicht als gescheitert melden.
  try {
    await profilFortschreiben(mitglied.mitgliedId);
  } catch (fehler) {
    console.error("profilFortschreiben fehlgeschlagen", fehler);
  }
```

- Nach `revalidiereSprachen("/mitglied");` eine Zeile `revalidiereSprachen("/profil");`.

Mit Python und `newline=""` schreiben; `git ls-files --eol` muss weiter `w/crlf` zeigen.

- [ ] **Step 6: Alles prüfen**

Run: `npx tsx --test tests/profil.test.ts && npx tsc --noEmit -p . && npm test && npx eslint lib/query/profil.ts lib/query/empfehlungen.ts "app/[lang]/blueten/[slug]/aktionen.ts"`
Expected: alles grün, keine Lint-Fehler.

- [ ] **Step 7: Commit**

```bash
git add lib/query/profil.ts lib/query/empfehlungen.ts "app/[lang]/blueten/[slug]/aktionen.ts" tests/profil.test.ts tests/empfehlung.test.ts
git commit -m "feat: Profil beim Speichern einer Bewertung fortschreiben"
```

---

### Task 5: Profilnetz und Terpenliste (Strang B)

**Files:**
- Create: `components/profil/ProfilNetz.tsx`
- Create: `components/profil/TerpenRangliste.tsx`
- Create: `tests/profil-bausteine.test.ts`

**Interfaces:**
- Consumes: `ProfilWerte` (Task 1), `w.profil`, `w.label.geschmack`, `netzPunkte`/`alsPolygon` aus `lib/netz.ts`, `GESCHMACKS_ACHSEN` aus `lib/query/bewertung.ts`, `terpenAnzeige` aus `lib/i18n/terpen.ts`, `formatiereWert` aus `lib/format.ts`, `buttonKlassen` aus `components/ui`.
- Produces:
  - `ProfilNetz(props: { werte: ProfilWerte; texte: Woerterbuch["profil"]; achsen: Woerterbuch["label"]["geschmack"]; sprache: Sprache })`
  - `TerpenRangliste(props: { terpene: ProfilWerte["terpene"]; texte: Woerterbuch["profil"]; sprache: Sprache })`

Beide sind Server Components ohne `"use client"`.

- [ ] **Step 1: Render-Tests schreiben**

```ts
// tests/profil-bausteine.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { TerpenRangliste } from "@/components/profil/TerpenRangliste";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { de } from "@/lib/i18n/de";
import type { ProfilWerte } from "@/lib/profil-typen";

// Eigene Hilfe statt leereProfilWerte: lib/profil.ts entsteht parallel in Strang A.
const leer = (): ProfilWerte => ({
  geschmack: Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])) as ProfilWerte["geschmack"],
  terpene: [],
  anzahl: 0,
  gewichtet: 0,
});

const netz = (werte: ProfilWerte) =>
  renderToStaticMarkup(createElement(ProfilNetz, { werte, texte: de.profil, achsen: de.label.geschmack, sprache: "de" }));

test("ProfilNetz: ohne Bewertung leere Skizze und Knopf zur ersten Bewertung", () => {
  const html = netz(leer());
  assert.match(html, /Erste Bewertung abgeben/);
  assert.match(html, /href="\/blueten"/);
  assert.doesNotMatch(html, /data-netz="mag"/);
});

test("ProfilNetz: nur Mittelfeld erklärt, warum das Netz leer ist", () => {
  const html = netz({ ...leer(), anzahl: 2, gewichtet: 0 });
  assert.match(html, /Deine bisherigen liegen dazwischen/);
  assert.doesNotMatch(html, /Erste Bewertung abgeben/);
});

test("ProfilNetz: Fläche für mag ich, gestrichelt für mag ich nicht, vorläufig unter 3", () => {
  const werte = { ...leer(), anzahl: 2, gewichtet: 2 };
  werte.geschmack.ZITRUS = 1;
  werte.geschmack.HOLZIG = -0.6;
  const html = netz(werte);
  assert.match(html, /data-netz="mag"[^>]*fill-opacity="0.12"/);
  assert.match(html, /data-netz="mag-nicht"[^>]*stroke-dasharray="4 4"/);
  assert.match(html, /Vorläufig: 2 von 3 Bewertungen/);
  // Werte für Screenreader, das SVG selbst ist stumm.
  assert.match(html, /Zitrus: mag ich, 5 von 5/);
  assert.match(html, /Holzig: mag ich nicht, 3 von 5/);
  assert.match(html, /<svg[^>]*aria-hidden="true"/);
  // Legende mit Form, nicht nur Farbe.
  assert.match(html, /mag ich nicht/);
});

test("ProfilNetz: ab 3 gewichteten kein Vorläufig-Hinweis, ohne Ablehnung keine Strichlinie", () => {
  const werte = { ...leer(), anzahl: 5, gewichtet: 3 };
  werte.geschmack.SUESS = 0.5;
  const html = netz(werte);
  assert.doesNotMatch(html, /Vorläufig/);
  assert.doesNotMatch(html, /data-netz="mag-nicht"/);
});

test("TerpenRangliste: Balken nach Wert, Ablehnung abgesetzt unter „eher nicht“", () => {
  const html = renderToStaticMarkup(
    createElement(TerpenRangliste, {
      terpene: [
        { name: "Limonen", wert: 1 },
        { name: "Myrcen", wert: 0.5 },
        { name: "Humulen", wert: -0.4 },
      ],
      texte: de.profil,
      sprache: "de",
    }),
  );
  assert.match(html, /Limonen/);
  assert.match(html, /width:100%/);
  assert.match(html, /width:50%/);
  assert.match(html, /eher nicht/);
  assert.match(html, /width:40%/);
  assert.ok(html.indexOf("Myrcen") < html.indexOf("eher nicht"));
  assert.ok(html.indexOf("eher nicht") < html.indexOf("Humulen"));
});

test("TerpenRangliste: leer rendert nichts", () => {
  assert.equal(renderToStaticMarkup(createElement(TerpenRangliste, { terpene: [], texte: de.profil, sprache: "de" })), "");
});
```

- [ ] **Step 2: Tests laufen lassen, sie scheitern**

Run: `npx tsx --test tests/profil-bausteine.test.ts`
Expected: FAIL, Komponenten fehlen.

- [ ] **Step 3: `components/profil/ProfilNetz.tsx` schreiben**

Skill `ui-design-engine` laden. Geometrie wie `components/review/Netzdiagramm.tsx` (320er viewBox, Radius 110, Ringe 1–5, Beschriftung als HTML in Prozent).

```tsx
import Link from "next/link";

import { buttonKlassen } from "@/components/ui";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { formatiereWert } from "@/lib/format";
import { alsPolygon, netzPunkte } from "@/lib/netz";
import type { ProfilWerte } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";
```

`PROFIL_AUSSAGEKRAEFTIG_AB` liegt in `lib/profil.ts` (Strang A, parallel). Deshalb hier vorerst eine lokale Konstante; Task 8 ersetzt sie durch den Import.

Komponente:

```tsx
const GROESSE = 320;
const MITTE = GROESSE / 2;
const RADIUS = 110;
const MAX = 5;
const RINGE = [1, 2, 3, 4, 5] as const;
// Wie PROFIL_AUSSAGEKRAEFTIG_AB in lib/profil.ts (Spec Profil 2.10).
const AUSSAGEKRAEFTIG_AB = 3;

function gleichmaessig(wert: number, radius = RADIUS) {
  return netzPunkte(GESCHMACKS_ACHSEN.map(() => wert), MAX, radius, MITTE);
}

type Props = {
  werte: ProfilWerte;
  texte: Woerterbuch["profil"];
  achsen: Woerterbuch["label"]["geschmack"];
  sprache: Sprache;
};

/**
 * Das eigene Aroma-Netz (Spec Profil 5.1): Fläche für „mag ich“, gestrichelt
 * für „mag ich nicht“, Werte relativ zur stärksten Vorliebe auf 0 bis 5.
 * Datengrafik in Tinte; die Werte stehen zusätzlich als Liste für
 * Screenreader, das SVG ist aria-hidden. Nur Aroma, nie Wirkung (HWG).
 */
export function ProfilNetz({ werte, texte, achsen, sprache }: Props) {
  const mag = GESCHMACKS_ACHSEN.map((a) => Math.max(0, werte.geschmack[a.enumWert]) * MAX);
  const magNicht = GESCHMACKS_ACHSEN.map((a) => Math.max(0, -werte.geschmack[a.enumWert]) * MAX);
  const hatMag = mag.some((x) => x > 0);
  const hatMagNicht = magNicht.some((x) => x > 0);
  const beschriftung = gleichmaessig(MAX, RADIUS + 28);

  return (
    <figure className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm">
        <svg viewBox={`0 0 ${GROESSE} ${GROESSE}`} aria-hidden="true" className="block w-full text-text">
          {RINGE.map((ring) => (
            <polygon key={ring} points={alsPolygon(gleichmaessig(ring))} fill="none" stroke="currentColor" strokeOpacity={0.15} vectorEffect="non-scaling-stroke" />
          ))}
          {gleichmaessig(MAX).map((p, i) => (
            <line key={GESCHMACKS_ACHSEN[i].key} x1={MITTE} y1={MITTE} x2={p.x} y2={p.y} stroke="currentColor" strokeOpacity={0.15} vectorEffect="non-scaling-stroke" />
          ))}
          {hatMag ? (
            <polygon data-netz="mag" points={alsPolygon(netzPunkte(mag, MAX, RADIUS, MITTE))} fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          ) : null}
          {hatMagNicht ? (
            <polygon data-netz="mag-nicht" points={alsPolygon(netzPunkte(magNicht, MAX, RADIUS, MITTE))} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          ) : null}
        </svg>
        {beschriftung.map((p, i) => (
          <span
            key={GESCHMACKS_ACHSEN[i].key}
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 text-caption whitespace-nowrap text-text-muted"
            style={{ left: `${(p.x / GROESSE) * 100}%`, top: `${(p.y / GROESSE) * 100}%` }}
          >
            {achsen[GESCHMACKS_ACHSEN[i].enumWert]}
          </span>
        ))}
      </div>

      {hatMag || hatMagNicht ? (
        <>
          {/* Legende mit Form, nicht nur Farbe. */}
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-small text-text-muted">
            <li className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6 text-text"><rect width="24" height="8" fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1.5} /></svg>
              {texte.magIch}
            </li>
            {hatMagNicht ? (
              <li className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6 text-text"><line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" strokeWidth={1.5} strokeDasharray="4 4" /></svg>
                {texte.magIchNicht}
              </li>
            ) : null}
          </ul>
          <figcaption className="text-small text-text-muted">{texte.netzSkala}</figcaption>
          <ul className="sr-only">
            {GESCHMACKS_ACHSEN.map((a, i) => {
              const achse = achsen[a.enumWert];
              const text =
                mag[i] > 0
                  ? t(texte.srMag, { achse, wert: formatiereWert(mag[i], sprache) })
                  : magNicht[i] > 0
                    ? t(texte.srMagNicht, { achse, wert: formatiereWert(magNicht[i], sprache) })
                    : t(texte.srNeutral, { achse });
              return <li key={a.key}>{text}</li>;
            })}
          </ul>
        </>
      ) : null}

      {werte.anzahl === 0 ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="max-w-[48ch] text-body text-text-muted">{texte.leer}</p>
          <Link prefetch={false} href="/blueten" className={buttonKlassen("primary")}>
            {texte.ersteBewertung}
          </Link>
        </div>
      ) : werte.gewichtet === 0 ? (
        <p className="max-w-[48ch] text-center text-body text-text-muted">{texte.nurMittelfeld}</p>
      ) : werte.gewichtet < AUSSAGEKRAEFTIG_AB ? (
        <p className="text-center text-small text-text-muted">{t(texte.vorlaeufig, { anzahl: werte.gewichtet })}</p>
      ) : null}
    </figure>
  );
}
```

Prüfen: `buttonKlassen` kennt die Variante `"primary"` (`components/ui/Button.tsx` ansehen; sonst die dort übliche Hauptvariante nehmen und im Test nichts ändern). `formatiereWert(5, "de")` ergibt `5`, `formatiereWert(3, "de")` ergibt `3` (−0,6 × 5 = 3).

- [ ] **Step 4: `components/profil/TerpenRangliste.tsx` schreiben**

```tsx
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { ProfilWerte } from "@/lib/profil-typen";

type Props = { terpene: ProfilWerte["terpene"]; texte: Woerterbuch["profil"]; sprache: Sprache };

/**
 * Terpene des Profils als Rangliste (Spec Profil 5.1): Balken in Tinte, Länge
 * relativ zum stärksten. Abgelehnte stehen abgesetzt unter „eher nicht“,
 * gestrichelt umrandet ohne Fläche. Nur Aroma (HWG).
 */
export function TerpenRangliste({ terpene, texte, sprache }: Props) {
  if (terpene.length === 0) return null;
  const positiv = terpene.filter((t) => t.wert > 0);
  const negativ = terpene.filter((t) => t.wert < 0);
  const zeile = (t: { name: string; wert: number }, abgelehnt: boolean) => (
    <li key={t.name} className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-4">
      <span className="truncate text-small text-text">{terpenAnzeige(t.name, sprache)}</span>
      <span className="h-2 w-full" aria-hidden="true">
        <span
          className={abgelehnt ? "block h-2 border border-dashed border-text" : "block h-2 bg-text/12 border border-text"}
          style={{ width: `${Math.round(Math.abs(t.wert) * 100)}%` }}
        />
      </span>
    </li>
  );
  return (
    <div className="flex w-full flex-col gap-4">
      <h3 className="text-h4 text-text">{texte.terpeneTitel}</h3>
      {positiv.length > 0 ? <ol className="flex flex-col gap-2">{positiv.map((t) => zeile(t, false))}</ol> : null}
      {negativ.length > 0 ? (
        <>
          <p className="text-caption text-text-muted">{texte.terpeneEherNicht}</p>
          <ol className="flex flex-col gap-2">{negativ.map((t) => zeile(t, true))}</ol>
        </>
      ) : null}
    </div>
  );
}
```

`text-h4` und `bg-text/12` gegen `app/globals.css` prüfen; gibt es `text-h4` nicht, die dort für Unterüberschriften übliche Klasse nehmen (z. B. `text-small font-medium uppercase tracking-gesperrt`). Die Inline-Breite rendert React als `style="width:100%"`; der Test sucht `width:100%`.

- [ ] **Step 5: Tests laufen lassen, sie bestehen**

Run: `npx tsx --test tests/profil-bausteine.test.ts && npx tsc --noEmit -p . && npx eslint components/profil`
Expected: PASS (6 Tests), keine Fehler.

- [ ] **Step 6: Commit**

```bash
git add components/profil/ProfilNetz.tsx components/profil/TerpenRangliste.tsx tests/profil-bausteine.test.ts
git commit -m "feat: Profilnetz mit mag ich und mag ich nicht, Terpen-Rangliste"
```

---

### Task 6: Auswertungskarten und Vorschlagsmarke (Strang B, nach Task 5)

**Files:**
- Create: `components/profil/TopFlop.tsx`
- Create: `components/profil/CommunityVergleich.tsx`
- Create: `components/profil/Schnitte.tsx`
- Modify: `components/empfehlung/EmpfehlungsListe.tsx` (optionale Marke je Eintrag)
- Modify: `tests/profil-bausteine.test.ts`

**Interfaces:**
- Consumes: `Auswertungen`, `BewertungsKurz`, `CommunityVergleich as CommunityVergleichDaten`, `Schnitte as SchnitteDaten` (Task 1); `w.profil`, `w.schema.noten`; `formatiereZahl` aus `lib/format.ts`; `Badge`, `namenLinkKlassen` aus `components/ui`.
- Produces:
  - `TopFlop(props: { top: BewertungsKurz[]; flop: BewertungsKurz[]; texte: Woerterbuch["profil"]; sprache: Sprache })`
  - `CommunityVergleich(props: { daten: CommunityVergleichDaten; texte: Woerterbuch["profil"]; sprache: Sprache })`
  - `Schnitte(props: { daten: SchnitteDaten; texte: Woerterbuch["profil"]; noten: Woerterbuch["schema"]["noten"]; sprache: Sprache })`
  - `EmpfehlungsEintrag.marke?: string` (Badge neben dem Namen, z. B. „noch nicht bestätigt“)

- [ ] **Step 1: Tests anhängen**

```ts
import { TopFlop } from "@/components/profil/TopFlop";
import { CommunityVergleich } from "@/components/profil/CommunityVergleich";
import { Schnitte } from "@/components/profil/Schnitte";
import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";

test("TopFlop: Noten mit Komma, Links zur Blüte, ohne Flop der Hinweis", () => {
  const html = renderToStaticMarkup(
    createElement(TopFlop, { top: [{ slug: "a", handelsname: "Alpha", note: 4.5 }], flop: [], texte: de.profil, sprache: "de" }),
  );
  assert.match(html, /href="\/blueten\/a"/);
  assert.match(html, /4,5 von 5/);
  assert.match(html, /Ab vier Bewertungen/);
});

test("CommunityVergleich: strenger bei negativer Differenz, Betrag ohne Minus", () => {
  const html = renderToStaticMarkup(
    createElement(CommunityVergleich, {
      daten: { differenz: -0.4, vergleichbar: 2, abweichungen: [{ slug: "a", handelsname: "Alpha", eigene: 3, community: 4.5 }] },
      texte: de.profil,
      sprache: "de",
    }),
  );
  assert.match(html, /im Schnitt 0,4 strenger/);
  assert.match(html, /du 3,0/);
  assert.match(html, /Community 4,5/);
});

test("CommunityVergleich: milder, gleich und leer", () => {
  const r = (differenz: number | null) =>
    renderToStaticMarkup(createElement(CommunityVergleich, { daten: { differenz, vergleichbar: differenz === null ? 1 : 2, abweichungen: [] }, texte: de.profil, sprache: "de" }));
  assert.match(r(0.3), /0,3 milder/);
  assert.match(r(0), /wie die Community/);
  assert.match(r(null), /Sobald zwei deiner Sorten/);
});

test("Schnitte: sechs Werte mit Beschriftung aus dem Schema, Wirkung privat dabei", () => {
  const html = renderToStaticMarkup(
    createElement(Schnitte, {
      daten: { aussehen: 4, geruch: 3.5, geschmack: 4.2, wirkung: 3.8, konsistenz: 4.1, gesamt: 3.9 },
      texte: de.profil,
      noten: de.schema.noten,
      sprache: "de",
    }),
  );
  for (const wort of ["Aussehen", "Geruch", "Geschmack", "Wirkung", "Konsistenz", "Gesamt", "3,9", "4,2"]) assert.match(html, new RegExp(wort));
});

test("EmpfehlungsListe: Marke als Badge nur, wo gesetzt", () => {
  const html = renderToStaticMarkup(
    createElement(EmpfehlungsListe, {
      eintraege: [
        { slug: "a", handelsname: "Alpha", begruendung: "" },
        { slug: "b", handelsname: "Beta", begruendung: "", marke: "noch nicht bestätigt" },
      ],
    }),
  );
  assert.equal(html.match(/noch nicht bestätigt/g)?.length, 1);
  assert.ok(html.indexOf("Beta") < html.indexOf("noch nicht bestätigt"));
});
```

- [ ] **Step 2: Tests laufen lassen, sie scheitern**

Run: `npx tsx --test tests/profil-bausteine.test.ts`
Expected: FAIL, Komponenten fehlen.

- [ ] **Step 3: Komponenten schreiben**

`components/profil/TopFlop.tsx`:

```tsx
import Link from "next/link";

import { namenLinkKlassen } from "@/components/ui";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { BewertungsKurz } from "@/lib/profil-typen";

type Props = { top: BewertungsKurz[]; flop: BewertungsKurz[]; texte: Woerterbuch["profil"]; sprache: Sprache };

/** Deine besten und schwächsten drei (Spec Profil 5.3), je mit Note und Link zur Blüte. */
export function TopFlop({ top, flop, texte, sprache }: Props) {
  const liste = (eintraege: BewertungsKurz[]) => (
    <ol className="flex flex-col gap-2">
      {eintraege.map((e) => (
        <li key={e.slug} className="flex items-baseline justify-between gap-4 border-t border-border pt-2">
          <Link prefetch={false} href={`/blueten/${e.slug}`} className={namenLinkKlassen("inline-flex min-h-11 items-center font-buch text-body wrap-break-word")}>
            {e.handelsname}
          </Link>
          <span className="numeric shrink-0 text-small text-text-muted">{t(texte.note, { note: formatiereZahl(e.note, 1, sprache) })}</span>
        </li>
      ))}
    </ol>
  );
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <section className="flex flex-col gap-2">
        <h3 className="text-small font-medium text-text">{texte.top}</h3>
        {liste(top)}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-small font-medium text-text">{texte.flop}</h3>
        {flop.length > 0 ? liste(flop) : <p className="text-small text-text-muted">{texte.flopLeer}</p>}
      </section>
    </div>
  );
}
```

`components/profil/CommunityVergleich.tsx`:

```tsx
import Link from "next/link";

import { namenLinkKlassen } from "@/components/ui";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { CommunityVergleich as Daten } from "@/lib/profil-typen";

type Props = { daten: Daten; texte: Woerterbuch["profil"]; sprache: Sprache };

/** Du gegen die Community (Spec Profil 4.5): ein Satz, dann die größten Abweichungen. */
export function CommunityVergleich({ daten, texte, sprache }: Props) {
  if (daten.differenz === null) return <p className="max-w-[68ch] text-body text-text-muted">{texte.communityLeer}</p>;
  const betrag = formatiereZahl(Math.abs(daten.differenz), 1, sprache);
  const satz =
    Math.abs(daten.differenz) < 0.1
      ? texte.gleich
      : t(daten.differenz < 0 ? texte.strenger : texte.milder, { wert: betrag });
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-[68ch] text-body text-text">{satz}</p>
      {daten.abweichungen.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-small font-medium text-text">{texte.abweichungen}</h3>
          <ol className="flex flex-col gap-2">
            {daten.abweichungen.map((a) => (
              <li key={a.slug} className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-border pt-2">
                <Link prefetch={false} href={`/blueten/${a.slug}`} className={namenLinkKlassen("inline-flex min-h-11 items-center font-buch text-body wrap-break-word")}>
                  {a.handelsname}
                </Link>
                <span className="numeric text-small text-text-muted">
                  {t(texte.duNote, { note: formatiereZahl(a.eigene, 1, sprache) })}
                  {" · "}
                  {t(texte.communityNote, { note: formatiereZahl(a.community, 1, sprache) })}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
```

`" · "` ist ein Trennzeichen ohne Wort; prüfen, ob `tests/i18n-literale.test.ts` es zulässt (es sucht deutsche Wörter). Wenn nicht, `aria-hidden`-Span mit `·` wie in anderen Komponenten (`grep -rn '" · "' components`).

`components/profil/Schnitte.tsx`:

```tsx
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { Schnitte as Daten } from "@/lib/profil-typen";

type Props = { daten: Daten; texte: Woerterbuch["profil"]; noten: Woerterbuch["schema"]["noten"]; sprache: Sprache };

const REIHE = ["aussehen", "geruch", "geschmack", "wirkung", "konsistenz"] as const;

/** Mittel je Kategorie über alle eigenen Bewertungen (Spec Profil 4.5). Wirkung nur hier, privat. */
export function Schnitte({ daten, texte, noten, sprache }: Props) {
  const werte = [...REIHE.map((k) => ({ k, label: noten[k].label, wert: daten[k] })), { k: "gesamt", label: texte.gesamt, wert: daten.gesamt }];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-small text-text-muted">{texte.schnitteSatz}</p>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
        {werte.map((w) => (
          <div key={w.k} className="flex flex-col gap-1 border-t border-border pt-2">
            <dt className="text-small text-text-muted">{w.label}</dt>
            <dd className="numeric font-buch text-h3 text-text">{formatiereZahl(w.wert, 1, sprache)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

`components/empfehlung/EmpfehlungsListe.tsx`: Typ `EmpfehlungsEintrag = { slug: string; handelsname: string; begruendung: string; /** Badge neben dem Namen, z. B. „noch nicht bestätigt“ (Spec Profil 5.2). */ marke?: string }`. `Badge` aus `@/components/ui` importieren. Den `Link` in ein `<span className="flex flex-wrap items-center gap-x-4 gap-y-2">` setzen und danach `{e.marke ? <Badge variante="neutral" zeichen={false}>{e.marke}</Badge> : null}`.

- [ ] **Step 4: Tests laufen lassen, sie bestehen**

Run: `npx tsx --test tests/profil-bausteine.test.ts && npx tsc --noEmit -p . && npm test && npx eslint components/profil components/empfehlung/EmpfehlungsListe.tsx`
Expected: alles grün.

- [ ] **Step 5: Commit**

```bash
git add components/profil tests/profil-bausteine.test.ts components/empfehlung/EmpfehlungsListe.tsx
git commit -m "feat: Auswertungskarten fürs Profil, Marke für unbestätigte Vorschläge"
```

---

### Task 7: Navigation, Reiter und Konto (Strang C)

**Files:**
- Modify: `lib/navigation.ts`
- Modify: `tests/navigation.test.ts` (CRLF)
- Create: `components/profil/ProfilReiter.tsx`
- Modify: `app/[lang]/mitglied/page.tsx`
- Modify: `components/empfehlung/EmpfehlungenImBrowser.tsx` (Link-Ziel)
- Modify: `components/vorschlag/BlueteVorschlagFormular.tsx` (Link-Ziel Zeile 215)
- Modify: `app/[lang]/anmelden/page.tsx`, `app/[lang]/registrieren/page.tsx` (Vorgabeziel Zeile 21)
- Modify: `app/[lang]/admin/vorschlag-aktionen.ts` (Benachrichtigungslink Zeile 239 bleibt `/mitglied`, nur prüfen)
- Modify: `components/layout/Kopf.tsx` (nur Kommentare „Mein Konto“ → „Mein Profil“)
- Modify: `app/[lang]/datenschutz/page.tsx` (CRLF; Zeile 215 „Mein Konto“ → „Mein Profil, Reiter Konto“)

**Interfaces:**
- Consumes: `w.profil.reiterLeiste|reiterProfil|reiterKonto` (Task 1).
- Produces: `KONTO_LINK = { href: "/profil", schluessel: "konto" }`; `istAktiv` markiert `/profil` auch auf `/mitglied`; `ProfilReiter(props: { aktiv: "profil" | "konto"; texte: Woerterbuch["profil"] })`.

- [ ] **Step 1: Tests anpassen und ergänzen (CRLF erhalten)**

In `tests/navigation.test.ts`:
- `assert.deepEqual(KONTO_LINK, { href: "/mitglied", schluessel: "konto" });` → `{ href: "/profil", schluessel: "konto" }`.
- Anhängen:

```ts
test("istAktiv: Mein Profil gilt auch auf dem Reiter Konto", () => {
  assert.equal(istAktiv("/profil", "/profil"), true);
  assert.equal(istAktiv("/mitglied", "/profil"), true);
  assert.equal(istAktiv("/mitglied-x", "/profil"), false);
  assert.equal(istAktiv("/mitglied", "/reviews"), false);
});

test("ProfilReiter: zwei Reiter, aktiver mit aria-current", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { ProfilReiter } = await import("@/components/profil/ProfilReiter");
  const html = renderToStaticMarkup(createElement(ProfilReiter, { aktiv: "konto", texte: de.profil }));
  assert.match(html, /<nav aria-label="Profil und Konto"/);
  assert.match(html, /href="\/profil"[^>]*>Profil</);
  assert.match(html, /aria-current="page"[^>]*href="\/mitglied"|href="\/mitglied"[^>]*aria-current="page"/);
});
```

- [ ] **Step 2: Tests laufen lassen, sie scheitern**

Run: `npx tsx --test tests/navigation.test.ts`
Expected: FAIL (Ziel `/mitglied`, `ProfilReiter` fehlt).

- [ ] **Step 3: `lib/navigation.ts` ändern**

```ts
/** Texte im Woerterbuch unter kopf.navigation[schluessel]. Konto ist seit Spec Profil 6 ein Reiter des Profils. */
export const KONTO_LINK = { href: "/profil", schluessel: "konto" } as const;

/** Pfade, die zusätzlich als „hier“ zählen: /mitglied ist der Reiter Konto von /profil. */
const AUCH_AKTIV: Record<string, readonly string[]> = { "/profil": ["/mitglied"] };

/** Aktiv sind die Seite selbst und ihre Unterseiten, nicht ein blosser Namensanfang. */
export function istAktiv(pfad: string, href: string): boolean {
  return [href, ...(AUCH_AKTIV[href] ?? [])].some((h) => pfad === h || pfad.startsWith(`${h}/`));
}
```

Den Dateikommentar oben „"Mein Konto" steht getrennt“ → „"Mein Profil" steht getrennt“.

- [ ] **Step 4: `components/profil/ProfilReiter.tsx` schreiben**

```tsx
import Link from "next/link";

import { cn } from "@/lib/cn";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = { aktiv: "profil" | "konto"; texte: Woerterbuch["profil"] };

const REITER = [
  { id: "profil", href: "/profil" },
  { id: "konto", href: "/mitglied" },
] as const;

/**
 * Reiter Profil | Konto (Spec Profil 5, 6): kein fünfter Menüpunkt, das Konto
 * ist ein Reiter des Profils. Aktiv mit aria-current und Unterstrich, nie nur Farbe.
 */
export function ProfilReiter({ aktiv, texte }: Props) {
  return (
    <nav aria-label={texte.reiterLeiste} className="mt-8 flex gap-2 border-b border-border">
      {REITER.map((r) => (
        <Link
          key={r.id}
          prefetch={false}
          href={r.href}
          aria-current={aktiv === r.id ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center px-4 text-small font-medium text-text-muted transition-colors duration-fast ease-standard hover:text-text",
            aktiv === r.id && "text-text underline decoration-text decoration-2 underline-offset-8",
          )}
        >
          {r.id === "profil" ? texte.reiterProfil : texte.reiterKonto}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 5: `/mitglied` umbauen**

In `app/[lang]/mitglied/page.tsx`:
- Imports `ladeEmpfehlungen`, `EmpfehlungsListe`, `begruendungText`, `unstable_rethrow` entfernen (sofern sonst ungenutzt).
- `Promise.all` nur noch über `benachrichtigungenLaden` und `eigeneVorschlaege`.
- Die ganze `<section aria-labelledby="empfehlungen-titel">` löschen (samt Kommentar davor).
- Direkt nach dem schließenden `</div>` des Kopfes (vor der Status-Section) `<ProfilReiter aktiv="konto" texte={w.profil} />` einsetzen; Import `import { ProfilReiter } from "@/components/profil/ProfilReiter";`.
- `redirect("/anmelden?weiter=%2Fmitglied")` bleibt.

- [ ] **Step 6: Links und Kommentare nachziehen**

- `components/empfehlung/EmpfehlungenImBrowser.tsx`: `href="/mitglied"` → `href="/profil"`.
- `components/vorschlag/BlueteVorschlagFormular.tsx` Zeile 215: bleibt `/mitglied` (dort stehen die Vorschläge), nichts ändern; nur den Text liefert Task 1.
- `app/[lang]/anmelden/page.tsx` und `app/[lang]/registrieren/page.tsx`: `sicheresZiel(weiter, "/mitglied")` → `sicheresZiel(weiter, "/profil")`. Vorher `grep -rn '"/mitglied"' tests` prüfen und betroffene Erwartungen mitändern.
- `components/layout/Kopf.tsx`: in den Kommentaren Zeile 14–19 „Mein Konto“ → „Mein Profil“ und „/mitglied leitet ohne Anmeldung …“ → „/profil leitet ohne Anmeldung …“.
- `app/[lang]/datenschutz/page.tsx` (CRLF): „unter „Mein Konto““ → „unter „Mein Profil“ im Reiter „Konto““.

- [ ] **Step 7: Alles prüfen**

Run: `npx tsx --test tests/navigation.test.ts && npx tsc --noEmit -p . && npm test && npx eslint lib/navigation.ts components/profil/ProfilReiter.tsx "app/[lang]/mitglied/page.tsx" components/empfehlung/EmpfehlungenImBrowser.tsx`
Expected: alles grün. `git ls-files --eol tests/navigation.test.ts "app/[lang]/datenschutz/page.tsx"` zeigt weiter `w/crlf`.

- [ ] **Step 8: Commit**

```bash
git add lib/navigation.ts tests/navigation.test.ts components/profil/ProfilReiter.tsx "app/[lang]/mitglied/page.tsx" components/empfehlung/EmpfehlungenImBrowser.tsx "app/[lang]/anmelden/page.tsx" "app/[lang]/registrieren/page.tsx" components/layout/Kopf.tsx "app/[lang]/datenschutz/page.tsx"
git commit -m "feat: Mein Profil führt zu /profil, Konto als Reiter"
```

---

### Task 8: Seite /profil (nach Merge von A, B, C)

**Files:**
- Create: `app/[lang]/profil/page.tsx`
- Modify: `components/profil/ProfilNetz.tsx` (lokale Grenze durch Import ersetzen)
- Modify: `tests/i18n-literale.test.ts` (neue Dateien in `UMGESTELLT`)
- Create: `tests/profil-seite.test.ts`

**Interfaces:**
- Consumes: alles aus Task 2–7.

- [ ] **Step 1: Quelltexttest schreiben**

```ts
// tests/profil-seite.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const seite = () => readFileSync("app/[lang]/profil/page.tsx", "utf8");

test("/profil: nur angemeldet, nicht im Index, rechnet nur bei veraltetem Stand", () => {
  const q = seite();
  assert.match(q, /redirect\("\/anmelden\?weiter=%2Fprofil"\)/);
  assert.match(q, /index: false/);
  assert.match(q, /profilVeraltet\(/);
  assert.match(q, /profilFortschreiben\(/);
});

test("/profil: Reihenfolge Netz, Vorschläge, Top/Flop, Community, Schnitte; kein Apothekenlink", () => {
  const q = seite();
  const reihe = ["<ProfilNetz", "<EmpfehlungsListe", "<TopFlop", "<CommunityVergleich", "<Schnitte"].map((s) => q.indexOf(s));
  assert.ok(reihe.every((i) => i > 0));
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
  assert.doesNotMatch(q, /apotheke/i);
  assert.match(q, /<ProfilReiter aktiv="profil"/);
});
```

- [ ] **Step 2: Test laufen lassen, er scheitert**

Run: `npx tsx --test tests/profil-seite.test.ts`
Expected: FAIL, Datei fehlt.

- [ ] **Step 3: Seite schreiben**

Vor dem Schreiben `node_modules/next/dist/docs/` zu `redirect`, `unstable_rethrow` und `generateMetadata` gegenlesen. `app/[lang]/mitglied/page.tsx` als Muster.

```tsx
import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";

import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { CommunityVergleich } from "@/components/profil/CommunityVergleich";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { ProfilReiter } from "@/components/profil/ProfilReiter";
import { Schnitte } from "@/components/profil/Schnitte";
import { TerpenRangliste } from "@/components/profil/TerpenRangliste";
import { TopFlop } from "@/components/profil/TopFlop";
import { Avatar, Card, CardBody, CardHeader } from "@/components/ui";
import { begruendungText } from "@/lib/empfehlung-text";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { mehrzahl } from "@/lib/i18n/text";
import { auswertungen, leereProfilWerte, profilVeraltet } from "@/lib/profil";
import { ladeEmpfehlungen } from "@/lib/query/empfehlungen";
import { ladeAuswertungsZeilen, ladeProfil, profilFortschreiben } from "@/lib/query/profil";
import { aktuellesMitglied } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await holeWoerterbuch()).profil.titel, robots: { index: false, follow: false } };
}

/** Fehler eines Teils reißen die Seite nicht mit (wie /mitglied); Redirects gehen durch. */
function oderNull<T>(name: string) {
  return (fehler: unknown): T | null => {
    unstable_rethrow(fehler);
    console.error(`${name} fehlgeschlagen`, fehler);
    return null;
  };
}

/**
 * Privates Dashboard (Spec Profil 5): Netz und Terpene, bestätigte Vorschläge,
 * Top/Flop, Vergleich mit der Community, Schnitte. Profilwerte kommen
 * vorberechnet aus nutzer_profil; neu gerechnet wird nur, wenn der Stand fehlt
 * oder älter als 24 h ist (CPU-Limit 10 ms). Nur Aroma in Netz und Vorschlägen (HWG).
 */
export default async function ProfilPage() {
  const mitglied = await aktuellesMitglied();
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const texte = w.profil;
  if (!mitglied) redirect("/anmelden?weiter=%2Fprofil");

  let profil = await ladeProfil(mitglied.mitgliedId).catch(oderNull<Awaited<ReturnType<typeof ladeProfil>>>("ladeProfil"));
  if (profilVeraltet(profil?.berechnetAm, Date.now())) {
    try {
      await profilFortschreiben(mitglied.mitgliedId);
      profil = await ladeProfil(mitglied.mitgliedId);
    } catch (fehler) {
      unstable_rethrow(fehler);
      console.error("profilFortschreiben fehlgeschlagen", fehler);
    }
  }
  const [empfehlungen, zeilen] = await Promise.all([
    ladeEmpfehlungen(mitglied.mitgliedId).catch(oderNull<Awaited<ReturnType<typeof ladeEmpfehlungen>>>("ladeEmpfehlungen")),
    ladeAuswertungsZeilen(mitglied.mitgliedId).catch(oderNull<Awaited<ReturnType<typeof ladeAuswertungsZeilen>>>("ladeAuswertungsZeilen")),
  ]);
  const werte = profil?.werte ?? leereProfilWerte();
  const a = zeilen ? auswertungen(zeilen) : null;

  return (
    <div className="mx-auto w-full max-w-180 px-4 py-16 sm:px-8">
      <div className="flex items-center gap-4">
        <Avatar name={mitglied.anzeigename} bildId={mitglied.avatarId} groesse="md" />
        <div>
          <h1 className="text-h1 text-text">{texte.titel}</h1>
          <p className="numeric mt-2 text-body text-text-muted">{mehrzahl(sprache, texte.anzahl, zeilen?.length ?? werte.anzahl)}</p>
        </div>
      </div>
      <ProfilReiter aktiv="profil" texte={texte} />

      <section aria-labelledby="netz-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="netz-titel" className="text-h3 text-text">{texte.netzTitel}</h2>
          </CardHeader>
          <CardBody className="flex flex-col items-center gap-8">
            {profil === null && werte.anzahl === 0 && zeilen && zeilen.length > 0 ? (
              <p className="max-w-[68ch] text-body text-text">{texte.fehler}</p>
            ) : (
              <>
                <p className="max-w-[68ch] self-start text-body text-text-muted">{texte.netzSatz}</p>
                <ProfilNetz werte={werte} texte={texte} achsen={w.label.geschmack} sprache={sprache} />
                <TerpenRangliste terpene={werte.terpene} texte={texte} sprache={sprache} />
              </>
            )}
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="vorschlaege-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="vorschlaege-titel" className="text-h3 text-text">{texte.vorschlaegeTitel}</h2>
          </CardHeader>
          <CardBody className="flex flex-col items-start gap-6">
            {empfehlungen === null ? (
              <p className="max-w-[68ch] text-body text-text">{w.empfehlung.fehler}</p>
            ) : empfehlungen.length === 0 ? (
              <p className="max-w-[68ch] text-body text-text-muted">{w.empfehlung.leer}</p>
            ) : (
              <EmpfehlungsListe
                schmal
                className="w-full"
                eintraege={empfehlungen.map((e) => ({
                  slug: e.slug,
                  handelsname: e.handelsname,
                  begruendung: begruendungText(e, w, sprache),
                  marke: e.bestaetigt ? undefined : texte.nichtBestaetigt,
                }))}
              />
            )}
            <p className="text-caption text-text-muted">{texte.bestaetigtHinweis}</p>
            <p className="text-caption text-text-muted">{w.empfehlung.hinweis}</p>
          </CardBody>
        </Card>
      </section>

      {a === null ? (
        <p className="mt-8 max-w-[68ch] text-body text-text">{texte.fehler}</p>
      ) : a.schnitte ? (
        <>
          <section aria-labelledby="topflop-titel" className="mt-8">
            <Card>
              <CardHeader>
                <h2 id="topflop-titel" className="text-h3 text-text">{texte.topFlopTitel}</h2>
              </CardHeader>
              <CardBody>
                <TopFlop top={a.top} flop={a.flop} texte={texte} sprache={sprache} />
              </CardBody>
            </Card>
          </section>
          <section aria-labelledby="community-titel" className="mt-8">
            <Card>
              <CardHeader>
                <h2 id="community-titel" className="text-h3 text-text">{texte.communityTitel}</h2>
              </CardHeader>
              <CardBody>
                <CommunityVergleich daten={a.community} texte={texte} sprache={sprache} />
              </CardBody>
            </Card>
          </section>
          <section aria-labelledby="schnitte-titel" className="mt-8">
            <Card>
              <CardHeader>
                <h2 id="schnitte-titel" className="text-h3 text-text">{texte.schnitteTitel}</h2>
              </CardHeader>
              <CardBody>
                <Schnitte daten={a.schnitte} texte={texte} noten={w.schema.noten} sprache={sprache} />
              </CardBody>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
}
```

Prüfen: `holeSprache` und `holeWoerterbuch` werden in `/mitglied` aus `@/lib/i18n` importiert (dort zwei Importzeilen; hier eine reicht, wenn beide aus `@/lib/i18n` kommen). `Avatar`-Props wie in `/mitglied`.

- [ ] **Step 4: Grenze in ProfilNetz auf `lib/profil.ts` umstellen**

In `components/profil/ProfilNetz.tsx` die lokale `AUSSAGEKRAEFTIG_AB` samt Kommentar löschen, `import { PROFIL_AUSSAGEKRAEFTIG_AB } from "@/lib/profil";` ergänzen und die Vergleichsstelle auf `PROFIL_AUSSAGEKRAEFTIG_AB` umstellen.

- [ ] **Step 5: Literal-Wächter ergänzen**

In `tests/i18n-literale.test.ts` am Ende von `UMGESTELLT` einen Block anfügen:

```ts
  // Profil Stufe 1 (Spec 2026-10-07)
  "app/[lang]/profil/page.tsx",
  "components/profil/ProfilNetz.tsx",
  "components/profil/TerpenRangliste.tsx",
  "components/profil/TopFlop.tsx",
  "components/profil/CommunityVergleich.tsx",
  "components/profil/Schnitte.tsx",
  "components/profil/ProfilReiter.tsx",
```

- [ ] **Step 6: Alles prüfen**

Run: `npx tsx --test tests/profil-seite.test.ts tests/i18n-literale.test.ts && npx tsc --noEmit -p . && npm test && npx eslint "app/[lang]/profil/page.tsx" components/profil`
Expected: alles grün. Meldet der Literal-Wächter ein Wort, es in `lib/i18n` verlagern (Schlüssel in beiden Sprachen), nicht in `ERLAUBT` eintragen.

- [ ] **Step 7: Commit**

```bash
git add "app/[lang]/profil/page.tsx" components/profil/ProfilNetz.tsx tests/i18n-literale.test.ts tests/profil-seite.test.ts
git commit -m "feat: privates Profil unter /profil"
```

---

### Task 9: Remote-D1, Push, Live-Prüfung (Controller)

- [ ] **Step 1:** Ganzbranch-Review (`superpowers:requesting-code-review`) über Task 1–8, Funde beheben.
- [ ] **Step 2:** `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0017_nutzer_profil.sql` (vor dem Push).
- [ ] **Step 3:** `npm test`, `npx tsc --noEmit -p .`, dann `git push` nach `main`.
- [ ] **Step 4:** Live per Browser-MCP als Betreiber: Kopf zeigt „Mein Profil“, `/profil` lädt, Netz mit Fläche und ggf. Strichlinie, Terpenliste, Vorschläge mit Marken, Top/Flop, Community-Satz, Schnitte; Reiter „Konto“ führt zu `/mitglied`, Knopf dort aktiv; mobil unter 640 px ohne horizontalen Überlauf (`document.documentElement.scrollWidth`).
- [ ] **Step 5:** Eine Bewertung speichern und `/profil` neu laden: `berechnet_am` erneuert, Netz entspricht dem neuen Stand.
- [ ] **Step 6:** HANDOFF aktualisieren (Stufe 1 live, nächster Schritt Plan Stufe 2), committen, pushen.
