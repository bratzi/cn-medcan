# Vertreiber, Blüte und Charge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kultivar als „Blüte“ über alle Handelsnamen, Vertreiber statt bisherigem Hersteller, Chargenqualität zählt für den Vertreiber, Overall und Terpene für den Kultivar.

**Architecture:** Additive Migration `0021` (Tabelle `kultivare`, Spalten `kultivar_id` und `vertreiber_id` an `strains`, zwei neue Kennwerte-Tabellen, drei Qualitätsspalten an `sorten_kennwerte`, `vertreiber` und `kultivar_id` an `sorten_vorschlaege`). Reine Rechenfunktionen in `lib/qualitaet.ts`, Fortschreiben in `lib/kennwerte.ts`, Lesestellen stellen von `hersteller` auf `vertreiber` um. Die Bewertung bleibt am Handelsnamen; die Zuordnung zu Kultivar und Vertreiber ergibt sich über `strains`.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), Prisma 7 mit D1, Zod, `node:test` über `tsx --test`, better-sqlite3 nur in Tests.

**Spec:** `docs/superpowers/specs/2026-10-13-vertreiber-bewertung-design.md`

## Global Constraints

- Kein `next dev`, kein lokaler Build. Prüfweg: `npm test`, `npm run typecheck`, `npx eslint <dateien>`, dann pushen, Workers Build abwarten (~12 min), live per Browser-MCP prüfen (Memory `live-statt-dev`).
- Nach jeder erledigten Aufgabe committen; pushen an wenigen Prüfpunkten (ein Push bricht einen laufenden Build ab).
- Migration remote einspielen: `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0021_vertreiber_kultivar.sql`, danach `npx wrangler d1 execute cn-medcan-db --remote --file db/constraints.sql`. Vorher und nachher dieselbe Zählabfrage.
- Zeilenenden der berührten Datei beibehalten (CRLF bleibt CRLF, LF bleibt LF). Kein Renormalisieren.
- Commits in Prosa, Ende mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- HWG: keine öffentliche Bestenliste der Vertreiber, kein Logo, kein Kauf- oder Apothekenlink am Vertreiber, keine Superlative. Wirkung bleibt privat.
- Sichtbare Texte immer in `lib/i18n/de.ts` und `lib/i18n/en.ts` (Test `tests/i18n-literale.test.ts` verbietet Literale in Komponenten).
- UI-Regeln: Skill `ui-design-engine` (8px-Raster, Tokens, keine arbitrary Abstände). Bei UI-Aufgaben vorher `frontend-design` und `better-layout` laden (Memory `design-skills-einsatz`).
- Startseite mitziehen, wenn sich die Darstellung einer Bewertung ändert (Memory `startseite-mitziehen`).

## Review Focus

- Handelsname ohne `kultivar_name` (25 Stück): bekommt einen eigenen Kultivar mit seinem Handelsnamen, steht nie ohne Kultivar. Test in Task 1.
- Kultivarnamen, die sich nur in Groß-/Kleinschreibung oder Leerzeichen unterscheiden („Black Cherry Punch“, „black cherry punch “): landen im selben Kultivar. Test in Task 1.
- Alte Links `/blueten?hersteller=<id>`: filtern weiter, jetzt nach Vertreiber. Test in Task 4.
- Bewertung ohne Beschaffenheit (nur Overall): zählt nicht in die Vertreiber-Qualität, auch nicht als 0. Test in Task 2.
- Handelsname ohne Vertreiber: Blütenseite zeigt „Vertreiber unbekannt“, Fortschreiben der Vertreiber-Kennwerte überspringt ihn ohne Fehler. Test in Task 3.

---

## File Structure

- `migrations/0021_vertreiber_kultivar.sql` (neu): Schema und Rückfüllung.
- `prisma/schema.prisma`: Modelle `Kultivar`, `KultivarKennwerte`, `VertreiberKennwerte`; Felder an `Strain`, `SortenKennwerte`, `SortenVorschlag`, `Unternehmen`.
- `lib/qualitaet.ts` (neu): reine Rechnung Qualitäts-Schnitt und Kennwerte.
- `lib/query/bewertung.ts`: Achse `frische` mit `sweetSpot: false`.
- `lib/kennwerte.ts`: schreibt Sorte, Kultivar und Vertreiber fort.
- `lib/query/strains.ts`, `lib/query/filter.ts`, `lib/hersteller-facette.ts`, `lib/query/profil.ts`, `lib/query/rangliste.ts`: Lesestellen.
- `lib/query/vertreiber.ts` (neu): Geschwister eines Handelsnamens (gleicher Kultivar) mit Kennwerten.
- `components/review/VertreiberWahl.tsx` (neu), `components/review/VertreiberVergleich.tsx` (neu).
- `lib/lieblingsvertreiber.ts` (ersetzt `lib/lieblingshersteller.ts`), `lib/query/lieblingsvertreiber.ts` (ersetzt `lib/query/lieblingshersteller.ts`), `components/profil/Lieblingsvertreiber.tsx` (ersetzt `Lieblingshersteller.tsx`).
- Vorschlag und Admin: `lib/vorschlag-eingabe.ts`, `app/[lang]/vorschlagen/*`, `app/[lang]/admin/vorschlag-aktionen.ts`, `components/admin/BlueteVorschlaege.tsx`, `components/admin/BlueteFreigabe.tsx`.

---

### Task 1: Migration 0021 und Prisma-Schema

**Files:**
- Create: `migrations/0021_vertreiber_kultivar.sql`
- Modify: `prisma/schema.prisma` (Modelle `Strain`, `SortenKennwerte`, `SortenVorschlag`, `Unternehmen`; neue Modelle)
- Test: `tests/vertreiber-migration.test.ts`

**Interfaces:**
- Produces: Prisma-Felder `Strain.kultivarId`, `Strain.kultivar`, `Strain.vertreiberId`, `Strain.vertreiber`; Modelle `Kultivar { id, name, strains, kennwerte }`, `KultivarKennwerte { kultivarId, terpenMedian, geschmackMedian, gesamtnoteMedian, gesamtnoteMittel, anzahl }`, `VertreiberKennwerte { vertreiberId, qualitaetMittel, achsenMittel, restfeuchteMedian, anzahl }`; `SortenKennwerte.qualitaetMittel`, `.restfeuchteMedian`, `.qualitaetAnzahl`; `SortenVorschlag.vertreiber`, `.kultivarId`.

- [ ] **Step 1: Write the failing test**

`tests/vertreiber-migration.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/** Mindestschema der berührten Tabellen, wie es vor 0021 live steht. */
function alteDb() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE "unternehmen" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "land" TEXT, "rolle" TEXT NOT NULL);
    CREATE TABLE "strains" (
      "id" TEXT PRIMARY KEY, "handelsname" TEXT NOT NULL, "kultivar_name" TEXT,
      "hersteller_id" TEXT, "importeur_id" TEXT,
      CONSTRAINT "f1" FOREIGN KEY ("hersteller_id") REFERENCES "unternehmen" ("id") ON DELETE SET NULL,
      CONSTRAINT "f2" FOREIGN KEY ("importeur_id") REFERENCES "unternehmen" ("id") ON DELETE SET NULL);
    CREATE TABLE "sorten_kennwerte" ("strain_id" TEXT PRIMARY KEY, "terpen_median" TEXT NOT NULL, "geschmack_median" TEXT NOT NULL,
      "gesamtnote_median" REAL, "gesamtnote_mittel" REAL, "anzahl" INTEGER NOT NULL, "aktualisiert_am" DATETIME NOT NULL);
    CREATE TABLE "sorten_vorschlaege" ("id" TEXT PRIMARY KEY, "handelsname" TEXT NOT NULL, "hersteller" TEXT, "kultivar_name" TEXT);
    INSERT INTO "unternehmen" VALUES ('avaay','avaay',NULL,'HERSTELLER'), ('enua','Enua Pharma GmbH',NULL,'IMPORTEUR'),
      ('aurora','Aurora','CA','HERSTELLER'), ('jumis','Jumis Pharma',NULL,'BEIDES');
    INSERT INTO "strains" VALUES
      ('s1','avaay 22/1 BCP','Black Cherry Punch','avaay',NULL),
      ('s2','Enua 22/1 BCP CA','black cherry punch ','aurora','enua'),
      ('s3','Cold Creek Kush',' Cold Creek Kush',NULL,'enua'),
      ('s4','Phyto-Hemp PHCC 20/1','Cherry Cookies','jumis','jumis'),
      ('s5','Ohne Kultivar 1',NULL,'avaay',NULL),
      ('s6','Leer Kultivar 2','  ','avaay',NULL);
    INSERT INTO "sorten_vorschlaege" VALUES ('v1','Neu 1','Remexian','Citrus Sprizz');
  `);
  db.exec(readFileSync(join(process.cwd(), "migrations", "0021_vertreiber_kultivar.sql"), "utf8"));
  return db;
}

const zeile = (db: Database.Database, id: string) =>
  db.prepare(`SELECT s.hersteller_id h, s.importeur_id i, s.vertreiber_id v, k.name k FROM strains s LEFT JOIN kultivare k ON k.id = s.kultivar_id WHERE s.id = ?`).get(id);

test("0021: Vertreiber aus Importeur, sonst aus bisherigem Hersteller; Hersteller nur bei abweichendem Importeur", () => {
  const db = alteDb();
  assert.deepEqual(zeile(db, "s1"), { h: null, i: null, v: "avaay", k: "Black Cherry Punch" });
  assert.deepEqual(zeile(db, "s2"), { h: "aurora", i: null, v: "enua", k: "Black Cherry Punch" });
  assert.deepEqual(zeile(db, "s3"), { h: null, i: null, v: "enua", k: "Cold Creek Kush" });
  assert.deepEqual(zeile(db, "s4"), { h: null, i: null, v: "jumis", k: "Cherry Cookies" });
});

test("0021: gleiche Kultivare trotz Schreibweise einmal, ohne Kultivarnamen der Handelsname", () => {
  const db = alteDb();
  const namen = db.prepare(`SELECT name FROM kultivare ORDER BY name`).all().map((r) => (r as { name: string }).name);
  assert.deepEqual(namen, ["Black Cherry Punch", "Cherry Cookies", "Cold Creek Kush", "Leer Kultivar 2", "Ohne Kultivar 1"]);
  const ohne = db.prepare(`SELECT count(*) n FROM strains WHERE kultivar_id IS NULL`).get() as { n: number };
  assert.equal(ohne.n, 0);
});

