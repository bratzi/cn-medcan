# Terpz-Jury Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **DAUERREGEL (Nutzer 2026-10-16, „GANZ GANZ WICHTIG“):** Jede Task nennt eine Zeile **Skills:**. Wer die Task
> umsetzt oder reviewt, lädt **genau diese Skills per Skill-Tool, bevor er eine Datei liest oder ändert**, und nennt
> sie in seiner Rückmeldung. UI-Reviews laden zusätzlich `better-interface`.

**Goal:** Eine vom Admin bestimmte Jury schreibt Review-Beiträge und Artikel, gebündelt in Ausgaben eines Magazins
(`/jury`), mit Bildgalerie, „Jury's Favourites“, Team-Seite und Instagram-Collab-Post je Beitrag.

**Architecture:** Drei neue D1-Tabellen (`jury_ausgabe`, `jury_beitrag`, `jury_bild`) plus Flag `mitglieder.jury`.
Reine Logik (Eingabeprüfung, Markdown-Teilmenge, Sichtbarkeit) in `lib/jury*.ts`, Abfragen in `lib/query/jury.ts`,
Server-Aktionen unter `app/[lang]/jury/aktionen.ts` und `app/[lang]/admin/jury/aktionen.ts`, öffentliche Seiten
statisch mit `revalidiereSprachen`. Instagram über ein lokales/Routine-Skript (`scripts/ig-jury.ts`) mit Graph API
(`collaborators`), Fallback Publora.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), Prisma 7 + D1, Tailwind v4 Tokens,
node:test über `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-16-terpz-jury-design.md`

## Global Constraints

- HWG: kein Text über Wirkung; jeder Beitragstext (Titel, Anriss, Text) läuft durch `hwgTreffer` (`lib/hwg-filter.ts`); keine Preise, keine Apotheken-Links; Listen nach Erscheinungsdatum, nie nach Note.
- Kein R2, keine Kosten: Bilder als BLOB in D1, höchstens `JURY_BILD_MAX_BYTES = 300 * 1024`, lange Kante `JURY_BILD_MAX_KANTE = 1600`, `JURY_BILDER_MAX = 5` je Beitrag.
- Rechte immer aus der Sitzung (`mitgliedErforderlich`, `adminErforderlich`), nie aus dem Formular.
- D1: jede Liste mit `take`, Bilder nie in Listenabfragen, höchstens eine Seite Ids je `in`.
- UI nach `.claude/skills/ui-design-engine.md` (Tokens, 8px-Raster, Bewegung nur transform/opacity/clip-path, reduzierte Bewegung).
- Kein lokales `next dev/build`; prüfen mit `npx tsc --noEmit -p .`, `npm test`, `npx eslint <dateien>`; live nach Push.
- Remote-D1 spielt Claude selbst ein: `npx wrangler d1 execute <db> --remote --file migrations/0026_jury.sql`.
- Prisma-Client nach Schemaänderung neu erzeugen: `npx prisma generate`.
- Texte deutsch und englisch in `lib/i18n/de.ts` und `lib/i18n/en.ts` (Typ folgt aus `de`).
- Commits Prosa, Endzeile `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; nach jeder Task push nach `main` (Regel „Push nach main“).

## Review Focus

- Beitrag veröffentlicht, Ausgabe noch Entwurf: der Beitrag darf öffentlich nicht erscheinen (Task 2 Test `sichtbar`).
- Jury-Mitglied verknüpft eine fremde oder nicht freigegebene Bewertung: Speichern lehnt ab (Task 4 Test).
- Markdown mit `<script>` oder `[x](javascript:…)`: wird als Text ausgegeben, nie als HTML/Link (Task 2 Test).
- Sechstes Bild zu einem Beitrag: Upload lehnt ab, vorhandene bleiben (Task 4 Test).
- Jury-Flag entzogen, Entwurf existiert: Mitglied kann ihn nicht mehr einreichen, Admin sieht ihn weiter (Task 4 Test).

## Stränge (parallel, je Strang ein Worktree)

- **Strang 1 (Daten, zuerst):** Task 1 → Task 2 → Task 3. Danach können 2 und 3 parallel starten.
- **Strang 2 (Schreiben):** Task 4 → Task 5 → Task 6.
- **Strang 3 (Lesen):** Task 7 → Task 8.
- **Strang 4 (Instagram):** Task 9.
- Abschluss: Task 10 (Live-Prüfung) nach dem Merge aller Stränge.

---

### Task 1: Schema, Migration, Jury-Flag in Sitzung und Admin

**Skills:** `prisma-client-api`, `prisma-cli`, `cloudflare-d1`, `cloudflare:wrangler`, `edge-stack-master`, `superpowers:test-driven-development`

**Files:**
- Create: `migrations/0026_jury.sql`
- Modify: `prisma/schema.prisma` (Model `Mitglied`: Feld `jury`; neue Models `JuryAusgabe`, `JuryBeitrag`, `JuryBild`; Relationen an `Mitglied` und `Review`)
- Modify: `db/enums.ts` (Status-Listen)
- Modify: `lib/session.ts:23-90` (`AngemeldetesMitglied.jury`), neue Funktion `juryErforderlich`
- Modify: `app/[lang]/admin/aktionen.ts` (Aktion `juryUmschalten`), `app/[lang]/admin/page.tsx` (Schalter in der Mitgliederliste)
- Test: `tests/jury-schema.test.ts`

**Interfaces:**
- Produces: `JURY_STATUS = ["ENTWURF","EINGEREICHT","VEROEFFENTLICHT","ZURUECKGEZOGEN"] as const`, `AUSGABE_STATUS = ["ENTWURF","VEROEFFENTLICHT"] as const`, `IG_STATUS = ["KEIN","ENTWURF","GEPLANT","VEROEFFENTLICHT","FEHLER"] as const`, `istJuryStatus`, `istAusgabeStatus`, `istIgStatus` (db/enums.ts); `AngemeldetesMitglied.jury: boolean`; `juryErforderlich(): Promise<AngemeldetesMitglied>` (wirft „Keine Berechtigung.“ ohne Jury-Flag).

- [ ] **Step 1: Failing test** `tests/jury-schema.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AUSGABE_STATUS, IG_STATUS, JURY_STATUS, istJuryStatus } from "@/db/enums";

test("Jury-Status-Listen", () => {
  assert.deepEqual(JURY_STATUS, ["ENTWURF", "EINGEREICHT", "VEROEFFENTLICHT", "ZURUECKGEZOGEN"]);
  assert.deepEqual(AUSGABE_STATUS, ["ENTWURF", "VEROEFFENTLICHT"]);
  assert.equal(IG_STATUS.length, 5);
  assert.equal(istJuryStatus("EINGEREICHT"), true);
  assert.equal(istJuryStatus("x"), false);
});