test("0021: Kennwerte-Tabellen und Vorschlag-Felder", () => {
  const db = alteDb();
  db.prepare(`INSERT INTO vertreiber_kennwerte (vertreiber_id, qualitaet_mittel, achsen_mittel, restfeuchte_median, anzahl, aktualisiert_am) VALUES ('avaay', 3.5, '{}', 11, 2, CURRENT_TIMESTAMP)`).run();
  db.prepare(`INSERT INTO kultivar_kennwerte (kultivar_id, terpen_median, geschmack_median, anzahl, aktualisiert_am) SELECT id, '{}', '{}', 0, CURRENT_TIMESTAMP FROM kultivare LIMIT 1`).run();
  db.prepare(`UPDATE sorten_kennwerte SET qualitaet_mittel = 1, restfeuchte_median = 1, qualitaet_anzahl = 1`).run();
  assert.deepEqual(db.prepare(`SELECT vertreiber v, hersteller h, kultivar_id k FROM sorten_vorschlaege`).get(), { v: "Remexian", h: null, k: null });
  assert.throws(() => db.prepare(`INSERT INTO kultivare (id, name) VALUES ('x', 'BLACK CHERRY PUNCH')`).run(), /UNIQUE/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/vertreiber-migration.test.ts`
Expected: FAIL mit `ENOENT` (Datei `0021_vertreiber_kultivar.sql` fehlt).

- [ ] **Step 3: Write the migration**

`migrations/0021_vertreiber_kultivar.sql`:

```sql
-- 0021_vertreiber_kultivar
--
-- Spec 2026-10-13 (Vertreiber, Blüte, Charge): Kultivar als „Blüte“ über alle
-- Handelsnamen; der bisherige Hersteller wird Vertreiber (pharmazeutischer
-- Unternehmer in Deutschland), hersteller_id bleibt dem echten Anbauer.
-- importeur_id steckt im Fremdschlüssel der Tabelle und kann in SQLite nicht
-- per DROP COLUMN fallen: sie wird geleert und nicht mehr gelesen.

CREATE TABLE "kultivare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL COLLATE NOCASE,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "kultivare_name_key" ON "kultivare"("name");

ALTER TABLE "strains" ADD COLUMN "kultivar_id" TEXT REFERENCES "kultivare" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "strains" ADD COLUMN "vertreiber_id" TEXT REFERENCES "unternehmen" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ein Kultivar je getrimmtem, kleingeschriebenem Namen; ohne Namen zählt der Handelsname.
INSERT INTO "kultivare" ("id", "name")
SELECT lower(hex(randomblob(16))), min(trim(coalesce(nullif(trim("kultivar_name"), ''), "handelsname")))
FROM "strains"
GROUP BY lower(trim(coalesce(nullif(trim("kultivar_name"), ''), "handelsname")));

UPDATE "strains" SET "kultivar_id" = (
    SELECT k."id" FROM "kultivare" k
    WHERE k."name" = trim(coalesce(nullif(trim("strains"."kultivar_name"), ''), "strains"."handelsname"))
);

UPDATE "strains" SET "vertreiber_id" = coalesce("importeur_id", "hersteller_id");
UPDATE "strains" SET "hersteller_id" = CASE
    WHEN "importeur_id" IS NOT NULL AND "hersteller_id" IS NOT NULL AND "importeur_id" <> "hersteller_id" THEN "hersteller_id"
    ELSE NULL END;
UPDATE "strains" SET "importeur_id" = NULL;

CREATE INDEX "strains_kultivar_id_idx" ON "strains"("kultivar_id");
CREATE INDEX "strains_vertreiber_id_idx" ON "strains"("vertreiber_id");

CREATE TABLE "kultivar_kennwerte" (
    "kultivar_id" TEXT NOT NULL PRIMARY KEY,
    "terpen_median" TEXT NOT NULL,
    "geschmack_median" TEXT NOT NULL,
    "gesamtnote_median" REAL,
    "gesamtnote_mittel" REAL,
    "anzahl" INTEGER NOT NULL,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "kultivar_kennwerte_kultivar_id_fkey" FOREIGN KEY ("kultivar_id") REFERENCES "kultivare" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "vertreiber_kennwerte" (
    "vertreiber_id" TEXT NOT NULL PRIMARY KEY,
    "qualitaet_mittel" REAL,
    "achsen_mittel" TEXT NOT NULL,
    "restfeuchte_median" REAL,
    "anzahl" INTEGER NOT NULL,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "vertreiber_kennwerte_vertreiber_id_fkey" FOREIGN KEY ("vertreiber_id") REFERENCES "unternehmen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "sorten_kennwerte" ADD COLUMN "qualitaet_mittel" REAL;
ALTER TABLE "sorten_kennwerte" ADD COLUMN "restfeuchte_median" REAL;
ALTER TABLE "sorten_kennwerte" ADD COLUMN "qualitaet_anzahl" INTEGER NOT NULL DEFAULT 0;

-- Vorschläge: das bisherige Feld „Hersteller“ meinte die Marke, also den Vertreiber.
ALTER TABLE "sorten_vorschlaege" ADD COLUMN "vertreiber" TEXT;
ALTER TABLE "sorten_vorschlaege" ADD COLUMN "kultivar_id" TEXT REFERENCES "kultivare" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
UPDATE "sorten_vorschlaege" SET "vertreiber" = "hersteller", "hersteller" = NULL;
```

Hinweis zur Rückfüllung von `kultivar_id`: `name` hat `COLLATE NOCASE`, deshalb trifft der Vergleich in `UPDATE` auch „black cherry punch“.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/vertreiber-migration.test.ts`
Expected: PASS (3 Tests).

- [ ] **Step 5: Update `prisma/schema.prisma`**

Im Modell `Strain` den Block mit `herstellerId`/`importeurId` ersetzen durch:

```prisma
  /// Echter Hersteller (Anbauer, z. B. in Kanada); seit 0021 meist leer, wird nach und nach gepflegt.
  herstellerId String?      @map("hersteller_id")
  hersteller   Unternehmen? @relation("Hersteller", fields: [herstellerId], references: [id], onDelete: SetNull)
  /// Veraltet seit 0021: geleert, nicht mehr lesen. Steht im Fremdschlüssel der Tabelle, SQLite kann sie nicht entfernen.
  importeurId  String?      @map("importeur_id")
  importeur    Unternehmen? @relation("Importeur", fields: [importeurId], references: [id], onDelete: SetNull)
  /// Vertreiber in Deutschland (pharmazeutischer Unternehmer laut BfArM), Spec 2026-10-13.
  vertreiberId String?      @map("vertreiber_id")
  vertreiber   Unternehmen? @relation("Vertreiber", fields: [vertreiberId], references: [id], onDelete: SetNull)
  /// Die „Blüte“ über alle Vertreiber (Spec 2026-10-13); nach 0021 immer gesetzt.
  kultivarId   String?      @map("kultivar_id")
  kultivar     Kultivar?    @relation(fields: [kultivarId], references: [id], onDelete: SetNull)
```

dazu in `Strain` die Indizes `@@index([kultivarId])` und `@@index([vertreiberId])`.

Im Modell `Unternehmen` ergänzen: `vertrieben Strain[] @relation("Vertreiber")` und `vertreiberKennwerte VertreiberKennwerte?`.

Im Modell `SortenKennwerte` ergänzen:

```prisma
  /// Qualitäts-Schnitt 0-5 der Chargen dieses Handelsnamens (lib/qualitaet.ts), null ohne Beschaffenheit.
  qualitaetMittel   Float? @map("qualitaet_mittel")
  restfeuchteMedian Float? @map("restfeuchte_median")
  qualitaetAnzahl   Int    @default(0) @map("qualitaet_anzahl")
```

Im Modell `SortenVorschlag` nach `hersteller` ergänzen (und `hersteller` kommentieren als „echter Hersteller, optional“):

```prisma
  /// Vertreiber in Deutschland (bis 0021 stand er in `hersteller`).
  vertreiber   String?
  kultivarId   String?   @map("kultivar_id")
  kultivar     Kultivar? @relation(fields: [kultivarId], references: [id], onDelete: SetNull)
```

Neue Modelle:

```prisma
/// Die Blüte über alle Vertreiber (Spec 2026-10-13). Name unique ohne Groß-/Kleinschreibung (COLLATE NOCASE in 0021).
model Kultivar {
  id         String   @id @default(uuid())
  name       String   @unique
  erstelltAm DateTime @default(now()) @map("erstellt_am")

  strains    Strain[]
  vorschlaege SortenVorschlag[]
  kennwerte  KultivarKennwerte?

  @@map("kultivare")
}

/// Community-Mediane je Kultivar über alle Handelsnamen; beim Speichern fortgeschrieben (lib/kennwerte.ts).
model KultivarKennwerte {
  kultivarId       String   @id @map("kultivar_id")
  kultivar         Kultivar @relation(fields: [kultivarId], references: [id], onDelete: Cascade)
  terpenMedian     String   @map("terpen_median")
  geschmackMedian  String   @map("geschmack_median")
  gesamtnoteMedian Float?   @map("gesamtnote_median")
  gesamtnoteMittel Float?   @map("gesamtnote_mittel")
  anzahl           Int
  aktualisiertAm   DateTime @updatedAt @map("aktualisiert_am")

  @@map("kultivar_kennwerte")
}

/// Chargenqualität je Vertreiber über alle seine Handelsnamen; beim Speichern fortgeschrieben.
model VertreiberKennwerte {
  vertreiberId      String      @id @map("vertreiber_id")
  vertreiber        Unternehmen @relation(fields: [vertreiberId], references: [id], onDelete: Cascade)
  qualitaetMittel   Float?      @map("qualitaet_mittel")
  /// JSON: Beschaffenheitsachse zu Mittel 0-5.
  achsenMittel      String      @map("achsen_mittel")
  restfeuchteMedian Float?      @map("restfeuchte_median")
  anzahl            Int
  aktualisiertAm    DateTime    @updatedAt @map("aktualisiert_am")

  @@map("vertreiber_kennwerte")
}
```

- [ ] **Step 6: Generate client and typecheck**

Run: `npm run db:generate` then `npm run typecheck`
Expected: generate ok; typecheck ok (noch keine Lesestelle nutzt die neuen Felder).

- [ ] **Step 7: Commit**

```bash
git add migrations/0021_vertreiber_kultivar.sql prisma/schema.prisma tests/vertreiber-migration.test.ts lib/generated
git commit -m "feat: Migration 0021 mit Kultivar, Vertreiber und Kennwerten je Kultivar und Vertreiber"
```

(`lib/generated` nur, wenn das Projekt den generierten Client eincheckt: vorher `git ls-files lib/generated | head -1` prüfen.)

---

### Task 2: Qualität rechnen, Achse Frische

**Files:**
- Create: `lib/qualitaet.ts`
- Modify: `lib/query/bewertung.ts` (`BESCHAFFENHEIT_ACHSEN`), `lib/i18n/de.ts` und `lib/i18n/en.ts` (`schema.beschaffenheit.frische`, `aroma.erkundung.chargeSatz`), `components/review/BeschaffenheitsLeiste.tsx` (kein Sweet Spot bei Frische)
- Test: `tests/qualitaet.test.ts`

**Interfaces:**
- Consumes: `qualitaetsScore`, `median` aus `lib/bewertung-v2.ts`; `Beschaffenheit`, `BESCHAFFENHEIT_ACHSEN` aus `lib/query/bewertung.ts`.
- Produces:
  - `qualitaetAusBeschaffenheit(b: Beschaffenheit): number | null` (0 bis 5, eine Nachkommastelle; null ohne Achse)
  - `type QualitaetsKennwerte = { qualitaetMittel: number | null; achsenMittel: Record<string, number>; restfeuchteMedian: number | null; anzahl: number }`
  - `qualitaetsKennwerte(zeilen: readonly { beschaffenheit: Beschaffenheit; feuchtigkeitProzent: number | null }[]): QualitaetsKennwerte` (`anzahl` = Zeilen mit Qualität oder Restfeuchte)
  - Achse `frische` in `BESCHAFFENHEIT_ACHSEN` mit Feld `sweetSpot: false`; alle anderen Achsen `sweetSpot: true`.

- [ ] **Step 1: Write the failing test**

`tests/qualitaet.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { qualitaetAusBeschaffenheit, qualitaetsKennwerte } from "@/lib/qualitaet";
import { BESCHAFFENHEIT_ACHSEN } from "@/lib/query/bewertung";

test("Qualität: Sweet Spot in der Mitte ergibt 5, Frische zählt linear", () => {
  assert.equal(qualitaetAusBeschaffenheit({ chlorophyll: 2.5, budDichte: 2.5 }), 5);
  assert.equal(qualitaetAusBeschaffenheit({ chlorophyll: 0 }), 0);
  assert.equal(qualitaetAusBeschaffenheit({ frische: 5 }), 5);
  assert.equal(qualitaetAusBeschaffenheit({ frische: 2.5, chlorophyll: 2.5 }), 3.8);
});

test("Qualität: ohne Achse null, nicht 0 (Review Focus)", () => {
  assert.equal(qualitaetAusBeschaffenheit({}), null);
});

test("Kennwerte: Mittel nur über Bewertungen mit Qualität, Restfeuchte als Median", () => {
  const k = qualitaetsKennwerte([
    { beschaffenheit: { chlorophyll: 2.5 }, feuchtigkeitProzent: 10 },
    { beschaffenheit: { chlorophyll: 0 }, feuchtigkeitProzent: 12 },
    { beschaffenheit: {}, feuchtigkeitProzent: null },
  ]);
  assert.deepEqual(k, { qualitaetMittel: 2.5, achsenMittel: { chlorophyll: 1.25 }, restfeuchteMedian: 11, anzahl: 2 });
  assert.deepEqual(qualitaetsKennwerte([]), { qualitaetMittel: null, achsenMittel: {}, restfeuchteMedian: null, anzahl: 0 });
});

test("Achse Frische ohne Sweet Spot, die übrigen mit", () => {
  const frische = BESCHAFFENHEIT_ACHSEN.find((a) => a.key === "frische");
  assert.ok(frische);
  assert.equal(frische.sweetSpot, false);
  for (const a of BESCHAFFENHEIT_ACHSEN.filter((a) => a.key !== "frische")) assert.equal(a.sweetSpot, true, a.key);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/qualitaet.test.ts`
Expected: FAIL, Modul `@/lib/qualitaet` nicht gefunden.

- [ ] **Step 3: Implement**

In `lib/query/bewertung.ts` jede Zeile von `BESCHAFFENHEIT_ACHSEN` um `sweetSpot: true` ergänzen und die Achse anhängen:

```ts
  { key: "frische", label: "Frische", links: "abgestanden", rechts: "frisch", hinweis: "Wie frisch die Ware wirkt: alt und heuig oder frisch verpackt.", sweetSpot: false },
```

Den Kommentar über der Liste ergänzen: „Frische hat keinen Sweet Spot: mehr ist besser (Spec 2026-10-13).“

`lib/qualitaet.ts`:

```ts
import { median, qualitaetsScore } from "@/lib/bewertung-v2";
import { BESCHAFFENHEIT_ACHSEN, type Beschaffenheit } from "@/lib/query/bewertung";

const OHNE_SWEET_SPOT = new Set<string>(BESCHAFFENHEIT_ACHSEN.filter((a) => !a.sweetSpot).map((a) => a.key));

const eineStelle = (x: number) => Math.round(x * 10) / 10;

/**
 * Qualität einer Charge 0 bis 5 (Spec 2026-10-13): je Achse 1 im Sweet Spot, 0 am Rand;
 * Frische linear (mehr ist besser). Ohne Achse null: eine Bewertung nur mit Overall zählt nicht als 0.
 */
export function qualitaetAusBeschaffenheit(b: Beschaffenheit): number | null {
  const werte = Object.entries(b).filter((e): e is [string, number] => typeof e[1] === "number");
  if (werte.length === 0) return null;
  const summe = werte.reduce((s, [key, wert]) => s + (OHNE_SWEET_SPOT.has(key) ? wert / 5 : qualitaetsScore(wert)), 0);
  return eineStelle((summe / werte.length) * 5);
}

export type QualitaetsKennwerte = {
  qualitaetMittel: number | null;
  achsenMittel: Record<string, number>;
  restfeuchteMedian: number | null;
  anzahl: number;
};

/** Kennwerte der Chargenqualität über mehrere Bewertungen (je Handelsname oder je Vertreiber). */
export function qualitaetsKennwerte(
  zeilen: readonly { beschaffenheit: Beschaffenheit; feuchtigkeitProzent: number | null }[],
): QualitaetsKennwerte {
  const qualitaeten: number[] = [];
  const feuchten: number[] = [];
  const achsen = new Map<string, number[]>();
  let anzahl = 0;
  for (const z of zeilen) {
    const q = qualitaetAusBeschaffenheit(z.beschaffenheit);
    if (q !== null) qualitaeten.push(q);
    if (z.feuchtigkeitProzent !== null) feuchten.push(z.feuchtigkeitProzent);
    if (q !== null || z.feuchtigkeitProzent !== null) anzahl += 1;
    for (const [key, wert] of Object.entries(z.beschaffenheit)) {
      if (typeof wert !== "number") continue;
      achsen.set(key, [...(achsen.get(key) ?? []), wert]);
    }
  }
  const mittel = (l: number[]) => l.reduce((a, b) => a + b, 0) / l.length;
  return {
    qualitaetMittel: qualitaeten.length === 0 ? null : eineStelle(mittel(qualitaeten)),
    achsenMittel: Object.fromEntries([...achsen].map(([k, l]) => [k, Math.round(mittel(l) * 100) / 100])),
    restfeuchteMedian: median(feuchten),
    anzahl,
  };
}
```

i18n: in `lib/i18n/de.ts` unter `schema.beschaffenheit` nach `trichomFarbe`:

```ts
      frische: { label: "Frische", links: "abgestanden", rechts: "frisch", hinweis: "Wie frisch die Ware wirkt: alt und heuig oder frisch verpackt." },
```

in `en.ts`: `frische: { label: "Freshness", links: "stale", rechts: "fresh", hinweis: "How fresh the product feels: old and hay-like or freshly packed." },`

`aroma.erkundung.chargeSatz` de: `"Qualität, Restfeuchte und Frische gehören zur Charge und zum Vertreiber, nicht zur Blüte. Bei den übrigen Achsen ist die Mitte der Sweet Spot."`, en: `"Quality, moisture and freshness belong to the batch and the distributor, not to the flower. On the other axes the middle is the sweet spot."`

`components/review/BeschaffenheitsLeiste.tsx`: dort, wo `Spur` mit `mitte={QUALITAET_MITTE}` gerendert wird, `mitte={achse.sweetSpot ? QUALITAET_MITTE : undefined}` setzen (die Achse kommt aus `BESCHAFFENHEIT_ACHSEN`). Falls `lib/i18n/typen.ts` den Typ von `schema.beschaffenheit` aus den Keys ableitet, ist nichts weiter zu tun; sonst dort `frische` ergänzen (`npm run typecheck` zeigt es).

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/qualitaet.test.ts` dann `npm test` und `npm run typecheck`
Expected: alle grün. Schlägt ein bestehender Test wegen der fünften Achse fehl (Zählung der Achsen), die erwartete Zahl dort auf 5 setzen und im Commit nennen.

- [ ] **Step 5: Commit**

```bash
git add lib/qualitaet.ts lib/query/bewertung.ts lib/i18n/de.ts lib/i18n/en.ts components/review/BeschaffenheitsLeiste.tsx tests/qualitaet.test.ts
git commit -m "feat: Qualitaets-Schnitt der Charge und Achse Frische ohne Sweet Spot"
```

---

### Task 3: Kennwerte für Sorte, Kultivar und Vertreiber fortschreiben

**Files:**
- Modify: `lib/kennwerte.ts`
- Test: `tests/kennwerte-fortschreiben.test.ts`

**Interfaces:**
- Consumes: `qualitaetsKennwerte` (Task 2), `sortenKennwerte` (`lib/bewertung-v2.ts`), Prisma-Modelle aus Task 1.
- Produces: `kennwerteFortschreiben(strainId: string): Promise<void>` (Signatur unverändert; schreibt jetzt drei Ebenen). Reine Hilfsfunktion `kennwerteDaten(zeilen)` exportiert für den Test:
  `kennwerteDaten(zeilen: readonly KennwertZeile[]): { aroma: SortenKennwerte; qualitaet: QualitaetsKennwerte }` mit
  `type KennwertZeile = { gesamtnote: number | null; terpenIntensitaet: string | null; geschmacksMatrix: string; beschaffenheit: string | null; feuchtigkeitProzent: number | null }`.

- [ ] **Step 1: Write the failing test**

`tests/kennwerte-fortschreiben.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { kennwerteDaten } from "@/lib/kennwerte";

test("kennwerteDaten: Aroma und Qualität aus denselben Zeilen", () => {
  const d = kennwerteDaten([
    { gesamtnote: 4, terpenIntensitaet: '{"Myrcen":3}', geschmacksMatrix: '{"ERDIG":4}', beschaffenheit: '{"chlorophyll":2.5}', feuchtigkeitProzent: 11 },
    { gesamtnote: 2, terpenIntensitaet: null, geschmacksMatrix: "{}", beschaffenheit: null, feuchtigkeitProzent: null },
  ]);
  assert.equal(d.aroma.anzahl, 2);
  assert.equal(d.aroma.gesamtnoteMittel, 3);
  assert.equal(d.qualitaet.qualitaetMittel, 5);
  assert.equal(d.qualitaet.anzahl, 1);
});

test("kennwerteFortschreiben schreibt Kultivar und Vertreiber, überspringt fehlenden Vertreiber", () => {
  const q = readFileSync("lib/kennwerte.ts", "utf8");
  assert.match(q, /kultivarKennwerte\.upsert/);
  assert.match(q, /vertreiberKennwerte\.upsert/);
  assert.match(q, /if \(strain\.vertreiberId\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/kennwerte-fortschreiben.test.ts`
Expected: FAIL, `kennwerteDaten` ist nicht exportiert.

- [ ] **Step 3: Implement** — `lib/kennwerte.ts` ganz ersetzen:

```ts
import { sortenKennwerte, type SortenKennwerte } from "@/lib/bewertung-v2";
import { getPrisma } from "@/lib/prisma";
import { qualitaetsKennwerte, type QualitaetsKennwerte } from "@/lib/qualitaet";
import { parseBeschaffenheit, parseGeschmacksMatrix, parseTerpenIntensitaet } from "@/lib/query/bewertung";

export type KennwertZeile = {
  gesamtnote: number | null;
  terpenIntensitaet: string | null;
  geschmacksMatrix: string;
  beschaffenheit: string | null;
  feuchtigkeitProzent: number | null;
};

const ZEILE = { gesamtnote: true, terpenIntensitaet: true, geschmacksMatrix: true, beschaffenheit: true, feuchtigkeitProzent: true } as const;

/** Aroma-Mediane und Chargenqualität aus denselben freigegebenen Bewertungen. */
export function kennwerteDaten(zeilen: readonly KennwertZeile[]): { aroma: SortenKennwerte; qualitaet: QualitaetsKennwerte } {
  return {
    aroma: sortenKennwerte(
      zeilen.map((r) => ({ gesamtnote: r.gesamtnote, terpene: parseTerpenIntensitaet(r.terpenIntensitaet), geschmack: parseGeschmacksMatrix(r.geschmacksMatrix) })),
    ),
    qualitaet: qualitaetsKennwerte(zeilen.map((r) => ({ beschaffenheit: parseBeschaffenheit(r.beschaffenheit), feuchtigkeitProzent: r.feuchtigkeitProzent }))),
  };
}

const aromaSpalten = (a: SortenKennwerte) => ({
  terpenMedian: JSON.stringify(a.terpenMedian),
  geschmackMedian: JSON.stringify(a.geschmackMedian),
  gesamtnoteMedian: a.gesamtnoteMedian,
  gesamtnoteMittel: a.gesamtnoteMittel,
  anzahl: a.anzahl,
});

/**
 * Kennwerte neu rechnen (Spec 2026-10-13): je Handelsname Aroma und Qualität, je Kultivar das Aroma
 * über alle Handelsnamen, je Vertreiber die Qualität über alle seine Handelsnamen. Beim Speichern und
 * Freigeben gerufen, nie je Seitenaufruf (CPU-Limit).
 */
export async function kennwerteFortschreiben(strainId: string): Promise<void> {
  const prisma = await getPrisma();
  const strain = await prisma.strain.findUnique({ where: { id: strainId }, select: { kultivarId: true, vertreiberId: true } });
  if (!strain) return;
  const [eigene, imKultivar, beimVertreiber] = await Promise.all([
    prisma.review.findMany({ where: { strainId, freigegeben: true }, select: ZEILE }),
    strain.kultivarId ? prisma.review.findMany({ where: { freigegeben: true, strain: { kultivarId: strain.kultivarId } }, select: ZEILE }) : Promise.resolve([]),
    strain.vertreiberId ? prisma.review.findMany({ where: { freigegeben: true, strain: { vertreiberId: strain.vertreiberId } }, select: ZEILE }) : Promise.resolve([]),
  ]);

  const sorte = kennwerteDaten(eigene);
  const sorteDaten = {
    ...aromaSpalten(sorte.aroma),
    qualitaetMittel: sorte.qualitaet.qualitaetMittel,
    restfeuchteMedian: sorte.qualitaet.restfeuchteMedian,
    qualitaetAnzahl: sorte.qualitaet.anzahl,
  };
  await prisma.sortenKennwerte.upsert({ where: { strainId }, create: { strainId, ...sorteDaten }, update: sorteDaten });

  if (strain.kultivarId) {
    const kultivarDaten = aromaSpalten(kennwerteDaten(imKultivar).aroma);
    await prisma.kultivarKennwerte.upsert({
      where: { kultivarId: strain.kultivarId },
      create: { kultivarId: strain.kultivarId, ...kultivarDaten },
      update: kultivarDaten,
    });
  }
  if (strain.vertreiberId) {
    const q = kennwerteDaten(beimVertreiber).qualitaet;
    const vertreiberDaten = { qualitaetMittel: q.qualitaetMittel, achsenMittel: JSON.stringify(q.achsenMittel), restfeuchteMedian: q.restfeuchteMedian, anzahl: q.anzahl };
    await prisma.vertreiberKennwerte.upsert({
      where: { vertreiberId: strain.vertreiberId },
      create: { vertreiberId: strain.vertreiberId, ...vertreiberDaten },
      update: vertreiberDaten,
    });
  }
}
```

(Prüfen, dass `parseBeschaffenheit` in `lib/query/bewertung.ts` exportiert ist; sie steht dort bei Zeile ~300.)

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/kennwerte-fortschreiben.test.ts`, `npm test`, `npm run typecheck`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add lib/kennwerte.ts tests/kennwerte-fortschreiben.test.ts
git commit -m "feat: Kennwerte je Kultivar und je Vertreiber beim Speichern fortschreiben"
```

---

### Task 4: Lesestellen auf Vertreiber umstellen (Katalog, Filter, Listen)

**Files:**
- Modify: `lib/query/filter.ts`, `lib/query/strains.ts`, `lib/hersteller-facette.ts` (umbenennen zu `lib/vertreiber-facette.ts`), `app/[lang]/blueten/page.tsx`, `components/produkt/AktiveFilter.tsx`, `components/produkt/FilterLeiste.tsx`, `components/produkt/ProduktCard.tsx`, `lib/query/rangliste.ts`, `lib/query/profil.ts`, `components/story/AromaSektion.tsx`, `components/review/SortenKopf.tsx`, `lib/i18n/de.ts`, `lib/i18n/en.ts`
- Rename tests: `tests/hersteller-facette.test.ts` → `tests/vertreiber-facette.test.ts`; Modify `tests/filter-hersteller.test.ts`, `tests/filter-hersteller-ui.test.ts`

**Interfaces:**
- Consumes: `Strain.vertreiber` (Task 1).
- Produces:
  - `StrainFilter.vertreiber: string[]` (ersetzt `hersteller`); URL-Parameter `vertreiber`; `parseStrainFilter` liest zusätzlich alte `hersteller`-Werte in `vertreiber`.
  - `FilterFacetten.vertreiber: { id; name; anzahl }[]` (ersetzt `hersteller`); `vertreiberFacette(liste)` in `lib/vertreiber-facette.ts` (gleiche Logik wie `herstellerFacette`, Zählfeld `_count.vertrieben`).
  - Listen-/Kartenfeld `vertreiberName: string | null` (ersetzt `herstellerName`) in `StrainListenEintrag`, `ladeAromaVorzeige`, `SortenKopfProps`.
  - `RanglistenEintrag.vertreiber` und Profil-Auswertungszeile `.vertreiber` (ersetzt `.hersteller`).

- [ ] **Step 1: Write the failing tests**

In `tests/filter-hersteller.test.ts` (Datei umbenennen in `tests/filter-vertreiber.test.ts`, `git mv`) Inhalt ersetzen:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { istFilterLeer, parseStrainFilter, serialisiereFilter } from "@/lib/query/filter";

const id = "4a5761be-5783-43ea-8223-a9e58cc75af8";

test("vertreiber: Liste aus Komma und Mehrfachwert, doppelt einmal", () => {
  const f = parseStrainFilter({ vertreiber: [`${id},${id}`, "abc-1"] });
  assert.deepEqual(f.vertreiber, [id, "abc-1"]);
  assert.equal(serialisiereFilter(f).get("vertreiber"), `${id},abc-1`);
  assert.equal(istFilterLeer(f), false);
});

test("alte Links mit hersteller= filtern nach Vertreiber (Review Focus)", () => {
  const f = parseStrainFilter({ hersteller: id });
  assert.deepEqual(f.vertreiber, [id]);
  assert.equal(serialisiereFilter(f).get("hersteller"), null);
  assert.equal(serialisiereFilter(f).get("vertreiber"), id);
});

test("vertreiber: Kaputtes fällt weg, kein Fehler", () => {
  const f = parseStrainFilter({ vertreiber: "<script>,,  " });
  assert.deepEqual(f.vertreiber, []);
  assert.equal(istFilterLeer(f), true);
});
```

`tests/vertreiber-facette.test.ts` (aus `hersteller-facette.test.ts` per `git mv`): Import auf `vertreiberFacette` aus `@/lib/vertreiber-facette`, `_count: { hergestellt: n }` jeweils durch `_count: { vertrieben: n }` ersetzen, Rest gleich.

`tests/filter-hersteller-ui.test.ts` → `git mv` zu `tests/filter-vertreiber-ui.test.ts`; darin `hersteller: [id]` durch `vertreiber: [id]`, `herstellerNamen` durch `vertreiberNamen`, `/Hersteller: Aurora/` durch `/Vertreiber: Aurora/`, `/Hersteller: unbekannt/` durch `/Vertreiber: unbekannt/`, `hersteller=` durch `vertreiber=`, `facetten\.hersteller` durch `facetten\.vertreiber`, `texte\.herstellerSuche` durch `texte\.vertreiberSuche`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test tests/filter-vertreiber.test.ts tests/vertreiber-facette.test.ts tests/filter-vertreiber-ui.test.ts`
Expected: FAIL (Feld `vertreiber` und Modul fehlen).

- [ ] **Step 3: Implement**

`lib/query/filter.ts`:
- Im Schema `hersteller: slugListe` ersetzen durch `vertreiber: slugListe` mit Kommentar „Unternehmen-Ids der Vertreiber (Spec 2026-10-13); alte Links mit `hersteller` liest parseStrainFilter mit.“
- `LEERER_FILTER`: `vertreiber: []`.
- `serialisiereFilter`: `if (filter.vertreiber.length > 0) params.set("vertreiber", filter.vertreiber.join(","));`
- `istFilterLeer`: `filter.vertreiber.length === 0`.
- `parseStrainFilter` am Anfang:

```ts
  const roh = alsRecord(searchParams);
  // Alte Links (bis 2026-10-13): ?hersteller= meinte schon den Vertreiber, die Ids sind dieselben.
  if (roh.hersteller !== undefined && roh.vertreiber === undefined) roh.vertreiber = roh.hersteller;
  const ergebnis = strainFilterSchema.safeParse(roh);
```

(`alsRecord` liefert ein frisches Objekt; falls es das Original zurückgibt, vorher `{ ...alsRecord(searchParams) }`.)

`lib/vertreiber-facette.ts` (per `git mv lib/hersteller-facette.ts lib/vertreiber-facette.ts`): Typ `HerstellerZeile` → `VertreiberZeile` mit `_count: { vertrieben: number }`, Funktion `herstellerFacette` → `vertreiberFacette`, Kommentar „Vertreiber-Facette des Katalogs“, Zählung `h._count.vertrieben`.

`lib/query/strains.ts`:
- Listen-Select (bei `hersteller: { select: { name: true } }` um Zeile 435): `vertreiber: { select: { name: true } }`; Zeilentyp `vertreiber: { name: string } | null`; Abbildung `vertreiberName: zeile.vertreiber?.name ?? null`; Feld im Eintragstyp `vertreiberName` statt `herstellerName`.
- `baueWhere`: `if (filter.vertreiber.length > 0) bedingungen.vertreiberId = { in: filter.vertreiber };`
- `FilterFacetten.hersteller` → `vertreiber`; Abfrage `prisma.unternehmen.findMany({ where: { vertrieben: { some: { aktiv: true } } }, select: { id: true, name: true, land: true, rolle: true, _count: { select: { vertrieben: { where: { aktiv: true } } } } }, orderBy: { name: "asc" }, take: 400 })`; Rückgabe `vertreiber: vertreiberFacette(vertreiberListe)`.
- `ladeAromaVorzeige`: `vertreiber: { select: { name: true } }`, Feld `vertreiberName`.

`app/[lang]/blueten/page.tsx`: `herstellerNamen` → `vertreiberNamen` aus `facetten.vertreiber`, fehlende aus `filter.vertreiber` über `ladeUnternehmenNamen`; Prop an `AktiveFilter` `vertreiberNamen`.

`components/produkt/AktiveFilter.tsx`: Prop `vertreiberNamen`, Schleife über `filter.vertreiber`, Schlüssel `vertreiber-${id}`, Texte `texte.vertreiber`, `texte.vertreiberBeschreibung`, `texte.vertreiberUnbekannt`.

`components/produkt/FilterLeiste.tsx`: überall `facetten.hersteller` → `facetten.vertreiber`, `filter.hersteller` → `filter.vertreiber`, Zustand `herstellerSuche` → `vertreiberSuche`, Texte `texte.vertreiber`, `texte.vertreiberSuche`.

`components/produkt/ProduktCard.tsx`: `strain.vertreiberName ?? w.katalog.karte.vertreiberUnbekannt`.

`lib/query/rangliste.ts` und `lib/query/profil.ts`: `hersteller: { select: { name: true } }` → `vertreiber: { select: { name: true } }`, Feld `vertreiber: s.vertreiber?.name ?? null`. In `app/[lang]/profil/page.tsx` (`Notizen`) `z.hersteller` → `z.vertreiber`. Alle weiteren Treffer von `.hersteller` auf diesen Zeilentypen zeigt `npm run typecheck`; dort gleich umstellen (`components/rangliste/RanglistenKarte.tsx`, `lib/profil-dashboard.ts`).

`components/review/SortenKopf.tsx` und `components/story/AromaSektion.tsx`: Prop `herstellerName` → `vertreiberName`, Fakt-Label `texte.vertreiber`.

i18n (de / en), Schlüssel umbenennen und Werte setzen:
- `katalog.aktiv`: `vertreiber: "Vertreiber: {wert}"` / `"Distributor: {wert}"`, `vertreiberBeschreibung: "Vertreiber {wert}"` / `"Distributor {wert}"`, `vertreiberUnbekannt: "unbekannt"` / `"unknown"` (die drei `hersteller*`-Schlüssel entfallen).
- `katalog.leiste`: `hersteller` → `vertreiber: "Vertreiber"` / `"Distributor"`, `herstellerSuche` → `vertreiberSuche: "Vertreiber suchen"` / `"Search distributors"`.
- `katalog.karte.herstellerUnbekannt` → `vertreiberUnbekannt: "Vertreiber unbekannt"` / `"Distributor unknown"`.
- `aroma.sortenKopf.hersteller` → `vertreiber: "Vertreiber"` / `"Distributor"`.
Bestehende Werte der alten Schlüssel vorher nachsehen (`grep -n "herstellerSuche\|herstellerUnbekannt" lib/i18n/de.ts`) und die Satzform beibehalten.

- [ ] **Step 4: Run tests**

Run: `npm test` und `npm run typecheck` und `npx eslint lib components app --quiet`
Expected: grün. Weitere Tests, die `hersteller` im Filter oder `herstellerName` erwarten, auf die neuen Namen umstellen.

- [ ] **Step 5: Commit**

```bash
git add -A lib components app tests
git commit -m "feat: Katalog, Filter und Listen zeigen den Vertreiber statt des Herstellers"
```

---

### Task 5: Blütenseite mit Vertreiber-Wahl und Vergleich

**Files:**
- Create: `lib/query/vertreiber.ts`, `components/review/VertreiberWahl.tsx`, `components/review/VertreiberVergleich.tsx`
- Modify: `lib/query/strains.ts` (`ladeStrainDetail`, `StrainDetail`, `KENNWERTE_SELECT`), `app/[lang]/blueten/[slug]/page.tsx`, `components/review/AromaErkundung.tsx`, `components/review/BewertungsFormular.tsx`, `lib/aromakarte.ts` (falls dort `communityMedian` aus `kennwerte` gelesen wird), `lib/i18n/de.ts`, `lib/i18n/en.ts`
- Test: `tests/vertreiber-bluete.test.ts`

**Interfaces:**
- Consumes: `Strain.kultivar`, `Strain.vertreiber`, `KultivarKennwerte`, `VertreiberKennwerte`, `SortenKennwerte.qualitaetMittel` (Task 1/3).
- Produces:
  - `type VertreiberEintrag = { slug: string; handelsname: string; vertreiberName: string | null; qualitaet: number | null; restfeuchte: number | null; anzahl: number; aktuell: boolean }`
  - `ladeVertreiberDerBluete(kultivarId: string, aktuelleId: string): Promise<VertreiberEintrag[]>` (aktive Handelsnamen des Kultivars, sortiert nach `anzahl` absteigend, dann Name; höchstens 30)
  - `StrainDetail` neu: `kultivar: { id: string; name: string } | null`, `vertreiber: UnternehmenEintrag | null`, `hersteller: UnternehmenEintrag | null` (Anbauer), `kultivarKennwerte: KennwerteZeile | null`, `vertreiberQualitaet: { qualitaetMittel: number | null; restfeuchteMedian: number | null; anzahl: number } | null`; `importeur` entfällt.
  - `VertreiberWahl({ eintraege, kultivarId, texte })`, `VertreiberVergleich({ eintraege, texte, sprache })`.
  - Prop `zuordnung?: { bluete: string; vertreiber: string | null }` an `BewertungsFormular` und `AromaErkundung`.

- [ ] **Step 1: Write the failing test**

`tests/vertreiber-bluete.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { VertreiberVergleich } from "@/components/review/VertreiberVergleich";
import { VertreiberWahl } from "@/components/review/VertreiberWahl";
import { de } from "@/lib/i18n/de";

const eintraege = [
  { slug: "enua-22-1-bcp-ca", handelsname: "Enua 22/1 BCP CA", vertreiberName: "Enua Pharma GmbH", qualitaet: 4.2, restfeuchte: 11.5, anzahl: 3, aktuell: false },
  { slug: "avaay-22-1-bcp", handelsname: "avaay 22/1 BCP", vertreiberName: "avaay", qualitaet: null, restfeuchte: null, anzahl: 0, aktuell: true },
];

test("VertreiberWahl: alle Vertreiber der Blüte als Links, aktueller markiert, Vorschlag mit Kultivar", () => {
  const html = renderToStaticMarkup(createElement(VertreiberWahl, { eintraege, kultivarId: "k1", texte: de.bluete.vertreiber }));
  assert.match(html, /href="\/blueten\/enua-22-1-bcp-ca#bewerten"/);
  assert.match(html, /aria-current="page"[^>]*>[^<]*avaay/);
  assert.match(html, /href="\/vorschlagen\?kultivar=k1"/);
});

test("VertreiberWahl: nur ein Vertreiber steht als Text", () => {
  const html = renderToStaticMarkup(createElement(VertreiberWahl, { eintraege: [eintraege[1]], kultivarId: "k1", texte: de.bluete.vertreiber }));
  assert.doesNotMatch(html, /href="\/blueten\//);
  assert.match(html, /avaay/);
});

test("VertreiberVergleich: entfällt bei nur einem Handelsnamen, sonst Zeile je Vertreiber ohne Kauflink", () => {
  assert.equal(renderToStaticMarkup(createElement(VertreiberVergleich, { eintraege: [eintraege[1]], texte: de.bluete.vertreiber, sprache: "de" })), "");
  const html = renderToStaticMarkup(createElement(VertreiberVergleich, { eintraege, texte: de.bluete.vertreiber, sprache: "de" }));
  assert.match(html, /Enua Pharma GmbH/);
  assert.match(html, /11,5/);
  assert.doesNotMatch(html, /apotheke|kaufen/i);
});

test("Blütenseite: Vertreiber-Wahl über der Maske, Vergleich, Angaben Vertreiber und Hersteller", () => {
  const q = readFileSync("app/[lang]/blueten/[slug]/page.tsx", "utf8");
  assert.match(q, /<VertreiberWahl/);
  assert.match(q, /<VertreiberVergleich/);
  assert.match(q, /f\.vertreiber/);
  assert.doesNotMatch(q, /f\.importeur/);
  assert.match(q, /zuordnung=\{/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/vertreiber-bluete.test.ts`
Expected: FAIL, Module fehlen.

- [ ] **Step 3: Implement the query**

`lib/query/vertreiber.ts`:

```ts
import { getPrisma } from "@/lib/prisma";

export type VertreiberEintrag = {
  slug: string;
  handelsname: string;
  vertreiberName: string | null;
  qualitaet: number | null;
  restfeuchte: number | null;
  anzahl: number;
  aktuell: boolean;
};

/** Alle aktiven Handelsnamen derselben Blüte (Kultivar) mit Chargenqualität (Spec 2026-10-13). */
export async function ladeVertreiberDerBluete(kultivarId: string, aktuelleId: string): Promise<VertreiberEintrag[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.strain.findMany({
    where: { kultivarId, aktiv: true },
    select: {
      id: true,
      slug: true,
      handelsname: true,
      vertreiber: { select: { name: true } },
      kennwerte: { select: { qualitaetMittel: true, restfeuchteMedian: true, qualitaetAnzahl: true } },
    },
    take: 30,
  });
  return zeilen
    .map((z) => ({
      slug: z.slug,
      handelsname: z.handelsname,
      vertreiberName: z.vertreiber?.name ?? null,
      qualitaet: z.kennwerte?.qualitaetMittel ?? null,
      restfeuchte: z.kennwerte?.restfeuchteMedian ?? null,
      anzahl: z.kennwerte?.qualitaetAnzahl ?? 0,
      aktuell: z.id === aktuelleId,
    }))
    .sort((a, b) => b.anzahl - a.anzahl || a.handelsname.localeCompare(b.handelsname, "de"));
}
```

- [ ] **Step 4: Implement the components**

i18n `bluete.vertreiber` (de):

```ts
    vertreiber: {
      wahlTitel: "Deine Ware ist von",
      wahlHinweis: "Dieselbe Blüte gibt es von mehreren Vertreibern. Wähl den, von dem deine Charge stammt.",
      fehlt: "Vertreiber fehlt? Vorschlagen",
      unbekannt: "Vertreiber unbekannt",
      vergleichTitel: "Diese Blüte bei anderen Vertreibern",
      vergleichSatz: "Qualität, Restfeuchte und Frische hängen an Lagerung und Charge. Erfahrungen der Mitglieder, keine Empfehlung.",
      qualitaet: "Qualität {note} von 5",
      ohneQualitaet: "noch keine Qualitätsangabe",
      restfeuchte: "Restfeuchte {wert} %",
      anzahl: { one: "{anzahl} Bewertung", other: "{anzahl} Bewertungen" },
      zaehltBluete: "zählt für die Blüte {name}",
      zaehltVertreiber: "zählt für den Vertreiber {name}",
      von: "von {name}",
      angebautVon: "angebaut von {name}",
    },
```

(en: `wahlTitel: "Your product is from"`, `wahlHinweis: "The same flower comes from several distributors. Pick the one your batch is from."`, `fehlt: "Distributor missing? Suggest it"`, `unbekannt: "Distributor unknown"`, `vergleichTitel: "This flower from other distributors"`, `vergleichSatz: "Quality, moisture and freshness depend on storage and batch. Members' experiences, not a recommendation."`, `qualitaet: "Quality {note} of 5"`, `ohneQualitaet: "no quality rating yet"`, `restfeuchte: "Moisture {wert} %"`, `anzahl: { one: "{anzahl} rating", other: "{anzahl} ratings" }`, `zaehltBluete: "counts for the flower {name}"`, `zaehltVertreiber: "counts for the distributor {name}"`, `von: "from {name}"`, `angebautVon: "grown by {name}"`.)

Außerdem in `bluete.fakten`: `importeur` entfernen, `vertreiber: "Vertreiber"` / `"Distributor"` ergänzen; `hersteller` behält „Hersteller“ / „Manufacturer“ (jetzt der Anbauer).

`components/review/VertreiberWahl.tsx`:

```tsx
import Link from "next/link";

import { namenLinkKlassen } from "@/components/ui";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { VertreiberEintrag } from "@/lib/query/vertreiber";

type Props = { eintraege: readonly VertreiberEintrag[]; kultivarId: string; texte: Woerterbuch["bluete"]["vertreiber"] };

/**
 * Über der Bewertungsmaske (Spec 2026-10-13): von welchem Vertreiber die Ware stammt. Die Wahl ist ein
 * Link auf die Blütenseite dieses Handelsnamens, damit Charge und Kennwerte zur Ware passen.
 */
export function VertreiberWahl({ eintraege, kultivarId, texte }: Props) {
  const name = (e: VertreiberEintrag) => e.vertreiberName ?? texte.unbekannt;
  return (
    <nav aria-labelledby="vertreiber-wahl-titel" className="flex flex-col gap-4">
      <h3 id="vertreiber-wahl-titel" className="text-h3 text-text">
        {texte.wahlTitel}
      </h3>
      {eintraege.length > 1 ? (
        <>
          <p className="max-w-[68ch] text-small text-text-muted text-pretty">{texte.wahlHinweis}</p>
          <ul className="flex flex-wrap gap-2">
            {eintraege.map((e) => (
              <li key={e.slug}>
                {e.aktuell ? (
                  <span aria-current="page" className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-small font-medium text-accent-fg">
                    {name(e)}
                  </span>
                ) : (
                  <Link
                    prefetch={false}
                    href={`/blueten/${e.slug}#bewerten`}
                    className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-4 text-small text-text hover:text-accent-hover"
                  >
                    {name(e)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-body text-text">{eintraege[0] ? name(eintraege[0]) : texte.unbekannt}</p>
      )}
      <Link prefetch={false} href={`/vorschlagen?kultivar=${kultivarId}`} className={namenLinkKlassen()}>
        {texte.fehlt}
      </Link>
    </nav>
  );
}
```

`components/review/VertreiberVergleich.tsx`:

```tsx
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { VertreiberEintrag } from "@/lib/query/vertreiber";

type Props = { eintraege: readonly VertreiberEintrag[]; texte: Woerterbuch["bluete"]["vertreiber"]; sprache: Sprache };

/** „Diese Blüte bei anderen Vertreibern“ (Spec 2026-10-13): neutral, ohne Kauf- oder Apothekenlink (HWG). */
export function VertreiberVergleich({ eintraege, texte, sprache }: Props) {
  if (eintraege.length < 2) return null;
  return (
    <section aria-labelledby="vertreiber-vergleich-titel" className="flex flex-col gap-6">
      <h3 id="vertreiber-vergleich-titel" className="text-h3 text-text">
        {texte.vergleichTitel}
      </h3>
      <p className="max-w-[68ch] text-small text-text-muted text-pretty">{texte.vergleichSatz}</p>
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {eintraege.map((e) => (
          <li key={e.slug} className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-8">
            <span className="min-w-0">
              <span className="block text-body text-text wrap-break-word">{e.vertreiberName ?? texte.unbekannt}</span>
              <span className="block text-caption text-text-muted wrap-break-word">{e.handelsname}</span>
            </span>
            {e.qualitaet !== null ? (
              <BlattAnzeige note={e.qualitaet} text={t(texte.qualitaet, { note: formatiereZahl(e.qualitaet, 1, sprache) })} />
            ) : (
              <span className="text-small text-text-muted">{texte.ohneQualitaet}</span>
            )}
            <span className="text-small text-text-muted numeric">
              {e.restfeuchte !== null ? `${t(texte.restfeuchte, { wert: formatiereZahl(e.restfeuchte, 1, sprache) })} · ` : null}
              {mehrzahl(sprache, texte.anzahl, e.anzahl)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Wire detail query and page**

`lib/query/strains.ts` `ladeStrainDetail`: Select ergänzen um `kultivar: { select: { id: true, name: true, kennwerte: { select: { terpenMedian: true, geschmackMedian: true, gesamtnoteMedian: true, anzahl: true } } } }`, `vertreiber: { select: { name: true, land: true, website: true, vertreiberKennwerte: { select: { qualitaetMittel: true, restfeuchteMedian: true, anzahl: true } } } }`; `importeur` aus dem Select entfernen. Abbildung:

```ts
    kultivar: zeile.kultivar ? { id: zeile.kultivar.id, name: zeile.kultivar.name } : null,
    vertreiber: zeile.vertreiber ? { name: zeile.vertreiber.name, land: zeile.vertreiber.land, website: zeile.vertreiber.website } : null,
    hersteller: zeile.hersteller,
    kultivarKennwerte: zeile.kultivar?.kennwerte ?? null,
    vertreiberQualitaet: zeile.vertreiber?.vertreiberKennwerte ?? null,
```

und die Felder in `StrainDetail` so typisieren wie im Interfaces-Block.

`app/[lang]/blueten/[slug]/page.tsx`:
- `kernFakten`: Zeile Hersteller ersetzen durch `{ begriff: f.vertreiber, wert: strain.vertreiber?.name ?? ka }`.
- `produktFakten`: `f.hersteller` mit `strain.hersteller` (Anbauer) bleibt, `f.importeur`-Zeile ersetzen durch `{ begriff: f.vertreiber, wert: strain.vertreiber ? unternehmenWert(strain.vertreiber) : ka }`.
- Nach dem Laden: `const vertreiberListe = strain.kultivar ? await ladeVertreiberDerBluete(strain.kultivar.id, strain.id).catch((fehler: unknown) => { unstable_rethrow(fehler); console.error("ladeVertreiberDerBluete fehlgeschlagen", fehler); return []; }) : [];` — in das bestehende `Promise.all` mit `ladeFreieBudpics` und `aehnlichImAroma` aufnehmen.
- `erkundungsDaten(...)`: als Kennwerte `strain.kultivarKennwerte ?? strain.kennwerte` übergeben (Aroma gilt der Blüte).
- Im Abschnitt `#bewerten`, nur im Zweig `mitglied?.freigegeben`, vor `<BewertungsFormular`: `{strain.kultivar ? <div className="mt-8"><VertreiberWahl eintraege={vertreiberListe} kultivarId={strain.kultivar.id} texte={w.bluete.vertreiber} /></div> : null}`.
- `BewertungsFormular` bekommt `zuordnung={{ bluete: strain.kultivar?.name ?? strain.handelsname, vertreiber: strain.vertreiber?.name ?? null }}`.
- Direkt nach `{angabenZurBluete}`: `<div className={SEKTION}><VertreiberVergleich eintraege={vertreiberListe} texte={w.bluete.vertreiber} sprache={sprache} /></div>` nur, wenn `vertreiberListe.length > 1`.
- `Titelblatt`: neue optionale Props `vertreiberZeile?: string` und `herstellerZeile?: string`, gerendert unter dem Kultivarnamen als `<p className="text-body text-text-muted">`. Werte: `t(w.bluete.vertreiber.von, { name: strain.vertreiber.name })` und `t(w.bluete.vertreiber.angebautVon, { name: strain.hersteller.name })`, jeweils nur wenn vorhanden.

`components/review/BewertungsFormular.tsx`: Prop `zuordnung?: { bluete: string; vertreiber: string | null }` annehmen und an `AromaErkundung` durchreichen.

`components/review/AromaErkundung.tsx`: Prop `zuordnung` annehmen. In den Schritten Overall und Terpz (Titel `texte.aroma.erkundung.overall` / `terpz`) unter den Schritt-Titel, wenn `zuordnung` gesetzt ist, `<p className="text-caption text-text-muted">{t(texte.aroma.zuordnung.bluete, { name: zuordnung.bluete })}</p>`; im Schritt `dieseCharge` entsprechend `zuordnung.vertreiber ? t(texte.aroma.zuordnung.vertreiber, { name: zuordnung.vertreiber }) : texte.aroma.zuordnung.vertreiberUnbekannt`. Die drei Texte über `aromaTexte(w, sprache)` reichen: dort `zuordnung: { bluete: w.bluete.vertreiber.zaehltBluete, vertreiber: w.bluete.vertreiber.zaehltVertreiber, vertreiberUnbekannt: w.bluete.vertreiber.unbekannt }` ergänzen (die Funktion steht in der Datei, die `aromaTexte` exportiert; `grep -rn "export function aromaTexte" lib components`).

- [ ] **Step 6: Run tests**

Run: `npx tsx --test tests/vertreiber-bluete.test.ts`, `npm test`, `npm run typecheck`, `npx eslint app components lib --quiet`
Expected: grün.

- [ ] **Step 7: Commit**

```bash
git add -A lib components app tests
git commit -m "feat: Bluetenseite mit Vertreiber-Wahl, Vergleich je Vertreiber und Zuordnung der Bewertungsteile"
```

---

### Task 6: Vorschlag und Admin mit Kultivar, Vertreiber, Hersteller

**Files:**
- Modify: `lib/vorschlag-eingabe.ts`, `app/[lang]/vorschlagen/page.tsx`, `app/[lang]/vorschlagen/aktionen.ts`, `app/[lang]/admin/vorschlag-aktionen.ts`, `lib/query/vorschlaege.ts`, `components/admin/BlueteVorschlaege.tsx`, `components/admin/BlueteFreigabe.tsx`, `lib/i18n/de.ts`, `lib/i18n/en.ts`
- Test: `tests/vorschlag-vertreiber.test.ts`

**Interfaces:**
- Consumes: `SortenVorschlag.vertreiber`, `.kultivarId`, `Kultivar` (Task 1).
- Produces: Vorschlags-Eingabe mit Feldern `vertreiber: string | null`, `hersteller: string | null` (Anbauer), `kultivarId: string | null`; Freigabe-Eingabe ebenso. `kultivarSichern(name: string): Promise<string>` in `app/[lang]/admin/vorschlag-aktionen.ts` (sucht ohne Groß-/Kleinschreibung, legt sonst an).

- [ ] **Step 1: Write the failing test**

Die Prüffunktionen heißen `blueteVorschlagPruefen(formular, terpenNamen)` (Mitgliederformular) und `blueteFreigabePruefen(...)` (Admin), beide liefern `PruefMeldung<T> = { ok: true; wert: T } | { ok: false; fehler: Meldung }`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { blueteVorschlagPruefen } from "@/lib/vorschlag-eingabe";

const vorschlagPruefen = (f: FormData) => blueteVorschlagPruefen(f, ["Myrcen"]);

const formular = (felder: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(felder)) f.set(k, v);
  return f;
};

test("Vorschlag: Vertreiber und Hersteller getrennt, Kultivar-Id aus dem Link", () => {
  const e = vorschlagPruefen(formular({ handelsname: "Citrus Sprizz 25/1", vertreiber: "Remexian", hersteller: "", kultivarId: "4a5761be-5783-43ea-8223-a9e58cc75af8", quelle: "Apotheke" }));
  assert.equal(e.ok, true);
  if (!e.ok) return;
  assert.equal(e.wert.vertreiber, "Remexian");
  assert.equal(e.wert.hersteller, null);
  assert.equal(e.wert.kultivarId, "4a5761be-5783-43ea-8223-a9e58cc75af8");
});

test("Vorschlag: kaputte Kultivar-Id fällt weg", () => {
  const e = vorschlagPruefen(formular({ handelsname: "X", kultivarId: "<x>", quelle: "Apotheke" }));
  assert.equal(e.ok && e.wert.kultivarId, null);
});

test("Freigabe legt Kultivar an und setzt vertreiberId", () => {
  const q = readFileSync("app/[lang]/admin/vorschlag-aktionen.ts", "utf8");
  assert.match(q, /kultivarSichern\(/);
  assert.match(q, /vertreiberId/);
});
```

Pflichtfelder, die die echte Prüfung verlangt (z. B. `quelle`), im Test nach dem Lesen der Funktion ergänzen.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/vorschlag-vertreiber.test.ts`
Expected: FAIL (`vertreiber`/`kultivarId` fehlen im Ergebnis).

- [ ] **Step 3: Implement**

`lib/vorschlag-eingabe.ts`: In beiden Ergebnistypen `vertreiber: string | null` und `kultivarId: string | null` ergänzen; Lesen mit `vertreiber: optional(formular.get("vertreiber"))`, `kultivarId: idOderNull(formular.get("kultivarId"))` und Hilfsfunktion:

```ts
/** Kultivar-Id aus dem Link „Vertreiber fehlt?“; alles außer einer UUID fällt weg. */
function idOderNull(roh: FormDataEntryValue | null): string | null {
  const wert = typeof roh === "string" ? roh.trim().toLowerCase() : "";
  return /^[0-9a-f-]{32,36}$/.test(wert) ? wert : null;
}
```

`app/[lang]/vorschlagen/page.tsx`: `searchParams.kultivar` lesen; ist es eine gültige Id, Kultivar laden (`prisma.kultivar.findUnique({ where: { id }, select: { id: true, name: true } })`) und im Formular `kultivarName` vorbelegen plus `<input type="hidden" name="kultivarId" value={id} />`. Feld „Hersteller“ umbenennen in „Vertreiber“ (`name="vertreiber"`), neues optionales Feld „Hersteller (Anbauer)“ (`name="hersteller"`) mit Hinweis aus i18n.

`app/[lang]/vorschlagen/aktionen.ts`: `vertreiber` und `kultivarId` in `sortenVorschlag.create`/`upsert` schreiben.

`app/[lang]/admin/vorschlag-aktionen.ts`:

```ts
/** Kultivar nach Name finden (COLLATE NOCASE) oder anlegen (Spec 2026-10-13). */
async function kultivarSichern(name: string): Promise<string> {
  const prisma = await getPrisma();
  const sauber = name.trim();
  const vorhanden = await prisma.kultivar.findFirst({ where: { name: sauber }, select: { id: true } });
  if (vorhanden) return vorhanden.id;
  return (await prisma.kultivar.create({ data: { name: sauber }, select: { id: true } })).id;
}
```

Bei der Freigabe: `const vertreiberId = w.vertreiber ? await herstellerSichern(w.vertreiber) : null;` (die bestehende Funktion legt ein Unternehmen an; ihren Namen in `unternehmenSichern` ändern und die Rolle für Vertreiber `IMPORTEUR` setzen), `const herstellerId = w.hersteller ? await unternehmenSichern(w.hersteller) : null;`, `const kultivarId = w.kultivarId ?? (await kultivarSichern(w.kultivarName ?? w.handelsname));` und in `strain.create` `vertreiberId`, `herstellerId`, `kultivarId` setzen.

`lib/query/vorschlaege.ts`: `vertreiber: z.vertreiber` mitliefern; `herstellerNamen()` umbenennen in `unternehmenNamen()` (Datalist für beide Felder).

`components/admin/BlueteVorschlaege.tsx` und `BlueteFreigabe.tsx`: Felder Vertreiber (Pflicht für Freigabe nicht nötig) und Hersteller getrennt, beide mit `list={unternehmenListe}`; Vorbelegung `v.vertreiber`, `v.hersteller`.

i18n: Feldtexte für Vorschlag und Admin: `vertreiber: "Vertreiber"`, `vertreiberHinweis: "Wer die Blüte in Deutschland vertreibt, steht auf der Packung."`, `hersteller: "Hersteller (Anbauer, optional)"`; en: `"Distributor"`, `"Who distributes the flower in Germany, as printed on the pack."`, `"Manufacturer (grower, optional)"`. Die bestehenden Schlüssel dafür mit `grep -n "hersteller" lib/i18n/de.ts` finden und dort ersetzen bzw. ergänzen.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/vorschlag-vertreiber.test.ts`, `npm test`, `npm run typecheck`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add -A lib components app tests
git commit -m "feat: Vorschlag und Freigabe mit Kultivar, Vertreiber und Hersteller"
```

---

### Task 7: Profil „Deine Vertreiber“ nach Chargenqualität

**Files:**
- Create via `git mv`: `lib/lieblingshersteller.ts` → `lib/lieblingsvertreiber.ts`, `lib/query/lieblingshersteller.ts` → `lib/query/lieblingsvertreiber.ts`, `components/profil/Lieblingshersteller.tsx` → `components/profil/Lieblingsvertreiber.tsx`, `tests/hersteller-rangliste.test.ts` → `tests/vertreiber-rangliste.test.ts`
- Modify: `lib/profil-typen.ts` (`HerstellerRang` → `VertreiberRang`), `app/[lang]/profil/page.tsx`, `lib/i18n/de.ts`, `lib/i18n/en.ts`

**Interfaces:**
- Consumes: `qualitaetAusBeschaffenheit` (Task 2), `parseBeschaffenheit`.
- Produces: `vertreiberRangliste(zeilen: readonly { vertreiberId: string | null; vertreiber: string | null; qualitaet: number | null }[], hoechstens = 5): VertreiberRang[]`; `ladeLieblingsvertreiber(mitgliedId): Promise<VertreiberRang[]>`; `Lieblingsvertreiber({ daten, texte, sprache })`; Typ `VertreiberRang = { id: string; name: string; mittel: number; anzahl: number }`. Teilprojekt B importiert `Lieblingsvertreiber` und `ladeLieblingsvertreiber` unter diesen Namen.

- [ ] **Step 1: Update the test (failing)**

In `tests/vertreiber-rangliste.test.ts` Importe auf die neuen Namen umstellen und die Rechentests so fassen:

```ts
test("Rangliste: bester Qualitäts-Schnitt zuerst, Bewertungen ohne Qualität zählen nicht", () => {
  const r = vertreiberRangliste([
    { vertreiberId: "a", vertreiber: "Aurora", qualitaet: 4 },
    { vertreiberId: "a", vertreiber: "Aurora", qualitaet: null },
    { vertreiberId: "b", vertreiber: "Bedrocan", qualitaet: 4.5 },
    { vertreiberId: null, vertreiber: null, qualitaet: 5 },
  ]);
  assert.deepEqual(r, [
    { id: "b", name: "Bedrocan", mittel: 4.5, anzahl: 1 },
    { id: "a", name: "Aurora", mittel: 4, anzahl: 1 },
  ]);
});
```

Die Komponententests: `Lieblingsvertreiber`, Link `href="/blueten?vertreiber=abc-1"`, Zeilentext aus `texte.vertreiberZeile`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/vertreiber-rangliste.test.ts`
Expected: FAIL (Module fehlen nach dem Umbenennen der Tests).

- [ ] **Step 3: Implement**

`lib/lieblingsvertreiber.ts`: Funktion wie bisher, aber Eingabe `qualitaet: number | null`; Zeilen mit `qualitaet === null` oder ohne Id/Name überspringen; Summe über `qualitaet`. Kommentar: „Deine Vertreiber (Spec 2026-10-13): Qualitäts-Schnitt deiner Chargen je Vertreiber. Privat, keine Werbung (HWG).“

`lib/query/lieblingsvertreiber.ts`: Select `beschaffenheit: true, strain: { select: { vertreiber: { select: { id: true, name: true } } } }`; Abbildung `qualitaet: qualitaetAusBeschaffenheit(parseBeschaffenheit(z.beschaffenheit))`.

`components/profil/Lieblingsvertreiber.tsx`: Komponente umbenennen, Link `/blueten?vertreiber=${h.id}`, Texte `texte.vertreiberFehler`, `texte.vertreiberLeer`, `texte.vertreiberZeile`.

`app/[lang]/profil/page.tsx`: Importe und Aufruf umstellen; Feld `id="vertreiber"`, `titel={texte.vertreiberTitel}`, `kopf={texte.koepfe.vertreiber}`.

i18n `profil` (de): `vertreiberTitel: "Deine Vertreiber"`, `vertreiberZeile: "Qualität {note} von 5"`, `vertreiberLeer: "Sobald du eine Charge mit Qualität bewertest, steht hier ihr Vertreiber."`, `vertreiberFehler` (Wert vom bisherigen `herstellerFehler` übernehmen, „Hersteller“ durch „Vertreiber“ ersetzen), `koepfe.vertreiber: { vor: "Deine", betont: "Vertreiber", schlagwort: "wer liefert" }`; en entsprechend („Your distributors“, „Quality {note} of 5“, „Once you rate a batch's quality, its distributor shows up here.“). Die `hersteller*`-Schlüssel im Profil entfallen. In `profilNotizen` (Randnotiz „Hersteller“) Wort auf „Vertreiber“ / „distributors“ ändern.

- [ ] **Step 4: Run tests**

Run: `npm test`, `npm run typecheck`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add -A lib components app tests
git commit -m "feat: Profil zeigt deine Vertreiber nach Qualitaet deiner Chargen"
```

---

### Task 8: Startseite mitziehen

**Files:**
- Modify: `components/rangliste/RanglistenKarte.tsx`, `components/story/AromaSektion.tsx`, `components/story/NeuesterEintrag.tsx` (falls dort ein Firmenname steht), `lib/query/rangliste.ts`, `lib/kapitel-start.ts` (falls das Kapitel einen Firmennamen zeigt)
- Test: `tests/startseite-vertreiber.test.ts`

**Interfaces:**
- Consumes: `vertreiber`-Felder aus Task 4.
- Produces: Kartenzeile „<Kultivar> · <Vertreiber>“ über `w.start.bluetenZeile = "{bluete} · {vertreiber}"` (en gleich).

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Startseite nennt Blüte und Vertreiber, nie mehr den Hersteller als Firma", () => {
  for (const datei of ["components/rangliste/RanglistenKarte.tsx", "components/story/AromaSektion.tsx"]) {
    const q = readFileSync(datei, "utf8");
    assert.doesNotMatch(q, /herstellerName|\.hersteller\b/, datei);
  }
  assert.match(readFileSync("components/rangliste/RanglistenKarte.tsx", "utf8"), /bluetenZeile/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/startseite-vertreiber.test.ts`
Expected: FAIL (`bluetenZeile` fehlt).

- [ ] **Step 3: Implement**

`lib/query/rangliste.ts`: zusätzlich `kultivar: { select: { name: true } }` lesen, Feld `bluete: s.kultivar?.name ?? s.handelsname`.
`RanglistenKarte.tsx`: Unterzeile `t(w.start.bluetenZeile, { bluete: e.bluete, vertreiber: e.vertreiber ?? w.bluete.vertreiber.unbekannt })` statt Herstellername.
`AromaSektion.tsx`: nach Task 4 schon `vertreiberName`; prüfen, dass das Fakt-Label „Vertreiber“ lautet.
`NeuesterEintrag.tsx` und das Kapitel: `grep -n "hersteller" components/story/NeuesterEintrag.tsx lib/kapitel-start.ts`; steht dort ein Firmenname, gleich umstellen.
i18n: `start.bluetenZeile: "{bluete} · {vertreiber}"` in de und en.

- [ ] **Step 4: Run tests**

Run: `npm test`, `npm run typecheck`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add -A lib components tests
git commit -m "feat: Startseite nennt Bluete und Vertreiber"
```

---

### Task 9: Remote einspielen, Kennwerte nachrechnen, live prüfen

**Files:**
- Modify: `app/[lang]/admin/aktionen.ts`, Admin-Seite (Knopf), `lib/i18n/de.ts`, `lib/i18n/en.ts`, `tests/kennwerte-fortschreiben.test.ts`

- [ ] **Step 1: Zählabfrage vorher**

```bash
npx wrangler d1 execute cn-medcan-db --remote --command "select (select count(*) from strains) s, (select count(*) from strains where hersteller_id is not null) h, (select count(*) from strains where importeur_id is not null) i, (select count(*) from reviews) r"
```

Werte notieren (Stand 2026-10-13: 710 aktiv, 655 mit Hersteller, 64 mit Importeur, 27 Bewertungen).

- [ ] **Step 2: Migration und Constraints einspielen**

```bash
npx wrangler d1 execute cn-medcan-db --remote --file migrations/0021_vertreiber_kultivar.sql
npx wrangler d1 execute cn-medcan-db --remote --file db/constraints.sql
```

- [ ] **Step 3: Zählabfrage nachher**

```bash
npx wrangler d1 execute cn-medcan-db --remote --command "select (select count(*) from strains where kultivar_id is null) ohne_kultivar, (select count(*) from strains where vertreiber_id is not null) mit_vertreiber, (select count(*) from kultivare) kultivare, (select count(*) from strains where importeur_id is not null) imp"
```

Erwartet: `ohne_kultivar = 0`, `mit_vertreiber` ≥ 655, `kultivare` ≈ 402 + Handelsnamen ohne Kultivarnamen, `imp = 0`.

- [ ] **Step 4: Admin-Aktion „Kennwerte neu rechnen“**

Kultivar- und Vertreiber-Kennwerte entstehen sonst erst beim nächsten Speichern. Deshalb eine Admin-Aktion in
`app/[lang]/admin/aktionen.ts`, die für jeden Handelsnamen mit freigegebenen Bewertungen `kennwerteFortschreiben`
ruft (Stand 27 Bewertungen, liegt im CPU-Limit):

```ts
/** Nach 0021 und bei Bedarf: Kennwerte aller bewerteten Handelsnamen neu rechnen (nur Betreiber). */
export async function kennwerteNeuRechnen(): Promise<{ ok: true; anzahl: number } | { ok: false }> {
  // Dieselbe Betreiber-Prüfung wie die übrigen Aktionen dieser Datei verwenden (am Dateianfang nachsehen).
  const prisma = await getPrisma();
  const ids = await prisma.review.findMany({ where: { freigegeben: true }, select: { strainId: true }, distinct: ["strainId"] });
  for (const { strainId } of ids) await kennwerteFortschreiben(strainId);
  revalidiereSprachen("/", "layout");
  return { ok: true, anzahl: ids.length };
}
```

Knopf im Admin-Bereich (Formular mit `action={kennwerteNeuRechnen}`), Text `admin.kennwerteNeu: "Kennwerte neu rechnen"` / `"Recalculate metrics"`.
Test in `tests/kennwerte-fortschreiben.test.ts` ergänzen:

```ts
test("Admin-Aktion rechnet alle Kennwerte neu und prüft den Betreiber", () => {
  const q = readFileSync("app/[lang]/admin/aktionen.ts", "utf8");
  const teil = q.slice(q.indexOf("export async function kennwerteNeuRechnen"));
  assert.match(teil, /kennwerteFortschreiben\(strainId\)/);
  assert.match(teil.slice(0, 400), /Erforderlich\(|ADMIN/);
});
```

Prüfen, wie `revalidiereSprachen` in `app/[lang]/admin/aktionen.ts` heute gerufen wird, und dieselbe Form nehmen.
Nach dem Deploy die Aktion einmal ausführen.

- [ ] **Step 5: Push, Build abwarten, live prüfen**

Nach `git push origin main` einmal nach ~12 Minuten den Check-Run „Workers Builds: cn-medcan“ des Commits ansehen (`gh api repos/bratzi/cn-medcan/commits/<sha>/check-runs`). Dann live (Browser-MCP, angemeldet als Betreiber), jeweils frisch mit Query geladen:
- Admin: „Kennwerte neu rechnen“ einmal ausführen.
- `/blueten?vertreiber=<id von avaay>` und `/blueten?hersteller=<dieselbe id>` liefern dieselbe Trefferzahl.
- Blütenseite eines Black-Cherry-Punch-Handelsnamens: Zeile „von …“, Vertreiber-Wahl mit mehreren Vertreibern, Abschnitt „Diese Blüte bei anderen Vertreibern“, Achse Frische ohne Sweet-Spot-Leuchten, Vermerke „zählt für …“.
- Profil: „Deine Vertreiber“.
- Startseite: Ranglisten-Karte mit „Blüte · Vertreiber“.
- 494 px und 1440 px, hell und dunkel: kein Querscroll.

- [ ] **Step 6: HANDOFF und Commit**

HANDOFF-Abschnitt „Session <n>: Vertreiber umgesetzt“ mit Commits, Live-Befund und offenen Punkten; committen und pushen.