test("Migration legt Tabellen und Flag an", () => {
  const sql = readFileSync("migrations/0026_jury.sql", "utf8");
  for (const t of ["jury_ausgaben", "jury_beitraege", "jury_bilder"]) assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${t}`));
  assert.match(sql, /ALTER TABLE mitglieder ADD COLUMN jury INTEGER NOT NULL DEFAULT 0/);
  assert.match(sql, /UPDATE mitglieder SET jury = 1 WHERE rolle = 'ADMIN'/);
});
```

- [ ] **Step 2:** `npx tsx --test tests/jury-schema.test.ts` → FAIL (Export fehlt).
- [ ] **Step 3: Migration** `migrations/0026_jury.sql` (Tabellennamen im Plural wie die übrigen; vorher `grep -n "@@map" prisma/schema.prisma` prüfen, dass `mitglieder` und `reviews` stimmen):

```sql
-- 0026_jury (Spec 2026-10-16). Per wrangler d1 execute --file, genau einmal.
ALTER TABLE mitglieder ADD COLUMN jury INTEGER NOT NULL DEFAULT 0;
-- Der Betreiber wird Jury-Mitglied; seine Bewertungen bleiben Jury-Bewertungen (istRedaktionell).
UPDATE mitglieder SET jury = 1 WHERE rolle = 'ADMIN';
CREATE TABLE IF NOT EXISTS jury_ausgaben (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL,
  titel TEXT NOT NULL,
  einleitung TEXT NOT NULL DEFAULT '',
  erscheint_am DATETIME,
  status TEXT NOT NULL DEFAULT 'ENTWURF',
  erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS jury_ausgaben_slug_key ON jury_ausgaben(slug);
CREATE TABLE IF NOT EXISTS jury_beitraege (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL,
  titel TEXT NOT NULL,
  anriss TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  autor_id TEXT NOT NULL REFERENCES mitglieder(id) ON DELETE CASCADE,
  review_id TEXT REFERENCES reviews(id) ON DELETE SET NULL,
  ausgabe_id TEXT REFERENCES jury_ausgaben(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ENTWURF',
  notiz TEXT,
  ig_url TEXT,
  ig_status TEXT NOT NULL DEFAULT 'KEIN',
  veroeffentlicht_am DATETIME,
  erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  geaendert_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS jury_beitraege_slug_key ON jury_beitraege(slug);
CREATE INDEX IF NOT EXISTS jury_beitraege_status_idx ON jury_beitraege(status, veroeffentlicht_am);
CREATE INDEX IF NOT EXISTS jury_beitraege_autor_idx ON jury_beitraege(autor_id, status);
CREATE INDEX IF NOT EXISTS jury_beitraege_ausgabe_idx ON jury_beitraege(ausgabe_id, position);
CREATE TABLE IF NOT EXISTS jury_bilder (
  id TEXT PRIMARY KEY NOT NULL,
  beitrag_id TEXT NOT NULL REFERENCES jury_beitraege(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  daten BLOB NOT NULL,
  breite INTEGER NOT NULL,
  hoehe INTEGER NOT NULL,
  symbolbild INTEGER NOT NULL DEFAULT 0,
  alt TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS jury_bilder_beitrag_idx ON jury_bilder(beitrag_id, position);
```

- [ ] **Step 4: Prisma-Schema** (Models passend zur Migration; `Mitglied` bekommt `jury Boolean @default(false)` und `juryBeitraege JuryBeitrag[]`; `Review` bekommt `juryBeitraege JuryBeitrag[]`):

```prisma
model JuryAusgabe {
  id          String        @id @default(uuid())
  slug        String        @unique
  titel       String
  einleitung  String        @default("")
  erscheintAm DateTime?     @map("erscheint_am")
  status      String        @default("ENTWURF")
  erstelltAm  DateTime      @default(now()) @map("erstellt_am")
  beitraege   JuryBeitrag[]
  @@map("jury_ausgaben")
}

model JuryBeitrag {
  id                String       @id @default(uuid())
  slug              String       @unique
  titel             String
  anriss            String       @default("")
  text              String       @default("")
  autorId           String       @map("autor_id")
  autor             Mitglied     @relation(fields: [autorId], references: [id], onDelete: Cascade)
  reviewId          String?      @map("review_id")
  review            Review?      @relation(fields: [reviewId], references: [id], onDelete: SetNull)
  ausgabeId         String?      @map("ausgabe_id")
  ausgabe           JuryAusgabe? @relation(fields: [ausgabeId], references: [id], onDelete: SetNull)
  position          Int          @default(0)
  status            String       @default("ENTWURF")
  notiz             String?
  igUrl             String?      @map("ig_url")
  igStatus          String       @default("KEIN") @map("ig_status")
  veroeffentlichtAm DateTime?    @map("veroeffentlicht_am")
  erstelltAm        DateTime     @default(now()) @map("erstellt_am")
  geaendertAm       DateTime     @default(now()) @updatedAt @map("geaendert_am")
  bilder            JuryBild[]
  @@index([status, veroeffentlichtAm])
  @@index([autorId, status])
  @@index([ausgabeId, position])
  @@map("jury_beitraege")
}

model JuryBild {
  id         String      @id @default(uuid())
  beitragId  String      @map("beitrag_id")
  beitrag    JuryBeitrag @relation(fields: [beitragId], references: [id], onDelete: Cascade)
  position   Int         @default(0)
  daten      Bytes
  breite     Int
  hoehe      Int
  symbolbild Boolean     @default(false)
  alt        String      @default("")
  @@index([beitragId, position])
  @@map("jury_bilder")
}
```

- [ ] **Step 5: Enums** in `db/enums.ts` neben `MITGLIED_ROLLEN` (Muster `istWert` wie Zeile 113):

```ts
export const JURY_STATUS = ["ENTWURF", "EINGEREICHT", "VEROEFFENTLICHT", "ZURUECKGEZOGEN"] as const;
export type JuryStatus = (typeof JURY_STATUS)[number];
export const AUSGABE_STATUS = ["ENTWURF", "VEROEFFENTLICHT"] as const;
export type AusgabeStatus = (typeof AUSGABE_STATUS)[number];
export const IG_STATUS = ["KEIN", "ENTWURF", "GEPLANT", "VEROEFFENTLICHT", "FEHLER"] as const;
export type IgStatus = (typeof IG_STATUS)[number];
export const istJuryStatus = istWert(JURY_STATUS);
export const istAusgabeStatus = istWert(AUSGABE_STATUS);
export const istIgStatus = istWert(IG_STATUS);
```

- [ ] **Step 6: Sitzung** `lib/session.ts`: `jury: boolean` in `AngemeldetesMitglied`, im Select `jury: true`, im Ergebnis `jury: satz.jury`; neu:

```ts
/** Jury-Mitglied (Spec 2026-10-16), unabhängig von der Rolle; wirft ohne Flag. */
export async function juryErforderlich(): Promise<AngemeldetesMitglied> {
  const mitglied = await mitgliedErforderlich();
  if (!mitglied.jury) throw new Error("Keine Berechtigung.");
  return mitglied;
}
```

- [ ] **Step 7: Admin-Schalter** in `app/[lang]/admin/aktionen.ts`:

```ts
export async function juryUmschalten(formData: FormData): Promise<{ ok: boolean }> {
  await adminErforderlich();
  const id = String(formData.get("mitgliedId") ?? "");
  const an = formData.get("jury") === "1";
  const prisma = await getPrisma();
  await prisma.mitglied.update({ where: { id }, data: { jury: an } });
  revalidiereSprachen("/admin");
  revalidiereSprachen("/jury/team");
  return { ok: true };
}
```

In `app/[lang]/admin/page.tsx` in der Mitgliederliste je Zeile ein Formular mit verstecktem `mitgliedId`, `jury` (Gegenwert) und Knopf „Jury“/„Jury entfernen“ (Texte `w.admin.jury.an`/`aus` in de/en).

- [ ] **Step 8:** `npx prisma generate`, `npx tsc --noEmit -p .`, `npx tsx --test tests/jury-schema.test.ts` → PASS, `npm test` grün.
- [ ] **Step 9: Remote-D1** `npx wrangler d1 execute <DB-Name aus wrangler.jsonc> --remote --file migrations/0026_jury.sql` (vor dem Push, sonst bricht die Sitzung am fehlenden Feld).
- [ ] **Step 10: Commit + Push** `feat(jury): Tabellen, Jury-Flag und Schalter im Admin`.

---

### Task 2: Reine Logik: Eingabe, Markdown-Teilmenge, Sichtbarkeit, Slug

**Skills:** `superpowers:test-driven-development`, `better-writing`

**Files:**
- Create: `lib/jury.ts`, `lib/jury-text.ts`
- Test: `tests/jury.test.ts`, `tests/jury-text.test.ts`

**Interfaces:**
- Produces (lib/jury.ts):
  - `JURY_BILDER_MAX = 5`, `JURY_BILD_MAX_BYTES = 300 * 1024`, `JURY_BILD_MAX_KANTE = 1600`, `TITEL_MAX = 90`, `ANRISS_MAX = 200`, `TEXT_MAX = 12000`
  - `type BeitragEingabe = { titel: string; anriss: string; text: string; reviewId: string | null }`
  - `beitragPruefen(e: BeitragEingabe): string[]` (Fehlerschlüssel: `"titel.leer"`, `"titel.lang"`, `"anriss.lang"`, `"text.leer"`, `"text.lang"`, `"hwg"`)
  - `juryslug(titel: string, vorhanden: (s: string) => boolean): string` (klein, Umlaute ae/oe/ue/ss, a-z0-9-, max 60, bei Kollision `-2`, `-3` …)
  - `sichtbar(b: { status: string; ausgabe: { status: string } | null }): boolean`
- Produces (lib/jury-text.ts): `type Block = { art: "absatz" | "zwischentitel" | "liste"; teile: Inline[][] }`, `type Inline = { text: string; fett?: boolean; kursiv?: boolean }`, `juryTextBloecke(md: string): Block[]` (kein HTML, keine Links).

- [ ] **Step 1: Failing tests** `tests/jury.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { beitragPruefen, juryslug, sichtbar, TITEL_MAX } from "@/lib/jury";

const gut = { titel: "Gelato im Glas", anriss: "Süß und cremig.", text: "Riecht nach Beeren.", reviewId: null };

test("beitragPruefen: gültig, leer, zu lang, HWG", () => {
  assert.deepEqual(beitragPruefen(gut), []);
  assert.ok(beitragPruefen({ ...gut, titel: " " }).includes("titel.leer"));
  assert.ok(beitragPruefen({ ...gut, titel: "x".repeat(TITEL_MAX + 1) }).includes("titel.lang"));
  assert.ok(beitragPruefen({ ...gut, text: "" }).includes("text.leer"));
  assert.ok(beitragPruefen({ ...gut, text: "Hilft beim Einschlafen" }).includes("hwg"));
});

test("juryslug: Umlaute, Kollision", () => {
  assert.equal(juryslug("Süße Grüße!", () => false), "suesse-gruesse");
  const belegt = new Set(["gelato", "gelato-2"]);
  assert.equal(juryslug("Gelato", (s) => belegt.has(s)), "gelato-3");
});

test("sichtbar: Beitrag und Ausgabe müssen veröffentlicht sein", () => {
  assert.equal(sichtbar({ status: "VEROEFFENTLICHT", ausgabe: null }), true);
  assert.equal(sichtbar({ status: "VEROEFFENTLICHT", ausgabe: { status: "ENTWURF" } }), false);
  assert.equal(sichtbar({ status: "EINGEREICHT", ausgabe: null }), false);
});
```

`tests/jury-text.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { juryTextBloecke } from "@/lib/jury-text";

test("Absätze, Zwischentitel, Liste, Fett, Kursiv", () => {
  const b = juryTextBloecke("## Nase\n\nErst **Beere**, dann *Teig*.\n\n- Zitrus\n- Kiefer");
  assert.equal(b[0].art, "zwischentitel");
  assert.deepEqual(b[1].teile[0], [{ text: "Erst " }, { text: "Beere", fett: true }, { text: ", dann " }, { text: "Teig", kursiv: true }, { text: "." }]);
  assert.equal(b[2].art, "liste");
  assert.equal(b[2].teile.length, 2);
});

test("HTML und Links bleiben Text", () => {
  const b = juryTextBloecke("<script>x</script> [a](javascript:alert(1))");
  assert.equal(b[0].teile[0].map((t) => t.text).join(""), "<script>x</script> [a](javascript:alert(1))");
});
```

- [ ] **Step 2:** beide Tests → FAIL.
- [ ] **Step 3: Implementierung** `lib/jury.ts`

```ts
import { hwgTreffer } from "@/lib/hwg-filter";

export const JURY_BILDER_MAX = 5;
export const JURY_BILD_MAX_BYTES = 300 * 1024;
export const JURY_BILD_MAX_KANTE = 1600;
export const TITEL_MAX = 90;
export const ANRISS_MAX = 200;
export const TEXT_MAX = 12000;

export type BeitragEingabe = { titel: string; anriss: string; text: string; reviewId: string | null };

/** Prüft einen Jury-Beitrag (Spec 2026-10-16, HWG redaktionell). Leeres Ergebnis = gültig. */
export function beitragPruefen(e: BeitragEingabe): string[] {
  const f: string[] = [];
  const titel = e.titel.trim();
  if (!titel) f.push("titel.leer");
  if (titel.length > TITEL_MAX) f.push("titel.lang");
  if (e.anriss.trim().length > ANRISS_MAX) f.push("anriss.lang");
  if (!e.text.trim()) f.push("text.leer");
  if (e.text.length > TEXT_MAX) f.push("text.lang");
  if (hwgTreffer([titel, e.anriss, e.text].join(" "))) f.push("hwg");
  return f;
}

export function juryslug(titel: string, vorhanden: (s: string) => boolean): string {
  const basis =
    titel
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "beitrag";
  if (!vorhanden(basis)) return basis;
  for (let n = 2; ; n++) if (!vorhanden(`${basis}-${n}`)) return `${basis}-${n}`;
}

/** Öffentlich nur, wenn der Beitrag und seine Ausgabe (falls vorhanden) veröffentlicht sind. */
export function sichtbar(b: { status: string; ausgabe: { status: string } | null }): boolean {
  return b.status === "VEROEFFENTLICHT" && (!b.ausgabe || b.ausgabe.status === "VEROEFFENTLICHT");
}
```

`lib/jury-text.ts`

```ts
export type Inline = { text: string; fett?: boolean; kursiv?: boolean };
export type Block = { art: "absatz" | "zwischentitel" | "liste"; teile: Inline[][] };

/** **fett** und *kursiv*; alles andere bleibt wörtlich Text (kein HTML, keine Links). */
function inline(zeile: string): Inline[] {
  const teile: Inline[] = [];
  const muster = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let rest = 0;
  for (const m of zeile.matchAll(muster)) {
    if (m.index! > rest) teile.push({ text: zeile.slice(rest, m.index) });
    teile.push(m[1] !== undefined ? { text: m[1], fett: true } : { text: m[2], kursiv: true });
    rest = m.index! + m[0].length;
  }
  if (rest < zeile.length) teile.push({ text: zeile.slice(rest) });
  return teile;
}

/** Markdown-Teilmenge der Jury-Texte: `## ` Zwischentitel, `- ` Liste, Leerzeile trennt Absätze. */
export function juryTextBloecke(md: string): Block[] {
  return md
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((roh) => roh.trim())
    .filter(Boolean)
    .map((roh): Block => {
      const zeilen = roh.split("\n");
      if (zeilen.length === 1 && zeilen[0].startsWith("## ")) return { art: "zwischentitel", teile: [inline(zeilen[0].slice(3))] };
      if (zeilen.every((z) => z.startsWith("- "))) return { art: "liste", teile: zeilen.map((z) => inline(z.slice(2))) };
      return { art: "absatz", teile: [inline(zeilen.join(" "))] };
    });
}
```

- [ ] **Step 4:** Tests → PASS, `npm test` grün.
- [ ] **Step 5: Commit + Push** `feat(jury): Eingabepruefung, Text-Teilmenge, Sichtbarkeit`.

---

### Task 3: Abfragen und Bild-Auslieferung

**Skills:** `prisma-client-api`, `cloudflare-d1`, `edge-stack-master`, `superpowers:test-driven-development`

**Files:**
- Create: `lib/query/jury.ts`
- Modify: `app/api/bild/[id]/route.ts` (in `bildLaden` Jury-Bilder ergänzen, nur sichtbarer Beitrag)
- Test: `tests/jury-query.test.ts` (reine Abbildungsfunktionen)

**Interfaces:**
- Consumes: `sichtbar` aus Task 2.
- Produces:
  - `type JuryBildMeta = { id: string; breite: number; hoehe: number; symbolbild: boolean; alt: string }`
  - `type JuryKarte = { slug: string; titel: string; anriss: string; autor: { name: string; kurzId: string | null }; veroeffentlichtAm: Date; titelbild: JuryBildMeta | null; sorte: { name: string; slug: string | null } | null }`
  - `type JuryBeitragVoll = JuryKarte & { text: string; bilder: JuryBildMeta[]; igUrl: string | null; ausgabe: { slug: string; titel: string } | null; review: { id: string; strainSlug: string; kultivarSlug: string | null; vertreiberId: string | null; vertreiberName: string | null; gesamtnote: number | null } | null }`
  - `ladeJuryStart(seite: number): Promise<{ aufmacher: { slug: string; titel: string; einleitung: string; erscheintAm: Date | null; beitraege: JuryKarte[] } | null; beitraege: JuryKarte[]; seitenAnzahl: number }>`
  - `ladeJuryBeitrag(slug: string): Promise<JuryBeitragVoll | null>` (nur sichtbar)
  - `ladeJuryAusgabe(slug: string): Promise<{ titel: string; einleitung: string; erscheintAm: Date | null; beitraege: JuryKarte[] } | null>`
  - `ladeJuryFavourites(): Promise<JuryKarte[]>` (nur Review-Beiträge aus veröffentlichten Ausgaben, `orderBy veroeffentlichtAm desc`, `take: 60`)
  - `ladeJuryTeam(): Promise<{ id: string; name: string; kurzId: string | null; instagram: string | null; beitraege: number }[]>`
  - `zuKarte(z: KartenZeile): JuryKarte` (rein, getestet)

- [ ] **Step 1: Failing test** `tests/jury-query.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { zuKarte } from "@/lib/query/jury";

test("zuKarte: Titelbild = erstes Bild nach Position, Sorte aus der Bewertung", () => {
  const k = zuKarte({
    slug: "gelato", titel: "Gelato", anriss: "a", veroeffentlichtAm: new Date("2026-10-20"),
    autor: { anzeigename: "Wal", kurzId: "abc", profilOeffentlich: true },
    bilder: [{ id: "b2", position: 1, breite: 1, hoehe: 1, symbolbild: false, alt: "" }, { id: "b1", position: 0, breite: 1, hoehe: 1, symbolbild: true, alt: "" }],
    review: { kultivar: { name: "Gelato", slug: "gelato" } },
  });
  assert.equal(k.titelbild?.id, "b1");
  assert.deepEqual(k.sorte, { name: "Gelato", slug: "gelato" });
  assert.deepEqual(k.autor, { name: "Wal", kurzId: "abc" });
});

test("zuKarte: privates Profil ohne kurzId", () => {
  const k = zuKarte({ slug: "x", titel: "x", anriss: "", veroeffentlichtAm: new Date(), autor: { anzeigename: "A", kurzId: "k", profilOeffentlich: false }, bilder: [], review: null });
  assert.equal(k.autor.kurzId, null);
  assert.equal(k.titelbild, null);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementierung** `lib/query/jury.ts` — Kopf und Kern (die übrigen Funktionen folgen demselben Select):

```ts
import "server-only";

import { sichtbar } from "@/lib/jury";
import { getPrisma } from "@/lib/prisma";

export type JuryBildMeta = { id: string; breite: number; hoehe: number; symbolbild: boolean; alt: string };
// … Typen wie in Interfaces oben …

const BILD_META = { id: true, position: true, breite: true, hoehe: true, symbolbild: true, alt: true } as const;
const KARTE_SELECT = {
  slug: true, titel: true, anriss: true, veroeffentlichtAm: true,
  autor: { select: { anzeigename: true, kurzId: true, profilOeffentlich: true } },
  bilder: { select: BILD_META, orderBy: { position: "asc" }, take: 5 },
  review: { select: { kultivar: { select: { name: true, slug: true } } } },
} as const;
/** Öffentlich: Beitrag veröffentlicht, Ausgabe fehlt oder ist veröffentlicht (gleich `sichtbar`). */
const OEFFENTLICH = {
  status: "VEROEFFENTLICHT",
  OR: [{ ausgabeId: null }, { ausgabe: { status: "VEROEFFENTLICHT" } }],
} as const;

export type KartenZeile = {
  slug: string; titel: string; anriss: string; veroeffentlichtAm: Date | null;
  autor: { anzeigename: string; kurzId: string | null; profilOeffentlich: boolean };
  bilder: (JuryBildMeta & { position: number })[];
  review: { kultivar: { name: string; slug: string | null } | null } | null;
};

export function zuKarte(z: KartenZeile): JuryKarte {
  const erstes = [...z.bilder].sort((a, b) => a.position - b.position)[0];
  return {
    slug: z.slug, titel: z.titel, anriss: z.anriss, veroeffentlichtAm: z.veroeffentlichtAm ?? new Date(0),
    autor: { name: z.autor.anzeigename, kurzId: z.autor.profilOeffentlich ? z.autor.kurzId : null },
    titelbild: erstes ? { id: erstes.id, breite: erstes.breite, hoehe: erstes.hoehe, symbolbild: erstes.symbolbild, alt: erstes.alt } : null,
    sorte: z.review?.kultivar ? { name: z.review.kultivar.name, slug: z.review.kultivar.slug } : null,
  };
}

export async function ladeJuryFavourites(): Promise<JuryKarte[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.juryBeitrag.findMany({
    where: { status: "VEROEFFENTLICHT", reviewId: { not: null }, ausgabe: { status: "VEROEFFENTLICHT" } },
    orderBy: { veroeffentlichtAm: "desc" },
    take: 60,
    select: KARTE_SELECT,
  });
  return zeilen.map(zuKarte);
}
```

`ladeJuryStart(seite)`: neueste Ausgabe (`status VEROEFFENTLICHT`, `orderBy erscheintAm desc`, `take 1`) mit Beiträgen (`where OEFFENTLICH`, `orderBy position`); Beitragsliste `where OEFFENTLICH`, `orderBy veroeffentlichtAm desc`, `skip (seite-1)*12`, `take 12`, `seitenAnzahl` aus `count`. `ladeJuryBeitrag(slug)`: `findUnique({ where: { slug } })` mit `KARTE_SELECT` + `text`, `igUrl`, `status`, `ausgabe { slug titel status }`, `review { id strainId vertreiberId vertreiber{name} kultivar{slug} strain{slug} gesamtnote }` (Feldnamen der Gesamtnote vor dem Schreiben in `prisma/schema.prisma` prüfen); `null`, wenn `!sichtbar(...)`. `ladeJuryTeam`: `mitglied.findMany({ where: { jury: true, profilOeffentlich: true, freigegeben: true }, take: 50, select: { id, anzeigename, kurzId, instagramHandle, _count: { select: { juryBeitraege: { where: OEFFENTLICH } } } } })`.

In `app/api/bild/[id]/route.ts` vor `return null`:

```ts
  const jury = await prisma.juryBild.findFirst({
    where: { id, beitrag: { status: "VEROEFFENTLICHT", OR: [{ ausgabeId: null }, { ausgabe: { status: "VEROEFFENTLICHT" } }] } },
    select: { daten: true },
  });
  if (jury) return { bytes: jury.daten, typ: "image/webp", cache: CACHE_STUNDE };
```

- [ ] **Step 4:** Tests → PASS, `npx tsc --noEmit -p .`, `npm test`.
- [ ] **Step 5: Commit + Push** `feat(jury): Abfragen und Bildauslieferung`.

---

### Task 4: Server-Aktionen (Jury schreibt, Admin veröffentlicht, Bilder)

**Skills:** `prisma-client-api`, `cloudflare-d1`, `edge-stack-master`, `better-auth`, `superpowers:test-driven-development`

**Files:**
- Create: `app/[lang]/jury/aktionen.ts` (Jury), `app/[lang]/admin/jury/aktionen.ts` (Admin), `lib/jury-rechte.ts`
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (Meldungen `jury.*`)
- Test: `tests/jury-rechte.test.ts`

**Interfaces:**
- Consumes: `beitragPruefen`, `juryslug`, `JURY_BILDER_MAX`, `JURY_BILD_MAX_BYTES`, `JURY_BILD_MAX_KANTE` (Task 2); `juryErforderlich`, `adminErforderlich` (Task 1); `bildPruefen` (`lib/bild-pruefen.ts`).
- Produces:
  - `lib/jury-rechte.ts`: `darfBearbeiten(b: { autorId: string; status: string }, m: { mitgliedId: string; jury: boolean; rolle: string }): boolean` (Admin immer; Autor nur mit Jury-Flag und Status ENTWURF), `darfVerknuepfen(r: { autorId: string | null; freigegeben: boolean } | null, mitgliedId: string): boolean`
  - Jury: `beitragSpeichern(fd: FormData): Promise<Ergebnis & { slug?: string }>`, `beitragEinreichen(fd)`
  - Admin: `adminBeitragSpeichern(fd)`, `beitragVeroeffentlichen(fd)`, `beitragZurueckgeben(fd)` (Notiz, Status ENTWURF, Benachrichtigung an Autor), `beitragZurueckziehen(fd)`, `juryBildHochladen(fd)`, `juryBildLoeschen(fd)`, `juryBildVerschieben(fd)` (position ±1), `juryBildSymbol(fd)`, `ausgabeSpeichern(fd)`, `ausgabeVeroeffentlichen(fd)`, `igStatusSetzen(fd)` (igUrl, igStatus)
  - `type Ergebnis = { ok: true } | { ok: false; fehler: string }`

- [ ] **Step 1: Failing test** `tests/jury-rechte.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { darfBearbeiten, darfVerknuepfen } from "@/lib/jury-rechte";

const autor = { mitgliedId: "a", jury: true, rolle: "MITGLIED" };
test("darfBearbeiten", () => {
  assert.equal(darfBearbeiten({ autorId: "a", status: "ENTWURF" }, autor), true);
  assert.equal(darfBearbeiten({ autorId: "a", status: "EINGEREICHT" }, autor), false);
  assert.equal(darfBearbeiten({ autorId: "a", status: "ENTWURF" }, { ...autor, jury: false }), false);
  assert.equal(darfBearbeiten({ autorId: "b", status: "ENTWURF" }, autor), false);
  assert.equal(darfBearbeiten({ autorId: "b", status: "VEROEFFENTLICHT" }, { mitgliedId: "x", jury: false, rolle: "ADMIN" }), true);
});
test("darfVerknuepfen: nur eigene, freigegebene Bewertung", () => {
  assert.equal(darfVerknuepfen({ autorId: "a", freigegeben: true }, "a"), true);
  assert.equal(darfVerknuepfen({ autorId: "b", freigegeben: true }, "a"), false);
  assert.equal(darfVerknuepfen({ autorId: "a", freigegeben: false }, "a"), false);
  assert.equal(darfVerknuepfen(null, "a"), false);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** `lib/jury-rechte.ts`

```ts
export function darfBearbeiten(b: { autorId: string; status: string }, m: { mitgliedId: string; jury: boolean; rolle: string }): boolean {
  if (m.rolle === "ADMIN") return true;
  return m.jury && b.autorId === m.mitgliedId && b.status === "ENTWURF";
}

export function darfVerknuepfen(r: { autorId: string | null; freigegeben: boolean } | null, mitgliedId: string): boolean {
  return !!r && r.freigegeben && r.autorId === mitgliedId;
}
```

- [ ] **Step 4: Jury-Aktion** `app/[lang]/jury/aktionen.ts` (Muster `budpic-aktionen.ts`, Meldungen über `meldungText`):

```ts
"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { beitragPruefen, juryslug } from "@/lib/jury";
import { darfBearbeiten, darfVerknuepfen } from "@/lib/jury-rechte";
import { getPrisma } from "@/lib/prisma";
import { juryErforderlich } from "@/lib/session";

export type Ergebnis = { ok: true; slug?: string } | { ok: false; fehler: string };

function eingabe(fd: FormData) {
  return {
    titel: String(fd.get("titel") ?? ""),
    anriss: String(fd.get("anriss") ?? ""),
    text: String(fd.get("text") ?? ""),
    reviewId: String(fd.get("reviewId") ?? "") || null,
  };
}

/** Neuer oder geänderter Entwurf; nur Jury, nur eigene Entwürfe (Spec 2026-10-16). */
export async function beitragSpeichern(fd: FormData): Promise<Ergebnis> {
  let m;
  try { m = await juryErforderlich(); } catch { return { ok: false, fehler: "jury.keineBerechtigung" }; }
  const e = eingabe(fd);
  const fehler = beitragPruefen(e);
  if (fehler.length) return { ok: false, fehler: `jury.${fehler[0]}` };
  const prisma = await getPrisma();
  if (e.reviewId) {
    const r = await prisma.review.findUnique({ where: { id: e.reviewId }, select: { autorId: true, freigegeben: true } });
    if (!darfVerknuepfen(r, m.mitgliedId)) return { ok: false, fehler: "jury.bewertungFremd" };
  }
  const id = String(fd.get("id") ?? "");
  if (id) {
    const b = await prisma.juryBeitrag.findUnique({ where: { id }, select: { autorId: true, status: true, slug: true } });
    if (!b || !darfBearbeiten(b, m)) return { ok: false, fehler: "jury.keineBerechtigung" };
    await prisma.juryBeitrag.update({ where: { id }, data: { titel: e.titel.trim(), anriss: e.anriss.trim(), text: e.text, reviewId: e.reviewId } });
    revalidiereSprachen("/profil");
    return { ok: true, slug: b.slug };
  }
  const belegt = new Set((await prisma.juryBeitrag.findMany({ where: { slug: { startsWith: juryslug(e.titel, () => false) } }, select: { slug: true }, take: 50 })).map((x) => x.slug));
  const slug = juryslug(e.titel, (s) => belegt.has(s));
  await prisma.juryBeitrag.create({ data: { slug, titel: e.titel.trim(), anriss: e.anriss.trim(), text: e.text, reviewId: e.reviewId, autorId: m.mitgliedId } });
  revalidiereSprachen("/profil");
  return { ok: true, slug };
}

/** Entwurf einreichen; Admins bekommen eine Benachrichtigung. */
export async function beitragEinreichen(fd: FormData): Promise<Ergebnis> {
  let m;
  try { m = await juryErforderlich(); } catch { return { ok: false, fehler: "jury.keineBerechtigung" }; }
  const prisma = await getPrisma();
  const id = String(fd.get("id") ?? "");
  const b = await prisma.juryBeitrag.findUnique({ where: { id }, select: { autorId: true, status: true, titel: true } });
  if (!b || !darfBearbeiten(b, m)) return { ok: false, fehler: "jury.keineBerechtigung" };
  await prisma.juryBeitrag.update({ where: { id }, data: { status: "EINGEREICHT" } });
  // Benachrichtigung an alle Admins: Muster aus lib/benachrichtigung.ts (`benachrichtigen`), Link /admin/jury.
  revalidiereSprachen("/admin/jury");
  return { ok: true };
}
```

Vor dem Schreiben `grep -n "export async function benachrichtigen" -A15 lib/benachrichtigung.ts` lesen und genau diese Signatur verwenden (Text `jury eingereicht: <titel>`).

- [ ] **Step 5: Admin-Aktionen** `app/[lang]/admin/jury/aktionen.ts`: jede Funktion beginnt mit `await adminErforderlich();`. Kernstücke:

```ts
export async function juryBildHochladen(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const beitragId = String(fd.get("beitragId") ?? "");
  const datei = fd.get("bild");
  if (!(datei instanceof File) || datei.size === 0) return { ok: false, fehler: "bild.fehlt" };
  if (datei.size > JURY_BILD_MAX_BYTES) return { ok: false, fehler: "bild.zuGross" };
  const bytes = new Uint8Array(await datei.arrayBuffer());
  const g = bildPruefen(bytes, { maxBytes: JURY_BILD_MAX_BYTES, maxBreite: JURY_BILD_MAX_KANTE, maxHoehe: JURY_BILD_MAX_KANTE });
  if (!g.ok) return { ok: false, fehler: "bild.ungueltig" };
  const prisma = await getPrisma();
  const anzahl = await prisma.juryBild.count({ where: { beitragId } });
  if (anzahl >= JURY_BILDER_MAX) return { ok: false, fehler: "jury.zuVieleBilder" };
  await prisma.juryBild.create({ data: { beitragId, position: anzahl, daten: bytes, breite: g.breite, hoehe: g.hoehe, symbolbild: fd.get("symbolbild") === "1", alt: String(fd.get("alt") ?? "").slice(0, 200) } });
  neuLaden(beitragId);
  return { ok: true };
}

export async function beitragVeroeffentlichen(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const id = String(fd.get("id") ?? "");
  const prisma = await getPrisma();
  const b = await prisma.juryBeitrag.findUnique({ where: { id }, select: { titel: true, anriss: true, text: true, reviewId: true } });
  if (!b) return { ok: false, fehler: "jury.unbekannt" };
  if (beitragPruefen(b).length) return { ok: false, fehler: "jury.hwg" };
  await prisma.juryBeitrag.update({ where: { id }, data: { status: "VEROEFFENTLICHT", veroeffentlichtAm: new Date(), ausgabeId: String(fd.get("ausgabeId") ?? "") || null, position: Number(fd.get("position") ?? 0) } });
  neuLaden(id);
  return { ok: true };
}
```

`neuLaden(beitragId)`: `revalidiereSprachen` für `/admin/jury`, `/jury`, `/jury/favourites`, `/jury/team`, `/jury/<slug>`, `/jury/ausgabe/<ausgabe-slug>`, `/` (Startseite), `/blueten/<kultivar-slug>`; Slugs per kleiner Abfrage. `juryBildVerschieben`: tauscht `position` mit dem Nachbarn in einer `$transaction`. `ausgabeSpeichern`: Slug per `juryslug`, Felder titel, einleitung, erscheintAm. `ausgabeVeroeffentlichen`: Status, `erscheintAm ?? now`. `igStatusSetzen`: prüft `igUrl` mit `/^https:\/\/www\.instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?$/` und `istIgStatus`.

Admin-Aktionen sind auch vom Skript nutzbar? Nein: das Skript (Task 9) schreibt über einen geschützten Endpunkt, nicht über Server-Aktionen.

- [ ] **Step 6: Test für das sechste Bild** in `tests/jury-rechte.test.ts` als Quelltext-Prüfung (Aktion braucht D1):

```ts
import { readFileSync } from "node:fs";
test("Upload lehnt über JURY_BILDER_MAX ab, bevor er schreibt", () => {
  const q = readFileSync("app/[lang]/admin/jury/aktionen.ts", "utf8");
  assert.ok(q.indexOf("anzahl >= JURY_BILDER_MAX") < q.indexOf("juryBild.create"));
  assert.match(q, /export async function juryBildHochladen[\s\S]*?await adminErforderlich\(\)/);
});
```

- [ ] **Step 7:** Meldungen `jury.titel.leer`, `jury.titel.lang`, `jury.anriss.lang`, `jury.text.leer`, `jury.text.lang`, `jury.hwg`, `jury.bewertungFremd`, `jury.keineBerechtigung`, `jury.zuVieleBilder`, `jury.unbekannt` in de/en (`lib/i18n/de.ts` Bereich `meldung`; Struktur vorher per `grep -n "budpic:" lib/i18n/de.ts` ansehen).
- [ ] **Step 8:** `npx tsc --noEmit -p .`, `npm test`, `npx eslint app/[lang]/jury app/[lang]/admin/jury lib/jury-rechte.ts`.
- [ ] **Step 9: Commit + Push** `feat(jury): Server-Aktionen fuer Entwurf, Freigabe und Bilder`.

---

### Task 5: Jury-Editor im Profil

**Skills:** `ui-design-engine`, `frontend-design`, `better-ui`, `better-writing`, `better-accessibility`, `react-best-practices`

**Files:**
- Create: `components/jury/BeitragEditor.tsx` (Client), `components/jury/EigeneBeitraege.tsx` (Server)
- Modify: `app/[lang]/profil/page.tsx`, `app/[lang]/profil/laden.ts` (eigene Beiträge und eigene freigegebene Bewertungen laden, nur wenn `jury`)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (`profil.jury.*`)
- Test: `tests/jury-editor.test.ts`

**Interfaces:**
- Consumes: `beitragSpeichern`, `beitragEinreichen` (Task 4), `juryTextBloecke` (Task 2), `TITEL_MAX`, `ANRISS_MAX`.
- Produces: `<BeitragEditor beitrag={…|null} bewertungen={{id,label}[]} texte={w.profil.jury} />`.

- [ ] **Step 1: Failing test** (Rendertest wie `tests/bewertung-maske.test.ts`):

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BeitragEditor } from "@/components/jury/BeitragEditor";
import { de } from "@/lib/i18n/de";

test("Editor: Felder mit Labels, Zeichenzähler, Bewertung wählbar, Vorschau", () => {
  const html = renderToStaticMarkup(createElement(BeitragEditor, { beitrag: null, bewertungen: [{ id: "r1", label: "Gelato über Alpha" }], texte: de.profil.jury }));
  for (const name of ["titel", "anriss", "text", "reviewId"]) assert.match(html, new RegExp(`name="${name}"`));
  assert.match(html, /<label[^>]*for=/);
  assert.match(html, /Gelato über Alpha/);
  assert.match(html, /maxLength="90"|maxlength="90"/);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Editor bauen: Formular mit Titel (Input, `maxLength={TITEL_MAX}`, Zähler), Anriss (Textarea 3 Zeilen, Zähler), Text (Textarea 14 Zeilen, Hilfe „## Zwischentitel, - Liste, **fett**, *kursiv*“), Auswahl „Eigene Bewertung verknüpfen“ (`select name="reviewId"`, Option „ohne Bewertung (Artikel)“), Reiter „Schreiben/Vorschau“ (Vorschau rendert `juryTextBloecke`), Knöpfe „Speichern“ (secondary) und „Einreichen“ (primary, nur bei gespeichertem Entwurf), Statuszeile mit `aria-live="polite"`, Fehler aus der Aktion per `meldungText`. Nur Tokens, Abstände im 8er-Raster, Felder 48 px hoch, Fokusring sichtbar.
- [ ] **Step 4:** `EigeneBeitraege`: Liste eigener Beiträge mit Status-Badge (Entwurf, Eingereicht, Veröffentlicht mit Link `/jury/<slug>`, zurückgegeben mit Notiz), Knopf „Neuer Beitrag“. Im Profil nur zeigen, wenn `mitglied.jury`, als eigener Bereich „Jury“ im Raster (`SPALTEN` aus `app/[lang]/profil/spalten.ts`).
- [ ] **Step 5:** Tests PASS, tsc, eslint.
- [ ] **Step 6: Commit + Push** `feat(jury): Editor im Profil`.

---

### Task 6: Admin-Bereich `/admin/jury`

**Skills:** `ui-design-engine`, `frontend-design`, `better-layout`, `better-ui`, `better-accessibility`, `hicks-law`, `react-best-practices`

**Files:**
- Create: `app/[lang]/admin/jury/page.tsx`, `components/admin/jury/BeitragAdmin.tsx`, `components/admin/jury/BildVerwaltung.tsx` (Client: Upload mit `bildVerkleinernFrei(datei, { maxKante: 1600, maxBytes: 300 * 1024 })` aus `lib/bild-verkleinern.ts`, eine Datei je Aufruf), `components/admin/jury/AusgabenVerwaltung.tsx`
- Modify: `app/[lang]/admin/page.tsx` (Link-Kachel „Jury“ mit Zahl eingereichter Beiträge), `lib/i18n/de.ts`, `lib/i18n/en.ts` (`admin.jury.*`)
- Test: `tests/jury-admin.test.ts`

**Interfaces:**
- Consumes: alle Admin-Aktionen aus Task 4.

- [ ] **Step 1: Failing test**: `BildVerwaltung` mit 5 Bildern rendert keinen Upload-Knopf, mit 4 Bildern einen; jedes Bild hat Knöpfe „nach vorn“, „nach hinten“, „Symbolbild“, „Löschen“ mit `aria-label`.

```ts
test("BildVerwaltung: Upload nur unter JURY_BILDER_MAX", () => {
  const bild = (i: number) => ({ id: `b${i}`, breite: 10, hoehe: 10, symbolbild: false, alt: "" });
  const voll = renderToStaticMarkup(createElement(BildVerwaltung, { beitragId: "x", bilder: [0, 1, 2, 3, 4].map(bild), texte: de.admin.jury }));
  assert.doesNotMatch(voll, /type="file"/);
  const frei = renderToStaticMarkup(createElement(BildVerwaltung, { beitragId: "x", bilder: [0, 1, 2, 3].map(bild), texte: de.admin.jury }));
  assert.match(frei, /type="file"/);
  assert.match(frei, /aria-label="[^"]*Symbolbild/);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Seite: drei Reiter „Eingereicht“ (Standard), „Veröffentlicht“, „Ausgaben“. Eingereicht: je Beitrag Karte mit Autor, Titel, Anriss, Text-Vorschau, Bewertung, `BildVerwaltung`, Ausgabe-Auswahl und Position, Knöpfe „Veröffentlichen“, „Zurückgeben“ (mit Notizfeld). Veröffentlicht: Liste mit IG-Status-Badge, Feld „IG-Link“ (`igStatusSetzen`), „Zurückziehen“. Ausgaben: Formular neue Ausgabe, Liste mit Status und „Veröffentlichen“. `adminErforderlich()` zuerst in der Seite (wie `app/[lang]/admin/page.tsx`).
- [ ] **Step 4:** Tests PASS, tsc, eslint.
- [ ] **Step 5: Commit + Push** `feat(jury): Admin-Bereich mit Bildern und Ausgaben`.

---

### Task 7: Öffentliche Seiten `/jury`

**Skills:** `ui-design-engine`, `frontend-design`, `design-taste-frontend`, `build-awwwards-quality-sites`, `emil-design-eng`, `animate`, `better-typography`, `better-layout`, `apple-design`, `react-best-practices`, `edge-stack-master`

**Files:**
- Create: `app/[lang]/jury/page.tsx`, `app/[lang]/jury/[slug]/page.tsx`, `app/[lang]/jury/ausgabe/[slug]/page.tsx`, `app/[lang]/jury/favourites/page.tsx`, `app/[lang]/jury/team/page.tsx`
- Create: `components/jury/JuryText.tsx` (rendert `Block[]`), `components/jury/BildBuehne.tsx` (Client: Galerie bis 5, Hauptbild ganz im Rahmen `object-contain`, Daumenleiste, Pfeiltasten, Symbolbild-Hinweis, Wechsel 300 ms opacity+scale mit `--ease-auftritt`), `components/jury/BeitragKarte.tsx`, `components/jury/AutorKasten.tsx`, `components/jury/BewertungsBlock.tsx` (Terpz-Score, `BlattAnzeige`, Gesamteindruck, Aroma-Karte aus der verknüpften Bewertung, Link „Zur Bewertung“ über `bewertungHref`)
- Modify: `components/medien/Bild.tsx` (neue Komponente `JuryBild` für `/api/bild/<id>`, wie `BudpicBild`), `lib/navigation.ts` (Punkt `{ href: "/jury", schluessel: "jury" }` vor „Blüten“), `lib/i18n/de.ts`, `lib/i18n/en.ts` (`jury.*`, `navigation.jury`)
- Modify: `app/globals.css` (Klassen `.jury-buehne-bild` für den Bildwechsel, unter `prefers-reduced-motion: no-preference` und `:root:not([data-sparmodus])`)
- Test: `tests/jury-seiten.test.ts`

**Interfaces:**
- Consumes: Abfragen aus Task 3, `juryTextBloecke` (Task 2), `bewertungHref` (`lib/alte-adressen.ts`), `BlattAnzeige`.

- [ ] **Step 1: Failing tests**

```ts
test("JuryText: Zwischentitel als h2, Liste als ul, fett als strong, kein HTML", () => {
  const html = renderToStaticMarkup(createElement(JuryText, { bloecke: juryTextBloecke("## Nase\n\n**Beere** <b>x</b>\n\n- a\n- b") }));
  assert.match(html, /<h2[^>]*>Nase<\/h2>/);
  assert.match(html, /<strong>Beere<\/strong>/);
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.match(html, /<ul[^>]*>.*<li[^>]*>a<\/li>/);
});

test("BildBuehne: Symbolbild gekennzeichnet, Bilder im Rahmen", () => {
  const html = renderToStaticMarkup(createElement(BildBuehne, { bilder: [{ id: "b1", breite: 800, hoehe: 1200, symbolbild: true, alt: "" }], name: "Gelato", texte: de.jury }));
  assert.match(html, /object-contain/);
  assert.match(html, /Symbolbild/);
});

test("Favourites sortieren nach Datum, nie nach Note", () => {
  const q = readFileSync("lib/query/jury.ts", "utf8");
  assert.match(q, /ladeJuryFavourites[\s\S]*?orderBy: \{ veroeffentlichtAm: "desc" \}/);
  assert.doesNotMatch(q, /orderBy:[^\n]*gesamtnote/);
});

test("Navigation enthält /jury", () => {
  assert.match(readFileSync("lib/navigation.ts", "utf8"), /href: "\/jury"/);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Gestaltung** (Magazin, Agentur-Optik, im Buch-Stil der Marke):
  - `/jury`: Kopf „Terpz-Jury“ in Handschrift-Akzent, Untertitel. Aufmacher: großes Titelbild der Ausgabe (erstes Bild des ersten Beitrags), Ausgabentitel in `text-display`, Einleitung, darunter Beitragskarten 3-spaltig ab `lg`. Danach „Alle Beiträge“ chronologisch, Seitenwechsel (`?seite=`). Links auf Favourites und Team.
  - `/jury/<slug>`: zweispaltig ab `lg`: links `BildBuehne` (sticky), rechts Kicker (Ausgabe), Titel, Anriss groß, `BewertungsBlock`, `JuryText` (max 68ch), `AutorKasten` (Avatar, Name, Link `/profil/<kurzId>`, IG-Handle), Links „Zur Bewertung“ und „Auf Instagram ansehen“ (`igUrl`). Mobil einspaltig. Metadaten (`generateMetadata`: Titel, Anriss, `og:image` = `/api/bild/<titelbild>`).
  - `/jury/favourites`: Bildraster (2/3/4 Spalten), Karte = Bild, Sortenname, Autor, Datum; Hover nur mit `(hover: hover)`.
  - `/jury/team`: Karten der Jury mit Avatar, Name, Beitragszahl, Link zum Profil.
  - Statisch: `export const revalidate = 86400;` und `dynamic = "force-static"` wie `app/[lang]/page.tsx`; `notFound()` bei `null`.
  - HWG-Hinweis im Fuß jeder Jury-Seite: „Erfahrungsberichte zu Aussehen, Geruch und Geschmack. Keine Aussagen zur Wirkung.“
- [ ] **Step 4:** Tests PASS, tsc, eslint; `better-interface`-Durchgang über die neuen Komponenten (Befunde beheben).
- [ ] **Step 5: Commit + Push** `feat(jury): Magazin, Beitrag, Favourites und Team`.

---

### Task 8: Einbindung Startseite, Sortenseite, Profil, Texte „Jury“

**Skills:** `ui-design-engine`, `frontend-design`, `better-writing`, `critique-visual-hierarchy`, `react-best-practices`

**Files:**
- Modify: `components/story/NeuesterEintrag.tsx` (zeigt den neuesten sichtbaren Jury-Beitrag mit Titelbild, Titel, Anriss, Autor, Link; ohne Beitrag bisheriges Verhalten)
- Modify: Stellen mit Betreiber-Wording: `grep -rn "Betreiber" lib/i18n/de.ts lib/i18n/en.ts` und je Treffer, der Nutzern die Herkunft einer Bewertung erklärt, „Jury“ setzen (z. B. `deinFazitBetreiber` bleibt „Terpz-Score“; Abzeichen „Betreiber“ → „Jury“). Admin-interne Texte bleiben.
- Modify: Sortenseite `app/[lang]/blueten/[slug]/page.tsx`: bei Bewertungen mit `istRedaktionell` Abzeichen „Jury“; gibt es einen sichtbaren Beitrag zur Bewertung, Link „Jury-Beitrag lesen“ (`/jury/<slug>`; Abfrage `juryBeitrag.findFirst({ where: { reviewId, …OEFFENTLICH }, select: { slug } })`).
- Modify: öffentliches Profil `app/[lang]/profil/[kurzId]/page.tsx`: bei `jury` Abzeichen „Terpz-Jury“ und Liste der sichtbaren Beiträge (höchstens 6).
- Modify: `lib/bewertung` o. ä., wo `istRedaktionell` beim Speichern gesetzt wird: `grep -rn "istRedaktionell:" app lib` und dort `mitglied.rolle === "ADMIN"` (o. ä.) durch `mitglied.jury` ersetzen.
- Test: `tests/jury-einbindung.test.ts`

- [ ] **Step 1: Failing tests**

```ts
test("istRedaktionell folgt dem Jury-Flag", () => {
  const treffer = execSync('git grep -n "istRedaktionell:" -- app lib', { encoding: "utf8" });
  assert.match(treffer, /jury/);
  assert.doesNotMatch(treffer, /rolle === "ADMIN"/);
});
test("Startseite verweist auf den Jury-Beitrag", () => {
  assert.match(readFileSync("components/story/NeuesterEintrag.tsx", "utf8"), /\/jury\//);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** umsetzen (Regel „Startseite mitziehen“). **Step 4:** `npm test`, tsc, eslint. **Step 5: Commit + Push** `feat(jury): Startseite, Sortenseite und Profil zeigen die Jury`.

---

### Task 9: Instagram-Collab je Beitrag

**Skills:** `cloudflare:workers-best-practices`, `edge-stack-master`, `superpowers:test-driven-development`, `remotion-official` (nur falls Reel), `critique-composition`, `critique-brand-consistency`; IG-Handwerk: `docs/instagram/handwerk.md` vollständig lesen

**Files:**
- Create: `app/api/jury-feed/route.ts` (GET, Schlüssel `?key=` gegen Secret `IG_FEED_KEY`; liefert veröffentlichte Beiträge mit `igStatus` KEIN oder FEHLER: slug, titel, anriss, Zitat (erster Absatz, ≤ 180 Zeichen), autor { name, instagram }, bilder-URLs, review { gesamtnote, aromen }), `app/api/jury-ig/route.ts` (POST, gleicher Schlüssel; setzt `igUrl`, `igStatus` per slug, prüft wie `igStatusSetzen`)
- Create: `lib/ig-jury.ts` (rein: `juryKarussell(b: JuryFeedBeitrag): { karussell: IgKarussell; caption: string }`), `scripts/ig-jury.ts`, `lib/ig-graph.ts` (rein: `graphKarussellSchritte(bildUrls: string[], caption: string, collaborators: string[]): GraphSchritt[]`)
- Modify: `docs/instagram/agent-anweisung.md` (Routine: täglich zuerst offene Jury-Beiträge, höchstens 1 Post pro Tag), `.env.example` falls vorhanden (`IG_GRAPH_TOKEN`, `IG_BUSINESS_ID`)
- Test: `tests/ig-jury.test.ts`

**Interfaces:**
- Consumes: `karussellPruefen`, `igSlideHtml`, `IgKarussell` (`lib/ig-karussell.ts`), `igCaptionPruefen`, `IG_CTA`, `entwurfMedien`, `planen`, `screenshot`, `htmlOffline` (`scripts/ig-gemeinsam.ts`).
- Produces: `type JuryFeedBeitrag = { slug: string; titel: string; anriss: string; zitat: string; autor: { name: string; instagram: string | null }; bilder: string[]; review: { gesamtnote: number | null; aromen: string[] } | null }`; `type GraphSchritt = { pfad: string; parameter: Record<string, string> }`.

- [ ] **Step 1: Failing tests**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { juryKarussell } from "@/lib/ig-jury";
import { graphKarussellSchritte } from "@/lib/ig-graph";
import { karussellPruefen } from "@/lib/ig-karussell";
import { igCaptionPruefen } from "@/lib/ig-caption";

const b = { slug: "gelato", titel: "Gelato im Glas", anriss: "Süß und cremig.", zitat: "Erst Beere, dann Teig.", autor: { name: "Wal", instagram: "wal.terpz" }, bilder: ["https://x/api/bild/1"], review: { gesamtnote: 4, aromen: ["SUESS", "FRUCHTIG"] } };

test("juryKarussell besteht alle Prüfungen und nennt den Autor", () => {
  const { karussell, caption } = juryKarussell(b);
  assert.deepEqual(karussellPruefen(karussell), []);
  assert.deepEqual(igCaptionPruefen(caption), []);
  assert.match(caption, /@wal\.terpz/);
  assert.ok(karussell.slides.some((s) => s.grafik?.art === "blaetter"));
});

test("Graph: Kinder-Container, Karussell mit collaborators, Veröffentlichen", () => {
  const s = graphKarussellSchritte(["https://x/1.png", "https://x/2.png"], "Text", ["wal.terpz"]);
  assert.equal(s.filter((x) => x.parameter.is_carousel_item === "true").length, 2);
  const karussell = s.find((x) => x.parameter.media_type === "CAROUSEL")!;
  assert.equal(karussell.parameter.collaborators, JSON.stringify(["wal.terpz"]));
  assert.equal(s.at(-1)!.pfad, "media_publish");
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** `lib/ig-graph.ts`

```ts
export type GraphSchritt = { pfad: string; parameter: Record<string, string> };

/** Instagram Content Publishing (Karussell): je Bild ein Kind-Container, dann der Karussell-Container mit
 * `collaborators` (bis 3 Handles), dann media_publish. `children` und `creation_id` setzt der Aufrufer ein. */
export function graphKarussellSchritte(bildUrls: string[], caption: string, collaborators: string[]): GraphSchritt[] {
  return [
    ...bildUrls.map((url) => ({ pfad: "media", parameter: { image_url: url, is_carousel_item: "true" } })),
    { pfad: "media", parameter: { media_type: "CAROUSEL", caption, collaborators: JSON.stringify(collaborators.slice(0, 3)) } },
    { pfad: "media_publish", parameter: {} },
  ];
}
```

`lib/ig-jury.ts`: Cover (`kicker: "Terpz-Jury"`, Titel = Beitragstitel gekürzt auf 60, `grafik: { art: "blaetter", note: review?.gesamtnote ?? 0 }` nur mit Bewertung, sonst `icons: ["buch"]`), Slide „Aroma“ (`icons` aus `review.aromen`, höchstens 5, Punkte = Labels aus `GESCHMACKS_ACHSEN`), Slide „Aus dem Beitrag“ (`text: zitat`, `icons: ["geschmack"]`), CTA (`titel: "Ganzer Beitrag im Book of Terpz"`, `text: "Von <Name> aus der Terpz-Jury."`, `icons: ["community", "blatt"]`). Caption: Hook = Titel + „ – die Terpz-Jury hat probiert.“ (≤ 125, ohne zweiten Gedankenstrich), Absatz Anriss, Zeile `Von @<handle>` (falls vorhanden), Zeile „Lust auf Vorabzugang? Schreib uns per DM.“, Hashtags `#bookofterpz #terpzjury #sortenbewertung #aromaprofil`. Die Jury-Fotos stehen vor den Text-Slides als eigene Bilder (Skript lädt sie herunter und nimmt sie als erste Medien).

`scripts/ig-jury.ts <slug> [--probe] [--planen=ISO]`: Feed holen, Karussell rendern (wie `scripts/ig-karussell.ts`), Medien = Fotos + Slides. Mit `IG_GRAPH_TOKEN` und `IG_BUSINESS_ID`: Medien müssen per URL erreichbar sein; Slides dafür über Publora-Upload-URLs oder die öffentlichen Bild-URLs; Schritte aus `graphKarussellSchritte` gegen `https://graph.facebook.com/v21.0/<IG_BUSINESS_ID>/<pfad>` ausführen, danach `permalink` abfragen und an `/api/jury-ig` melden (`VEROEFFENTLICHT`). Ohne Token: Fallback `entwurfMedien` + optional `planen` über Publora, Meldung `igStatus: "GEPLANT"` oder `"ENTWURF"`. Fehler: `igStatus: "FEHLER"`, Abbruch ohne Wiederholung. Eine Planung nur, wenn `tagBelegt` für den Tag falsch ist.

- [ ] **Step 4:** Tests PASS, tsc, eslint; `--probe` an einem Testbeitrag, PNGs ansehen (critique-composition).
- [ ] **Step 5: Commit + Push** `feat(jury): Instagram-Collab je Beitrag`.

---

### Task 10: Abschluss und Live-Prüfung

**Skills:** `superpowers:verification-before-completion`, `web-design-guidelines`, `better-interface`, `anthropic-skills:chrome-browser`

- [ ] **Step 1:** `npm test`, `npx tsc --noEmit -p .`, `npx eslint app components lib` auf `main` nach dem Merge.
- [ ] **Step 2:** Live im Browser (nach Deploy): Admin schaltet Jury für ein Testmitglied; Testmitglied schreibt Entwurf mit HWG-Wort (abgelehnt), dann gültig, reicht ein; Admin lädt 5 Bilder (sechstes abgelehnt), ordnet, markiert Symbolbild, legt Ausgabe an, veröffentlicht Beitrag (noch unsichtbar), veröffentlicht Ausgabe (sichtbar); `/jury`, `/jury/<slug>`, `/jury/favourites`, `/jury/team` bei 390 px und 1440 px, hell und dunkel, kein Querscroll, Bilder ganz im Rahmen; Startseite zeigt den Beitrag; Sortenseite zeigt Abzeichen und Link.
- [ ] **Step 3:** Testdaten wieder entfernen (Beitrag zurückziehen, Ausgabe löschen per Admin).
- [ ] **Step 4:** HANDOFF aktualisieren (Stand, Meta-App-Einrichtung für `IG_GRAPH_TOKEN`/`IG_BUSINESS_ID` als offener Nutzerschritt), Commit + Push.
