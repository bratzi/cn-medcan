# Blüte vorschlagen: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Angemeldete Mitglieder schlagen fehlende Blüten vor, der Betreiber gibt sie im Admin frei (legt damit die Blüte im Katalog an), lehnt ab oder ordnet zu, und die Vorschlagenden bekommen eine Benachrichtigung im Mitgliederbereich.

**Architecture:** Zwei neue Tabellen (`sorten_vorschlaege`, `benachrichtigungen`) per D1-Migration. Reine Prüf- und Hilfsfunktionen in `lib/` (getestet mit `node:test`), Abfragen in `lib/query/`, Schreibzugriffe in Server Actions mit `mitgliedErforderlich()`/`adminErforderlich()`. Neue Blüten und Hersteller bekommen dieselbe deterministische Id (uuid v5) wie `scripts/stamm/sql-erzeugen.py`, damit ein späterer Import nichts doppelt.

**Tech Stack:** Next.js 16.3 App Router (searchParams sind ein Promise), React 19.2, Prisma 7 mit D1-Adapter (keine Transaktionen), zod 4, Tailwind v4, Tests mit `tsx --test` (`npm test`).

**Spec:** `docs/superpowers/specs/2026-09-25-bluete-vorschlagen-design.md`

## Global Constraints

- Alles kostenlos: kein Mailversand, keine neuen Pakete (`npm install` verboten, siehe Memory „Netzwerk schonen“).
- Kein lokaler Dev-Server, kein `next build`. Lokal nur `npm test`, `npm run typecheck`, `npm run lint`, `npm run farben`, `wrangler d1 … --local`.
- D1 hat keine Transaktionen; Eindeutigkeit über Unique-Index, nie „erst prüfen, dann schreiben“ als Garantie. `$transaction` bringt nichts (db/README.md).
- Höchstens 50 D1-Abfragen je Request (Free Plan); jede Listenabfrage hat ein `take`.
- UI nach `.claude/skills/ui-design-engine.md`: Abstände nur 8er-Leiter (Tailwind gerade Stufen), nur semantische Farbtokens, kein `dark:`, Pillen `rounded-full` für Buttons/Badges, eine gefüllte Primäraktion je Ansicht, `font-hand` nie unter 32 px und nie für Handelsnamen, Formulare gedruckt.
- Texte: Du-Form, kein Geviertstrich (U+2014) und kein Gedankenstrich (U+2013) als Trenner in neuen Texten, keine Wirkungs- oder Preisangaben (HWG).
- Wortwahl im Auftritt „Blüte“, im Code `SortenVorschlag`. URL der Blütenseiten bleibt `/produkte/<slug>`.
- Id-Namensraum: `6f1c2b8e-2d8a-4f4e-9a57-5b7c1e2d3a40`; Blüte `uuid5(NS, "s:" + slug)`, Hersteller `uuid5(NS, "u:" + schluessel)`.
- `MAX_OFFENE_VORSCHLAEGE = 5` je Mitglied; Notiz max. 500 Zeichen; THC 0 bis 40 %, CBD 0 bis 30 % beim Vorschlag.
- Nach jeder Migration `db/constraints.sql` erneut ausführen (lokal und remote).

## Review Focus

1. Handelsname aus nur Sonderzeichen („&&&“) ergibt einen leeren Slug: Vorschlag muss mit verständlicher Meldung abgelehnt werden, nie ein Satz mit leerem `schluessel`. Test in Task 3.
2. Zwei Mitglieder schlagen dieselbe Blüte in verschiedener Schreibung vor („Apples & Bananas“ / „apples-bananas“): beide landen in einer Gruppe im Admin, Freigabe benachrichtigt beide. Test in Task 3 (`vorschlaegeBuendeln`).
3. Betreiber korrigiert in der Freigabe den Handelsnamen so, dass er einer vorhandenen Blüte entspricht: keine zweite Blüte, sondern Meldung mit Hinweis auf „Zuordnen“. Test der reinen Konfliktfunktion in Task 3 (`freigabeKonflikt`).
4. Doppelklick auf „Freigeben“ bzw. Blüte schon per Import angelegt: kein Absturz, kein zweiter Satz; die vorhandene Blüte wird genommen. Test der Konfliktfunktion (gleiche Id = kein Konflikt) in Task 3.
5. Quelle mit `javascript:`-URL: wird nie als Link ausgegeben. Test in Task 3 (`quelleAlsLink`).

---

## Dateiübersicht

| Datei | Verantwortung |
|---|---|
| `prisma/schema.prisma` (ändern) | Modelle `SortenVorschlag`, `Benachrichtigung`, Relationen an `Mitglied` und `Strain` |
| `migrations/0006_sorten_vorschlaege.sql` (neu) | Tabellen und Indizes |
| `db/enums.ts` (ändern) | `VORSCHLAG_STATUS`, `BENACHRICHTIGUNG_ARTEN` |
| `db/constraints.sql` (ändern) | Trigger für beide Wertelisten |
| `lib/stamm-id.ts` (neu) | Slug, Herstellerschlüssel, uuid v5 wie das Importskript |
| `lib/vorschlag-eingabe.ts` (neu) | Prüfung Vorschlag und Freigabe, Bündeln, Vorbelegen, Konflikt, Quelle als Link |
| `lib/benachrichtigung.ts` (neu) | Texte der Benachrichtigungen, Schreiben (eine Stelle, später auch Mail) |
| `lib/query/vorschlaege.ts` (neu) | Lesen: Terpennamen, vorhandene Blüte, eigene/offene Vorschläge |
| `lib/query/benachrichtigungen.ts` (neu) | Lesen: ungelesene Anzahl, Liste |
| `app/vorschlagen/page.tsx`, `app/vorschlagen/aktionen.ts` (neu) | Seite und Server Action für Mitglieder |
| `components/vorschlag/BlueteVorschlagFormular.tsx` (neu) | Formular (Client) |
| `app/admin/vorschlag-aktionen.ts` (neu) | Freigeben, Ablehnen, Zuordnen |
| `components/admin/BlueteVorschlaege.tsx`, `BlueteFreigabe.tsx` (neu) | Admin-Abschnitt |
| `app/api/benachrichtigungen/route.ts` (neu) | `GET` ungelesene Anzahl |
| `components/layout/KontoZaehler.tsx` (neu), `components/layout/Kopf.tsx` (ändern) | Zähler an der Konto-Pille |
| `app/mitglied/page.tsx`, `app/mitglied/aktionen.ts` (ändern), `components/mitglied/GelesenMarkieren.tsx` (neu) | Benachrichtigungen, Meine Vorschläge |
| `app/produkte/page.tsx`, `components/umfrage/VorschlagFormular.tsx` (ändern) | Einstiege |
| `tests/stamm-id.test.ts`, `tests/vorschlag-eingabe.test.ts`, `tests/benachrichtigung.test.ts`, `tests/bluete-vorschlagen.test.ts` (neu) | Tests |

---

### Task 1: Datenmodell und Migration

**Files:**
- Modify: `prisma/schema.prisma` (Modelle `Mitglied` Z. 369–399, `Strain` Z. 78–130, neue Modelle am Dateiende)
- Create: `migrations/0006_sorten_vorschlaege.sql`
- Modify: `db/enums.ts` (am Ende)
- Modify: `db/constraints.sql` (am Ende)
- Test: `tests/bluete-vorschlagen.test.ts`

**Interfaces:**
- Produces: Prisma-Delegates `prisma.sortenVorschlag`, `prisma.benachrichtigung`; `VORSCHLAG_STATUS`, `type VorschlagStatus`, `BENACHRICHTIGUNG_ARTEN`, `type BenachrichtigungArt` aus `@/db/enums`.

- [ ] **Step 1: Failing test schreiben** (`tests/bluete-vorschlagen.test.ts`)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { BENACHRICHTIGUNG_ARTEN, VORSCHLAG_STATUS } from "@/db/enums";

const lies = (pfad: string) => readFileSync(pfad, "utf8");

test("Trigger kennen genau die Wertelisten aus db/enums.ts", () => {
  const sql = lies("db/constraints.sql");
  const status = VORSCHLAG_STATUS.map((w) => `'${w}'`).join(",");
  const arten = BENACHRICHTIGUNG_ARTEN.map((w) => `'${w}'`).join(",");
  assert.match(sql, new RegExp(`sorten_vorschlaege_insert_chk[\\s\\S]*NEW\\.status not in \\(${status}\\)`));
  assert.match(sql, new RegExp(`sorten_vorschlaege_update_chk[\\s\\S]*NEW\\.status not in \\(${status}\\)`));
  assert.match(sql, new RegExp(`benachrichtigungen_insert_chk[\\s\\S]*NEW\\.art not in \\(${arten}\\)`));
});

test("Migration 0006 legt beide Tabellen samt Unique-Index an", () => {
  const sql = lies("migrations/0006_sorten_vorschlaege.sql");
  assert.match(sql, /CREATE TABLE "sorten_vorschlaege"/);
  assert.match(sql, /CREATE TABLE "benachrichtigungen"/);
  assert.match(sql, /CREATE UNIQUE INDEX "sorten_vorschlaege_mitglied_id_schluessel_key"/);
  assert.doesNotMatch(sql, /d1_migrations/);
});
```

- [ ] **Step 2: Test laufen lassen, muss scheitern**

Run: `npm test 2>&1 | tail -20`
Expected: FAIL (Import `VORSCHLAG_STATUS` fehlt bzw. Datei fehlt).

- [ ] **Step 3: Wertelisten in `db/enums.ts` ergänzen** (am Dateiende)

```ts
/**
 * Stand eines Blütenvorschlags (Spec Blüte vorschlagen 3.1). OFFEN wartet auf
 * den Betreiber; FREIGEGEBEN traegt die strainId der Bluete im Katalog.
 */
export const VORSCHLAG_STATUS = ["OFFEN", "FREIGEGEBEN", "ABGELEHNT"] as const;
export type VorschlagStatus = (typeof VORSCHLAG_STATUS)[number];

/** Arten von Benachrichtigungen im Mitgliederbereich. Erweiterbar (Umfragen, Mail). */
export const BENACHRICHTIGUNG_ARTEN = ["VORSCHLAG_FREIGEGEBEN", "VORSCHLAG_ABGELEHNT"] as const;
export type BenachrichtigungArt = (typeof BENACHRICHTIGUNG_ARTEN)[number];
```

- [ ] **Step 4: Schema ergänzen**

In `model Strain` nach `umfrageOptionen    UmfrageOption[]` einfügen:

```prisma
  sortenVorschlaege SortenVorschlag[]
```

In `model Mitglied` nach `reviews     Review[]` einfügen:

```prisma
  sortenVorschlaege  SortenVorschlag[]
  benachrichtigungen Benachrichtigung[]
```

Am Dateiende anfügen:

```prisma
// ---------------------------------------------------------------------------
//  Bluete vorschlagen (Spec 2026-09-25)
// ---------------------------------------------------------------------------

/// Ein Mitglied schlaegt eine Bluete vor, die im Katalog fehlt. Die Freigabe
/// durch den Betreiber legt daraus einen Strain an. Nicht zu verwechseln mit
/// UmfrageVorschlag (dort wird eine vorhandene Bluete fuer eine Runde genannt).
model SortenVorschlag {
  id         String   @id @default(uuid())
  mitgliedId String   @map("mitglied_id")
  mitglied   Mitglied @relation(fields: [mitgliedId], references: [id], onDelete: Cascade)

  handelsname  String
  /// Slug des Handelsnamens nach der Regel aus scripts/stamm/sql-erzeugen.py.
  /// Buendelt gleiche Vorschlaege verschiedener Mitglieder.
  schluessel   String
  hersteller   String?
  kultivarName String? @map("kultivar_name")
  kultivarTyp  String? @map("kultivar_typ")
  thcProzent   Float?  @map("thc_prozent")
  cbdProzent   Float?  @map("cbd_prozent")
  /// JSON-Liste von bis zu 3 Terpennamen in Rangfolge.
  terpene      String?
  quelle       String
  notiz        String?

  /// Werte nach VORSCHLAG_STATUS in db/enums.ts, geprueft in db/constraints.sql.
  status      String  @default("OFFEN")
  strainId    String? @map("strain_id")
  strain      Strain? @relation(fields: [strainId], references: [id], onDelete: SetNull)
  begruendung String?

  erstelltAm    DateTime  @default(now()) @map("erstellt_am")
  entschiedenAm DateTime? @map("entschieden_am")

  /// Ein Mitglied schlaegt dieselbe Bluete nur einmal vor - von der Datenbank erzwungen.
  @@unique([mitgliedId, schluessel])
  @@index([status, schluessel])
  @@index([mitgliedId])
  @@index([strainId])
  @@map("sorten_vorschlaege")
}

/// Nachricht an ein Mitglied im Mitgliederbereich. Spaeter liest ein
/// Mailversand genau diese Saetze (lib/benachrichtigung.ts).
model Benachrichtigung {
  id         String   @id @default(uuid())
  mitgliedId String   @map("mitglied_id")
  mitglied   Mitglied @relation(fields: [mitgliedId], references: [id], onDelete: Cascade)

  /// Werte nach BENACHRICHTIGUNG_ARTEN in db/enums.ts.
  art       String
  text      String
  /// Immer ein interner Pfad, vom Server gesetzt.
  link      String?
  gelesenAm DateTime? @map("gelesen_am")

  erstelltAm DateTime @default(now()) @map("erstellt_am")

  @@index([mitgliedId, gelesenAm])
  @@map("benachrichtigungen")
}
```

- [ ] **Step 5: Migration schreiben** (`migrations/0006_sorten_vorschlaege.sql`)

```sql
-- 0006_sorten_vorschlaege
--
-- Bluete vorschlagen (Spec 2026-09-25): Vorschlaege der Mitglieder und
-- Benachrichtigungen im Mitgliederbereich. Nur neue Tabellen, kein Umbau.
--
-- WICHTIG: Danach db/constraints.sql erneut ausfuehren (Trigger der neuen Tabellen).

-- CreateTable
CREATE TABLE "sorten_vorschlaege" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mitglied_id" TEXT NOT NULL,
    "handelsname" TEXT NOT NULL,
    "schluessel" TEXT NOT NULL,
    "hersteller" TEXT,
    "kultivar_name" TEXT,
    "kultivar_typ" TEXT,
    "thc_prozent" REAL,
    "cbd_prozent" REAL,
    "terpene" TEXT,
    "quelle" TEXT NOT NULL,
    "notiz" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFFEN',
    "strain_id" TEXT,
    "begruendung" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entschieden_am" DATETIME,
    CONSTRAINT "sorten_vorschlaege_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sorten_vorschlaege_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "benachrichtigungen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mitglied_id" TEXT NOT NULL,
    "art" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "link" TEXT,
    "gelesen_am" DATETIME,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "benachrichtigungen_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "sorten_vorschlaege_status_schluessel_idx" ON "sorten_vorschlaege"("status", "schluessel");

-- CreateIndex
CREATE INDEX "sorten_vorschlaege_mitglied_id_idx" ON "sorten_vorschlaege"("mitglied_id");

-- CreateIndex
CREATE INDEX "sorten_vorschlaege_strain_id_idx" ON "sorten_vorschlaege"("strain_id");

-- CreateIndex
CREATE UNIQUE INDEX "sorten_vorschlaege_mitglied_id_schluessel_key" ON "sorten_vorschlaege"("mitglied_id", "schluessel");

-- CreateIndex
CREATE INDEX "benachrichtigungen_mitglied_id_gelesen_am_idx" ON "benachrichtigungen"("mitglied_id", "gelesen_am");
```

- [ ] **Step 6: Trigger an `db/constraints.sql` anhängen**

```sql

-- ---------------------------------------------------------------------------
--  sorten_vorschlaege / benachrichtigungen (Spec Bluete vorschlagen)
-- ---------------------------------------------------------------------------
drop trigger if exists sorten_vorschlaege_insert_chk;
create trigger sorten_vorschlaege_insert_chk
before insert on sorten_vorschlaege
for each row
begin
  select case when NEW.status not in ('OFFEN','FREIGEGEBEN','ABGELEHNT') then raise(abort, 'sorten_vorschlaege.status: unbekannter Wert') end;
  select case when NEW.kultivar_typ is not null and NEW.kultivar_typ not in ('INDICA','SATIVA','HYBRID','RUDERALIS') then raise(abort, 'sorten_vorschlaege.kultivar_typ: unbekannter Wert') end;
  select case when length(NEW.schluessel) = 0 then raise(abort, 'sorten_vorschlaege.schluessel: leer') end;
end;

drop trigger if exists sorten_vorschlaege_update_chk;
create trigger sorten_vorschlaege_update_chk
before update on sorten_vorschlaege
for each row
begin
  select case when NEW.status not in ('OFFEN','FREIGEGEBEN','ABGELEHNT') then raise(abort, 'sorten_vorschlaege.status: unbekannter Wert') end;
  select case when NEW.kultivar_typ is not null and NEW.kultivar_typ not in ('INDICA','SATIVA','HYBRID','RUDERALIS') then raise(abort, 'sorten_vorschlaege.kultivar_typ: unbekannter Wert') end;
end;

drop trigger if exists benachrichtigungen_insert_chk;
create trigger benachrichtigungen_insert_chk
before insert on benachrichtigungen
for each row
begin
  select case when NEW.art not in ('VORSCHLAG_FREIGEGEBEN','VORSCHLAG_ABGELEHNT') then raise(abort, 'benachrichtigungen.art: unbekannter Wert') end;
end;
```

- [ ] **Step 7: Client erzeugen, Schema prüfen, Tests grün**

Run: `npx prisma validate && npm run db:generate && npm test 2>&1 | tail -8 && npm run typecheck`
Expected: Schema valid, generate ok, alle Tests PASS, tsc ohne Fehler.

- [ ] **Step 8: Lokal anwenden und Diff gegenprüfen**

Run:
```bash
npm run db:migrate:local && npm run db:constraints:local
cp "$(ls .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite | grep -v metadata)" db/.migrate-diff.sqlite
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
rm db/.migrate-diff.sqlite
```
Expected: Migration angewendet; der Diff ist leer (bzw. nur `-- This is an empty migration.`). Zeigt er Unterschiede, die Migration daran angleichen, nicht das Schema.

- [ ] **Step 9: Commit (nicht pushen)**

```bash
git add prisma/schema.prisma migrations/0006_sorten_vorschlaege.sql db/enums.ts db/constraints.sql tests/bluete-vorschlagen.test.ts
git commit -m "feat: Datenmodell Bluete vorschlagen (sorten_vorschlaege, benachrichtigungen)"
```

---

### Task 2: Ids wie das Importskript (`lib/stamm-id.ts`)

**Files:**
- Create: `lib/stamm-id.ts`
- Test: `tests/stamm-id.test.ts`

**Interfaces:**
- Produces:
  - `slugAusName(name: string): string`
  - `unternehmensSchluessel(name: string): string | null`
  - `strainIdAusSlug(slug: string): Promise<string>`
  - `unternehmensIdAusSchluessel(schluessel: string): Promise<string>`

Die Referenzwerte stammen aus Python (`uuid.uuid5(NS, "s:" + slug)` bzw. `"u:" + key`) mit genau der Logik aus `scripts/stamm/sql-erzeugen.py` (`slug()` Z. 58, `firma()` Z. 76).

- [ ] **Step 1: Failing test** (`tests/stamm-id.test.ts`)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  slugAusName,
  strainIdAusSlug,
  unternehmensIdAusSchluessel,
  unternehmensSchluessel,
} from "@/lib/stamm-id";

test("slugAusName folgt scripts/stamm/sql-erzeugen.py", () => {
  assert.equal(slugAusName("Apples & Bananas"), "apples-bananas");
  assert.equal(slugAusName("Grüne Soße 22/1"), "gruene-sosse-22-1");
  assert.equal(slugAusName("  Ärger  "), "aerger");
  assert.equal(slugAusName("&&&"), "");
});

test("strainIdAusSlug ergibt dieselbe uuid5 wie Python", async () => {
  assert.equal(await strainIdAusSlug("apples-bananas"), "2d02638e-6813-508a-bef8-7e52e3349e92");
  assert.equal(await strainIdAusSlug("gruene-sosse-22-1"), "3d5bfe35-ab54-5b16-a89d-f668128add61");
  assert.equal(await strainIdAusSlug("aerger"), "e6bdf44a-5517-5909-9659-31e5d436ba24");
});

test("unternehmensSchluessel und Id wie firma() im Importskript", async () => {
  assert.equal(unternehmensSchluessel("Aurora Pharma GmbH"), "aurora");
  assert.equal(unternehmensSchluessel("Bedrocan International"), "bedrocan");
  assert.equal(unternehmensSchluessel("Tilray"), "tilray");
  assert.equal(unternehmensSchluessel("unbekannt"), null);
  assert.equal(unternehmensSchluessel("Nicht genannt"), null);
  assert.equal(unternehmensSchluessel("   "), null);
  assert.equal(await unternehmensIdAusSchluessel("aurora"), "077df828-700f-5a15-a477-488af42cc3f4");
  assert.equal(await unternehmensIdAusSchluessel("tilray"), "ed08922a-5136-55b3-8750-b1ba5aad8fee");
  assert.equal(await unternehmensIdAusSchluessel("bedrocan"), "6fe95d01-4deb-5ead-9614-1317775000db");
});
```

- [ ] **Step 2: Test laufen lassen, muss scheitern**

Run: `npx tsx --test tests/stamm-id.test.ts`
Expected: FAIL, Modul `@/lib/stamm-id` fehlt.

- [ ] **Step 3: Implementieren** (`lib/stamm-id.ts`)

```ts
/**
 * Ids fuer Katalogsaetze nach derselben Regel wie scripts/stamm/sql-erzeugen.py.
 *
 * Der Import schreibt `ON CONFLICT(id) DO UPDATE` und faengt nur Konflikte
 * auf der Id ab. Legt die Freigabe eines Vorschlags eine Bluete oder einen
 * Hersteller mit zufaelliger Id an, bricht ein spaeterer Import derselben
 * Bluete am Unique-Index (`strains.slug`, `unternehmen(name, rolle)`) ab.
 * Mit gleicher Id aktualisiert er stattdessen. Namensraum und Praefixe
 * ("s:", "u:") muessen deshalb exakt dem Skript entsprechen.
 */

const NAMENSRAUM = "6f1c2b8e-2d8a-4f4e-9a57-5b7c1e2d3a40";

const UMLAUTE: ReadonlyArray<[string, string]> = [
  ["ä", "ae"],
  ["ö", "oe"],
  ["ü", "ue"],
  ["ß", "ss"],
];

/** slug() aus dem Importskript: klein, Umlaute ausgeschrieben, sonst Bindestriche. */
export function slugAusName(name: string): string {
  let t = name.toLowerCase();
  for (const [a, b] of UMLAUTE) t = t.replaceAll(a, b);
  return t.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Schluessel aus firma(): Zusaetze wie GmbH/Pharma entfernt; "unbekannt" zaehlt nicht. */
export function unternehmensSchluessel(name: string): string | null {
  const klein = name.trim().toLowerCase();
  if (!klein || klein.startsWith("unbekannt") || klein.startsWith("nicht genannt")) return null;
  return klein.replace(/\s+(gmbh|pharma|pharmaceuticals|international)\b/g, "").trim() || null;
}

function hexZuBytes(hex: string): Uint8Array {
  const rein = hex.replaceAll("-", "");
  const bytes = new Uint8Array(rein.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(rein.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/** RFC 4122 Version 5 (SHA-1), wie Pythons uuid.uuid5. crypto.subtle gibt es in Workers und Node. */
async function uuid5(name: string): Promise<string> {
  const ns = hexZuBytes(NAMENSRAUM);
  const text = new TextEncoder().encode(name);
  const eingabe = new Uint8Array(ns.length + text.length);
  eingabe.set(ns);
  eingabe.set(text, ns.length);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-1", eingabe)).slice(0, 16);
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function strainIdAusSlug(slug: string): Promise<string> {
  return uuid5(`s:${slug}`);
}

export function unternehmensIdAusSchluessel(schluessel: string): Promise<string> {
  return uuid5(`u:${schluessel}`);
}
```

- [ ] **Step 4: Tests grün**

Run: `npx tsx --test tests/stamm-id.test.ts && npm run typecheck`
Expected: PASS, tsc ohne Fehler.

- [ ] **Step 5: Commit**

```bash
git add lib/stamm-id.ts tests/stamm-id.test.ts
git commit -m "feat: Ids fuer neue Blueten und Hersteller wie das Importskript (uuid5)"
```

---

### Task 3: Prüfung und reine Logik (`lib/vorschlag-eingabe.ts`)

**Files:**
- Create: `lib/vorschlag-eingabe.ts`
- Test: `tests/vorschlag-eingabe.test.ts`

**Interfaces:**
- Consumes: `slugAusName` (Task 2), `KULTIVAR_TYPEN`, `BESTRAHLUNGEN`, `type KultivarTyp`, `type Bestrahlung` aus `@/db/enums`.
- Produces:
  - `MAX_OFFENE_VORSCHLAEGE = 5`, `MAX_VORSCHLAG_NOTIZ = 500`, `MAX_VORSCHLAG_TERPENE = 3`, `MAX_FREIGABE_TERPENE = 5`
  - `type Pruef<T> = { ok: true; wert: T } | { ok: false; fehler: string }`
  - `type BlueteVorschlag = { handelsname: string; schluessel: string; hersteller: string | null; kultivarName: string | null; kultivarTyp: KultivarTyp | null; thcProzent: number | null; cbdProzent: number | null; terpene: string[]; quelle: string; notiz: string | null }`
  - `blueteVorschlagPruefen(formular: Lesbar, terpenNamen: readonly string[]): Pruef<BlueteVorschlag>` (Felder: `handelsname, hersteller, kultivarName, kultivarTyp, thc, cbd, terpen1..terpen3, quelle, notiz`)
  - `type BlueteFreigabe = { vorschlagSchluessel: string; handelsname: string; slug: string; kultivarName: string | null; kultivarTyp: KultivarTyp; thcMin: number; thcMax: number; cbdMin: number; cbdMax: number; hersteller: string | null; terpene: string[]; bestrahlung: Bestrahlung; anbauland: string | null }`
  - `blueteFreigabePruefen(formular: Lesbar, terpenNamen: readonly string[]): Pruef<BlueteFreigabe>` (Felder: `vorschlagSchluessel, handelsname, kultivarName, kultivarTyp, thcMin, thcMax, cbdMin, cbdMax, hersteller, terpen1..terpen5, bestrahlung, anbauland`)
  - `type OffenerVorschlag = { id: string; mitgliedId: string; anzeigename: string; handelsname: string; schluessel: string; hersteller: string | null; kultivarName: string | null; kultivarTyp: string | null; thcProzent: number | null; cbdProzent: number | null; terpene: string[]; quelle: string; notiz: string | null; erstelltAm: Date }`
  - `type VorschlagGruppe = { schluessel: string; vorschlaege: OffenerVorschlag[] }`
  - `vorschlaegeBuendeln(liste: readonly OffenerVorschlag[]): VorschlagGruppe[]` (älteste Gruppe zuerst)
  - `type FreigabeVorbelegung = { handelsname: string; kultivarName: string; kultivarTyp: string; thcMin: string; thcMax: string; cbdMin: string; cbdMax: string; hersteller: string; terpene: string[] }`
  - `freigabeVorbelegen(gruppe: VorschlagGruppe): FreigabeVorbelegung`
  - `freigabeKonflikt(sollId: string, vorhanden: { id: string; slug: string } | null): { slug: string } | null`
  - `quelleAlsLink(quelle: string): string | null`
  - `terpeneLesen(json: string | null): string[]`

- [ ] **Step 1: Failing test** (`tests/vorschlag-eingabe.test.ts`)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  blueteFreigabePruefen,
  blueteVorschlagPruefen,
  freigabeKonflikt,
  freigabeVorbelegen,
  quelleAlsLink,
  terpeneLesen,
  vorschlaegeBuendeln,
  type OffenerVorschlag,
} from "@/lib/vorschlag-eingabe";

const TERPENE = ["Myrcen", "Limonen", "Caryophyllen", "Linalool"];

function formular(werte: Record<string, string>) {
  return { get: (name: string) => werte[name] ?? null };
}

test("Vorschlag: nur Handelsname und Quelle sind Pflicht", () => {
  const e = blueteVorschlagPruefen(formular({ handelsname: " Apples & Bananas ", quelle: "Packung" }), TERPENE);
  assert.deepEqual(e, {
    ok: true,
    wert: {
      handelsname: "Apples & Bananas",
      schluessel: "apples-bananas",
      hersteller: null,
      kultivarName: null,
      kultivarTyp: null,
      thcProzent: null,
      cbdProzent: null,
      terpene: [],
      quelle: "Packung",
      notiz: null,
    },
  });
});

test("Vorschlag: fehlender Name, fehlende Quelle, leerer Slug", () => {
  assert.equal(blueteVorschlagPruefen(formular({ quelle: "x" }), TERPENE).ok, false);
  assert.equal(blueteVorschlagPruefen(formular({ handelsname: "A" }), TERPENE).ok, false);
  const leer = blueteVorschlagPruefen(formular({ handelsname: "&&&", quelle: "x" }), TERPENE);
  assert.deepEqual(leer, { ok: false, fehler: "Der Handelsname braucht Buchstaben oder Ziffern." });
});

test("Vorschlag: Zahlen mit Komma, Grenzen, Kultivartyp", () => {
  const ok = blueteVorschlagPruefen(
    formular({ handelsname: "X", quelle: "q", thc: "22,5", cbd: "0", kultivarTyp: "HYBRID" }),
    TERPENE,
  );
  assert.equal(ok.ok && ok.wert.thcProzent, 22.5);
  assert.equal(ok.ok && ok.wert.cbdProzent, 0);
  assert.equal(ok.ok && ok.wert.kultivarTyp, "HYBRID");
  assert.equal(blueteVorschlagPruefen(formular({ handelsname: "X", quelle: "q", thc: "41" }), TERPENE).ok, false);
  assert.equal(blueteVorschlagPruefen(formular({ handelsname: "X", quelle: "q", cbd: "31" }), TERPENE).ok, false);
  assert.equal(blueteVorschlagPruefen(formular({ handelsname: "X", quelle: "q", kultivarTyp: "LILA" }), TERPENE).ok, false);
});

test("Vorschlag: Terpene nur aus der Liste, Reihenfolge bleibt, Doppelte fallen weg", () => {
  const e = blueteVorschlagPruefen(
    formular({ handelsname: "X", quelle: "q", terpen1: "Limonen", terpen2: "Limonen", terpen3: "Myrcen" }),
    TERPENE,
  );
  assert.deepEqual(e.ok && e.wert.terpene, ["Limonen", "Myrcen"]);
  assert.equal(blueteVorschlagPruefen(formular({ handelsname: "X", quelle: "q", terpen1: "Gift" }), TERPENE).ok, false);
});

test("Vorschlag: Notiz zu lang wird abgelehnt", () => {
  const e = blueteVorschlagPruefen(formular({ handelsname: "X", quelle: "q", notiz: "a".repeat(501) }), TERPENE);
  assert.equal(e.ok, false);
});

test("Freigabe: Pflichtfelder, Spannen, Slug aus dem korrigierten Namen", () => {
  const e = blueteFreigabePruefen(
    formular({
      vorschlagSchluessel: "apples-bananas",
      handelsname: "Apples and Bananas",
      kultivarTyp: "HYBRID",
      thcMin: "20",
      thcMax: "24",
      cbdMin: "0",
      cbdMax: "1",
      terpen1: "Myrcen",
      bestrahlung: "UNBEKANNT",
    }),
    TERPENE,
  );
  assert.equal(e.ok, true);
  assert.equal(e.ok && e.wert.slug, "apples-and-bananas");
  assert.equal(e.ok && e.wert.vorschlagSchluessel, "apples-bananas");
  const ohneTyp = blueteFreigabePruefen(
    formular({ vorschlagSchluessel: "a", handelsname: "A", thcMin: "1", thcMax: "2", cbdMin: "0", cbdMax: "0" }),
    TERPENE,
  );
  assert.equal(ohneTyp.ok, false);
  const verdreht = blueteFreigabePruefen(
    formular({ vorschlagSchluessel: "a", handelsname: "A", kultivarTyp: "INDICA", thcMin: "25", thcMax: "20", cbdMin: "0", cbdMax: "0" }),
    TERPENE,
  );
  assert.deepEqual(verdreht, { ok: false, fehler: "THC: der kleinste Wert ist größer als der größte." });
});

function vorschlag(teil: Partial<OffenerVorschlag>): OffenerVorschlag {
  return {
    id: "v",
    mitgliedId: "m",
    anzeigename: "Mo",
    handelsname: "Apples & Bananas",
    schluessel: "apples-bananas",
    hersteller: null,
    kultivarName: null,
    kultivarTyp: null,
    thcProzent: null,
    cbdProzent: null,
    terpene: [],
    quelle: "Packung",
    notiz: null,
    erstelltAm: new Date("2026-09-20T10:00:00Z"),
    ...teil,
  };
}

test("vorschlaegeBuendeln: gleicher Schluessel eine Gruppe, aelteste Gruppe zuerst", () => {
  const gruppen = vorschlaegeBuendeln([
    vorschlag({ id: "1", schluessel: "b", erstelltAm: new Date("2026-09-22T00:00:00Z") }),
    vorschlag({ id: "2", schluessel: "apples-bananas", handelsname: "apples-bananas" }),
    vorschlag({ id: "3", schluessel: "apples-bananas", erstelltAm: new Date("2026-09-23T00:00:00Z") }),
  ]);
  assert.deepEqual(gruppen.map((g) => [g.schluessel, g.vorschlaege.map((v) => v.id)]), [
    ["apples-bananas", ["2", "3"]],
    ["b", ["1"]],
  ]);
});

test("freigabeVorbelegen: erster Vorschlag zuerst, Luecken aus den weiteren, Einzelwert als Spanne", () => {
  const belegung = freigabeVorbelegen({
    schluessel: "apples-bananas",
    vorschlaege: [
      vorschlag({ id: "1", thcProzent: 22 }),
      vorschlag({ id: "2", hersteller: "Aurora", kultivarTyp: "HYBRID", cbdProzent: 1, terpene: ["Myrcen"] }),
    ],
  });
  assert.deepEqual(belegung, {
    handelsname: "Apples & Bananas",
    kultivarName: "",
    kultivarTyp: "HYBRID",
    thcMin: "22",
    thcMax: "22",
    cbdMin: "1",
    cbdMax: "1",
    hersteller: "Aurora",
    terpene: ["Myrcen"],
  });
});

test("freigabeKonflikt: fremde Id ist Konflikt, gleiche Id oder nichts nicht", () => {
  assert.equal(freigabeKonflikt("id-a", null), null);
  assert.equal(freigabeKonflikt("id-a", { id: "id-a", slug: "x" }), null);
  assert.deepEqual(freigabeKonflikt("id-a", { id: "id-b", slug: "apples-bananas" }), { slug: "apples-bananas" });
});

test("quelleAlsLink: nur http(s)", () => {
  assert.equal(quelleAlsLink("https://example.org/a"), "https://example.org/a");
  assert.equal(quelleAlsLink(" http://example.org "), "http://example.org/");
  assert.equal(quelleAlsLink("javascript:alert(1)"), null);
  assert.equal(quelleAlsLink("Packung"), null);
});

test("terpeneLesen: kaputtes JSON ergibt leere Liste", () => {
  assert.deepEqual(terpeneLesen('["Myrcen","Limonen"]'), ["Myrcen", "Limonen"]);
  assert.deepEqual(terpeneLesen("{kaputt"), []);
  assert.deepEqual(terpeneLesen(null), []);
  assert.deepEqual(terpeneLesen('[1,"Myrcen"]'), ["Myrcen"]);
});
```

- [ ] **Step 2: Test laufen lassen, muss scheitern**

Run: `npx tsx --test tests/vorschlag-eingabe.test.ts`
Expected: FAIL, Modul fehlt.

- [ ] **Step 3: Implementieren** (`lib/vorschlag-eingabe.ts`)

```ts
/**
 * Pruefung und reine Logik fuer "Bluete vorschlagen" (Spec 2026-09-25).
 * Ohne Datenbank, Request und Sitzung, damit direkt testbar. Ueber Rechte
 * entscheidet lib/session.ts, hier nur ueber Gueltigkeit.
 */
import { z } from "zod";

import {
  BESTRAHLUNGEN,
  KULTIVAR_TYPEN,
  type Bestrahlung,
  type KultivarTyp,
} from "@/db/enums";
import { slugAusName } from "@/lib/stamm-id";

export const MAX_OFFENE_VORSCHLAEGE = 5;
export const MAX_VORSCHLAG_NOTIZ = 500;
export const MAX_VORSCHLAG_TERPENE = 3;
export const MAX_FREIGABE_TERPENE = 5;
const MAX_NAME = 120;
const MAX_QUELLE = 300;

export type Pruef<T> = { ok: true; wert: T } | { ok: false; fehler: string };

type Lesbar = { get(name: string): unknown };

const text = (roh: unknown) => (typeof roh === "string" ? roh.trim() : "");
const optional = (roh: unknown) => text(roh) || null;

function zahl(roh: unknown, max: number): number | null | "fehler" {
  const t = text(roh).replace(",", ".");
  if (!t) return null;
  const e = z.coerce.number().min(0).max(max).safeParse(t);
  return e.success ? e.data : "fehler";
}

function terpeneAusFormular(
  formular: Lesbar,
  anzahl: number,
  erlaubt: readonly string[],
): string[] | "fehler" {
  const liste: string[] = [];
  for (let i = 1; i <= anzahl; i++) {
    const name = text(formular.get(`terpen${i}`));
    if (!name) continue;
    if (!erlaubt.includes(name)) return "fehler";
    if (!liste.includes(name)) liste.push(name);
  }
  return liste;
}

function istKultivarTyp(wert: string): wert is KultivarTyp {
  return (KULTIVAR_TYPEN as readonly string[]).includes(wert);
}

function istBestrahlung(wert: string): wert is Bestrahlung {
  return (BESTRAHLUNGEN as readonly string[]).includes(wert);
}

export type BlueteVorschlag = {
  handelsname: string;
  schluessel: string;
  hersteller: string | null;
  kultivarName: string | null;
  kultivarTyp: KultivarTyp | null;
  thcProzent: number | null;
  cbdProzent: number | null;
  terpene: string[];
  quelle: string;
  notiz: string | null;
};

function nameUndSchluessel(formular: Lesbar, feld: string): Pruef<{ name: string; slug: string }> {
  const name = text(formular.get(feld));
  if (!name) return { ok: false, fehler: "Der Handelsname fehlt." };
  if (name.length > MAX_NAME) return { ok: false, fehler: `Der Handelsname ist länger als ${MAX_NAME} Zeichen.` };
  const slug = slugAusName(name);
  if (!slug) return { ok: false, fehler: "Der Handelsname braucht Buchstaben oder Ziffern." };
  return { ok: true, wert: { name, slug } };
}

export function blueteVorschlagPruefen(
  formular: Lesbar,
  terpenNamen: readonly string[],
): Pruef<BlueteVorschlag> {
  const name = nameUndSchluessel(formular, "handelsname");
  if (!name.ok) return name;

  const quelle = text(formular.get("quelle"));
  if (!quelle) return { ok: false, fehler: "Bitte gib an, woher du die Angaben hast." };
  if (quelle.length > MAX_QUELLE) return { ok: false, fehler: `Die Quelle ist länger als ${MAX_QUELLE} Zeichen.` };

  const typRoh = text(formular.get("kultivarTyp"));
  if (typRoh && !istKultivarTyp(typRoh)) return { ok: false, fehler: "Unbekannter Kultivartyp." };

  const thc = zahl(formular.get("thc"), 40);
  if (thc === "fehler") return { ok: false, fehler: "THC bitte als Zahl zwischen 0 und 40 %." };
  const cbd = zahl(formular.get("cbd"), 30);
  if (cbd === "fehler") return { ok: false, fehler: "CBD bitte als Zahl zwischen 0 und 30 %." };

  const terpene = terpeneAusFormular(formular, MAX_VORSCHLAG_TERPENE, terpenNamen);
  if (terpene === "fehler") return { ok: false, fehler: "Bitte nur Terpene aus der Liste wählen." };

  const notiz = optional(formular.get("notiz"));
  if (notiz && notiz.length > MAX_VORSCHLAG_NOTIZ) {
    return { ok: false, fehler: `Die Notiz ist länger als ${MAX_VORSCHLAG_NOTIZ} Zeichen.` };
  }

  return {
    ok: true,
    wert: {
      handelsname: name.wert.name,
      schluessel: name.wert.slug,
      hersteller: optional(formular.get("hersteller")),
      kultivarName: optional(formular.get("kultivarName")),
      kultivarTyp: typRoh ? (typRoh as KultivarTyp) : null,
      thcProzent: thc,
      cbdProzent: cbd,
      terpene,
      quelle,
      notiz,
    },
  };
}

export type BlueteFreigabe = {
  vorschlagSchluessel: string;
  handelsname: string;
  slug: string;
  kultivarName: string | null;
  kultivarTyp: KultivarTyp;
  thcMin: number;
  thcMax: number;
  cbdMin: number;
  cbdMax: number;
  hersteller: string | null;
  terpene: string[];
  bestrahlung: Bestrahlung;
  anbauland: string | null;
};

function spanne(formular: Lesbar, name: "THC" | "CBD", von: string, bis: string): Pruef<[number, number]> {
  const min = zahl(formular.get(von), 100);
  const max = zahl(formular.get(bis), 100);
  if (min === "fehler" || max === "fehler" || min === null || max === null) {
    return { ok: false, fehler: `${name}: bitte beide Werte zwischen 0 und 100 % angeben.` };
  }
  if (min > max) return { ok: false, fehler: `${name}: der kleinste Wert ist größer als der größte.` };
  return { ok: true, wert: [min, max] };
}

export function blueteFreigabePruefen(
  formular: Lesbar,
  terpenNamen: readonly string[],
): Pruef<BlueteFreigabe> {
  const vorschlagSchluessel = text(formular.get("vorschlagSchluessel"));
  if (!vorschlagSchluessel) return { ok: false, fehler: "Kein Vorschlag angegeben." };

  const name = nameUndSchluessel(formular, "handelsname");
  if (!name.ok) return name;

  const typ = text(formular.get("kultivarTyp"));
  if (!istKultivarTyp(typ)) return { ok: false, fehler: "Bitte den Kultivartyp wählen." };

  const thc = spanne(formular, "THC", "thcMin", "thcMax");
  if (!thc.ok) return thc;
  const cbd = spanne(formular, "CBD", "cbdMin", "cbdMax");
  if (!cbd.ok) return cbd;

  const terpene = terpeneAusFormular(formular, MAX_FREIGABE_TERPENE, terpenNamen);
  if (terpene === "fehler") return { ok: false, fehler: "Bitte nur Terpene aus der Liste wählen." };

  const bestrahlungRoh = text(formular.get("bestrahlung")) || "UNBEKANNT";
  if (!istBestrahlung(bestrahlungRoh)) return { ok: false, fehler: "Unbekannte Bestrahlung." };

  return {
    ok: true,
    wert: {
      vorschlagSchluessel,
      handelsname: name.wert.name,
      slug: name.wert.slug,
      kultivarName: optional(formular.get("kultivarName")),
      kultivarTyp: typ,
      thcMin: thc.wert[0],
      thcMax: thc.wert[1],
      cbdMin: cbd.wert[0],
      cbdMax: cbd.wert[1],
      hersteller: optional(formular.get("hersteller")),
      terpene,
      bestrahlung: bestrahlungRoh,
      anbauland: optional(formular.get("anbauland")),
    },
  };
}

export type OffenerVorschlag = {
  id: string;
  mitgliedId: string;
  anzeigename: string;
  handelsname: string;
  schluessel: string;
  hersteller: string | null;
  kultivarName: string | null;
  kultivarTyp: string | null;
  thcProzent: number | null;
  cbdProzent: number | null;
  terpene: string[];
  quelle: string;
  notiz: string | null;
  erstelltAm: Date;
};

export type VorschlagGruppe = { schluessel: string; vorschlaege: OffenerVorschlag[] };

/** Gleiche Schluessel zusammen, in der Gruppe nach Alter, aelteste Gruppe zuerst. */
export function vorschlaegeBuendeln(liste: readonly OffenerVorschlag[]): VorschlagGruppe[] {
  const gruppen = new Map<string, OffenerVorschlag[]>();
  for (const v of [...liste].sort((a, b) => a.erstelltAm.getTime() - b.erstelltAm.getTime())) {
    const gruppe = gruppen.get(v.schluessel);
    if (gruppe) gruppe.push(v);
    else gruppen.set(v.schluessel, [v]);
  }
  return [...gruppen].map(([schluessel, vorschlaege]) => ({ schluessel, vorschlaege }));
}

export type FreigabeVorbelegung = {
  handelsname: string;
  kultivarName: string;
  kultivarTyp: string;
  thcMin: string;
  thcMax: string;
  cbdMin: string;
  cbdMax: string;
  hersteller: string;
  terpene: string[];
};

function erster<T>(liste: readonly OffenerVorschlag[], feld: (v: OffenerVorschlag) => T | null): T | null {
  for (const v of liste) {
    const wert = feld(v);
    if (wert !== null && wert !== undefined) return wert;
  }
  return null;
}

/** Formularwerte fuer die Freigabe: erster Vorschlag zuerst, Luecken aus den weiteren. */
export function freigabeVorbelegen(gruppe: VorschlagGruppe): FreigabeVorbelegung {
  const l = gruppe.vorschlaege;
  const thc = erster(l, (v) => v.thcProzent);
  const cbd = erster(l, (v) => v.cbdProzent);
  const terpene = erster(l, (v) => (v.terpene.length ? v.terpene : null));
  return {
    handelsname: l[0]?.handelsname ?? "",
    kultivarName: erster(l, (v) => v.kultivarName) ?? "",
    kultivarTyp: erster(l, (v) => v.kultivarTyp) ?? "",
    thcMin: thc === null ? "" : String(thc),
    thcMax: thc === null ? "" : String(thc),
    cbdMin: cbd === null ? "" : String(cbd),
    cbdMax: cbd === null ? "" : String(cbd),
    hersteller: erster(l, (v) => v.hersteller) ?? "",
    terpene: terpene ?? [],
  };
}

/**
 * Steht unter diesem Namen schon eine andere Bluete? Gleiche Id ist kein
 * Konflikt (Doppelklick oder Import dazwischen): dann wird sie genommen.
 */
export function freigabeKonflikt(
  sollId: string,
  vorhanden: { id: string; slug: string } | null,
): { slug: string } | null {
  if (!vorhanden || vorhanden.id === sollId) return null;
  return { slug: vorhanden.slug };
}

/** Nur http(s) wird verlinkt; alles andere bleibt Text. */
export function quelleAlsLink(quelle: string): string | null {
  try {
    const url = new URL(quelle.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Liest die Terpenspalte. Nie ungeprueft JSON.parse in einer Komponente. */
export function terpeneLesen(json: string | null): string[] {
  if (!json) return [];
  try {
    const roh: unknown = JSON.parse(json);
    return Array.isArray(roh) ? roh.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Tests grün**

Run: `npx tsx --test tests/vorschlag-eingabe.test.ts && npm run typecheck`
Expected: PASS, tsc ohne Fehler.

- [ ] **Step 5: Commit**

```bash
git add lib/vorschlag-eingabe.ts tests/vorschlag-eingabe.test.ts
git commit -m "feat: Pruefung und Logik fuer Bluetenvorschlaege"
```

---

### Task 4: Benachrichtigungen und Abfragen

**Files:**
- Create: `lib/benachrichtigung.ts`, `lib/query/vorschlaege.ts`, `lib/query/benachrichtigungen.ts`
- Test: `tests/benachrichtigung.test.ts`

**Interfaces:**
- Consumes: `getPrisma()` aus `@/lib/prisma`; `terpeneLesen`, `type OffenerVorschlag` (Task 3); `type BenachrichtigungArt`, `type VorschlagStatus` (Task 1).
- Produces:
  - `textFreigegeben(handelsname: string): string`
  - `textAbgelehnt(handelsname: string, begruendung: string | null): string`
  - `type Nachricht = { mitgliedId: string; art: BenachrichtigungArt; text: string; link: string | null }`
  - `nachrichtenFuer(mitgliedIds: readonly string[], vorlage: Omit<Nachricht, "mitgliedId">): Nachricht[]` (eine je Mitglied, Doppelte entfernt)
  - `benachrichtigen(nachrichten: readonly Nachricht[]): Promise<void>`
  - `terpenNamen(): Promise<string[]>`
  - `blueteVorhanden(slug: string, handelsname: string): Promise<{ id: string; slug: string; handelsname: string } | null>`
  - `offeneVorschlaegeFuerAdmin(): Promise<OffenerVorschlag[]>`
  - `type EigenerVorschlag = { id: string; handelsname: string; status: VorschlagStatus; begruendung: string | null; strainSlug: string | null; erstelltAm: Date }`
  - `eigeneVorschlaege(mitgliedId: string): Promise<EigenerVorschlag[]>`
  - `ungeleseneAnzahl(mitgliedId: string): Promise<number>`
  - `type Eintrag = { id: string; text: string; link: string | null; gelesen: boolean; erstelltAm: Date }`
  - `benachrichtigungenLaden(mitgliedId: string): Promise<Eintrag[]>`

- [ ] **Step 1: Failing test** (`tests/benachrichtigung.test.ts`)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { nachrichtenFuer, textAbgelehnt, textFreigegeben } from "@/lib/benachrichtigung";

test("Texte ohne Gedankenstrich, Handelsname unveraendert", () => {
  assert.equal(textFreigegeben("Apples & Bananas"), "Deine vorgeschlagene Blüte Apples & Bananas steht jetzt im Katalog.");
  assert.equal(textAbgelehnt("X", null), "Deine vorgeschlagene Blüte X nehmen wir nicht in den Katalog auf.");
  assert.equal(
    textAbgelehnt("X", "Keine Quelle gefunden"),
    "Deine vorgeschlagene Blüte X nehmen wir nicht in den Katalog auf. Grund: Keine Quelle gefunden",
  );
  for (const t of [textFreigegeben("A"), textAbgelehnt("A", "b")]) assert.doesNotMatch(t, /[–—]/);
});

test("nachrichtenFuer: eine Nachricht je Mitglied", () => {
  const liste = nachrichtenFuer(["a", "b", "a"], { art: "VORSCHLAG_FREIGEGEBEN", text: "t", link: "/produkte/x" });
  assert.deepEqual(liste.map((n) => n.mitgliedId), ["a", "b"]);
  assert.equal(liste[0].link, "/produkte/x");
});
```

- [ ] **Step 2: Test laufen lassen, muss scheitern**

Run: `npx tsx --test tests/benachrichtigung.test.ts`
Expected: FAIL, Modul fehlt.

- [ ] **Step 3: `lib/benachrichtigung.ts`**

Achtung: die Datei importiert `getPrisma` erst in `benachrichtigen()` dynamisch, damit der Test die reinen Funktionen ohne Cloudflare-Kontext laden kann.

```ts
/**
 * Benachrichtigungen an Mitglieder: die EINE Stelle, an der sie entstehen.
 * Heute nur als Satz in der Datenbank (Mitgliederbereich). Kommt spaeter
 * Mailversand dazu, schliesst er hier an (Spec Bluete vorschlagen 3.2).
 */
import type { BenachrichtigungArt } from "@/db/enums";

export type Nachricht = {
  mitgliedId: string;
  art: BenachrichtigungArt;
  text: string;
  /** Interner Pfad, vom Server gesetzt. */
  link: string | null;
};

export function textFreigegeben(handelsname: string): string {
  return `Deine vorgeschlagene Blüte ${handelsname} steht jetzt im Katalog.`;
}

export function textAbgelehnt(handelsname: string, begruendung: string | null): string {
  const satz = `Deine vorgeschlagene Blüte ${handelsname} nehmen wir nicht in den Katalog auf.`;
  return begruendung ? `${satz} Grund: ${begruendung}` : satz;
}

export function nachrichtenFuer(
  mitgliedIds: readonly string[],
  vorlage: Omit<Nachricht, "mitgliedId">,
): Nachricht[] {
  return [...new Set(mitgliedIds)].map((mitgliedId) => ({ mitgliedId, ...vorlage }));
}

export async function benachrichtigen(nachrichten: readonly Nachricht[]): Promise<void> {
  if (nachrichten.length === 0) return;
  const { getPrisma } = await import("@/lib/prisma");
  const prisma = await getPrisma();
  await prisma.benachrichtigung.createMany({ data: [...nachrichten] });
}
```

- [ ] **Step 4: `lib/query/vorschlaege.ts`**

```ts
import "server-only";

import { getPrisma } from "@/lib/prisma";
import { istVorschlagStatus, type VorschlagStatus } from "@/db/enums";
import { terpeneLesen, type OffenerVorschlag } from "@/lib/vorschlag-eingabe";

/** Obergrenzen: jede Liste hat ein take. */
const MAX_ADMIN = 200;
const MAX_EIGENE = 50;

/** Namen der Katalog-Terpene, alphabetisch. Die einzige erlaubte Auswahl im Formular. */
export async function terpenNamen(): Promise<string[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.terpen.findMany({ select: { name: true }, orderBy: { name: "asc" }, take: 200 });
  return zeilen.map((z) => z.name);
}

/** Steht die Bluete schon im Katalog (gleicher Slug oder Handelsname)? */
export async function blueteVorhanden(slug: string, handelsname: string) {
  const prisma = await getPrisma();
  return prisma.strain.findFirst({
    where: { OR: [{ slug }, { handelsname }] },
    select: { id: true, slug: true, handelsname: true },
  });
}

export async function offeneVorschlaegeFuerAdmin(): Promise<OffenerVorschlag[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.sortenVorschlag.findMany({
    where: { status: "OFFEN" },
    orderBy: { erstelltAm: "asc" },
    take: MAX_ADMIN,
    include: { mitglied: { select: { anzeigename: true } } },
  });
  return zeilen.map((z) => ({
    id: z.id,
    mitgliedId: z.mitgliedId,
    anzeigename: z.mitglied.anzeigename,
    handelsname: z.handelsname,
    schluessel: z.schluessel,
    hersteller: z.hersteller,
    kultivarName: z.kultivarName,
    kultivarTyp: z.kultivarTyp,
    thcProzent: z.thcProzent,
    cbdProzent: z.cbdProzent,
    terpene: terpeneLesen(z.terpene),
    quelle: z.quelle,
    notiz: z.notiz,
    erstelltAm: z.erstelltAm,
  }));
}

export type EigenerVorschlag = {
  id: string;
  handelsname: string;
  status: VorschlagStatus;
  begruendung: string | null;
  strainSlug: string | null;
  erstelltAm: Date;
};

/** Nur die eigenen: mitgliedId kommt aus der Sitzung, nie aus dem Formular. */
export async function eigeneVorschlaege(mitgliedId: string): Promise<EigenerVorschlag[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.sortenVorschlag.findMany({
    where: { mitgliedId },
    orderBy: { erstelltAm: "desc" },
    take: MAX_EIGENE,
    select: {
      id: true,
      handelsname: true,
      status: true,
      begruendung: true,
      erstelltAm: true,
      strain: { select: { slug: true } },
    },
  });
  return zeilen.map((z) => ({
    id: z.id,
    handelsname: z.handelsname,
    status: istVorschlagStatus(z.status) ? z.status : "OFFEN",
    begruendung: z.begruendung,
    strainSlug: z.strain?.slug ?? null,
    erstelltAm: z.erstelltAm,
  }));
}
```

Dazu in `db/enums.ts` unter `VORSCHLAG_STATUS` ergänzen:

```ts
export function istVorschlagStatus(wert: string): wert is VorschlagStatus {
  return (VORSCHLAG_STATUS as readonly string[]).includes(wert);
}
```

- [ ] **Step 5: `lib/query/benachrichtigungen.ts`**

```ts
import "server-only";

import { getPrisma } from "@/lib/prisma";

const MAX_LISTE = 20;

export async function ungeleseneAnzahl(mitgliedId: string): Promise<number> {
  const prisma = await getPrisma();
  return prisma.benachrichtigung.count({ where: { mitgliedId, gelesenAm: null } });
}

export type Eintrag = { id: string; text: string; link: string | null; gelesen: boolean; erstelltAm: Date };

export async function benachrichtigungenLaden(mitgliedId: string): Promise<Eintrag[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.benachrichtigung.findMany({
    where: { mitgliedId },
    orderBy: { erstelltAm: "desc" },
    take: MAX_LISTE,
    select: { id: true, text: true, link: true, gelesenAm: true, erstelltAm: true },
  });
  return zeilen.map((z) => ({ id: z.id, text: z.text, link: z.link, gelesen: z.gelesenAm !== null, erstelltAm: z.erstelltAm }));
}
```

- [ ] **Step 6: Tests, Typecheck, Lint**

Run: `npm test 2>&1 | tail -8 && npm run typecheck && npx eslint lib`
Expected: alle PASS, keine Fehler.

- [ ] **Step 7: Commit**

```bash
git add lib/benachrichtigung.ts lib/query/vorschlaege.ts lib/query/benachrichtigungen.ts db/enums.ts tests/benachrichtigung.test.ts
git commit -m "feat: Benachrichtigungen und Abfragen fuer Bluetenvorschlaege"
```

---

### Task 5: Mitglied schlägt vor (`/vorschlagen`) und Einstiege

**Files:**
- Create: `app/vorschlagen/page.tsx`, `app/vorschlagen/aktionen.ts`, `components/vorschlag/BlueteVorschlagFormular.tsx`
- Modify: `app/produkte/page.tsx` (EmptyState Z. 89–97 und nach der Liste), `components/umfrage/VorschlagFormular.tsx` (Hinweis unter dem Select)
- Test: `tests/bluete-vorschlagen.test.ts` (ergänzen)

**Interfaces:**
- Consumes: `mitgliedErforderlich`, `aktuellesMitglied` (`@/lib/session`); `blueteVorschlagPruefen`, `MAX_OFFENE_VORSCHLAEGE`, `MAX_VORSCHLAG_NOTIZ`, `MAX_VORSCHLAG_TERPENE` (Task 3); `terpenNamen`, `blueteVorhanden` (Task 4); `istEindeutigkeitsfehler` (`@/lib/prisma-fehler`); `KULTIVAR_TYPEN`.
- Produces: `blueteVorschlagen(formData: FormData): Promise<VorschlagErgebnis>` mit `type VorschlagErgebnis = { ok: true } | { ok: false; fehler: string; vorhanden?: { slug: string; handelsname: string } }`; Route `/vorschlagen?name=<vorbelegung>`.

- [ ] **Step 1: Failing test ergänzen** (an `tests/bluete-vorschlagen.test.ts` anhängen)

```ts
test("Vorschlagen: Aktion prueft Anmeldung, nicht die Freigabe, und schreibt die Id nie aus dem Formular", () => {
  const quelle = lies("app/vorschlagen/aktionen.ts");
  assert.match(quelle, /^"use server";/);
  assert.match(quelle, /await mitgliedErforderlich\(\)/);
  assert.doesNotMatch(quelle, /freigabeErforderlich/);
  assert.match(quelle, /mitgliedId: mitglied\.mitgliedId/);
  assert.doesNotMatch(quelle, /formData\.get\("mitgliedId"\)/);
  assert.match(quelle, /MAX_OFFENE_VORSCHLAEGE/);
});

test("Vorschlagen: Seite leitet ohne Anmeldung weiter, Katalog verlinkt mit Suchbegriff", () => {
  assert.match(lies("app/vorschlagen/page.tsx"), /redirect\("\/anmelden\?weiter=%2Fvorschlagen"\)/);
  const katalog = lies("app/produkte/page.tsx");
  assert.match(katalog, /href=\{vorschlagLink\(filter\.q\)\}/);
  assert.match(lies("components/umfrage/VorschlagFormular.tsx"), /href="\/vorschlagen"/);
});
```

- [ ] **Step 2: Test laufen lassen, muss scheitern**

Run: `npm test 2>&1 | tail -12`
Expected: FAIL (Dateien fehlen).

- [ ] **Step 3: Server Action** (`app/vorschlagen/aktionen.ts`)

```ts
"use server";

import { revalidatePath } from "next/cache";

import { mitgliedErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import { blueteVorhanden, terpenNamen } from "@/lib/query/vorschlaege";
import { MAX_OFFENE_VORSCHLAEGE, blueteVorschlagPruefen } from "@/lib/vorschlag-eingabe";

export type VorschlagErgebnis =
  | { ok: true }
  | { ok: false; fehler: string; vorhanden?: { slug: string; handelsname: string } };

/**
 * Eine fehlende Bluete vorschlagen. Jedes angemeldete Mitglied darf das,
 * auch vor der Freigabe des Kontos (Spec 4.1): gepruefte wird erst beim
 * Betreiber. Identitaet aus lib/session.ts, nie aus dem Formular.
 */
export async function blueteVorschlagen(formData: FormData): Promise<VorschlagErgebnis> {
  const mitglied = await mitgliedErforderlich();

  const geprueft = blueteVorschlagPruefen(formData, await terpenNamen());
  if (!geprueft.ok) return geprueft;
  const w = geprueft.wert;

  const vorhanden = await blueteVorhanden(w.schluessel, w.handelsname);
  if (vorhanden) {
    return {
      ok: false,
      fehler: "Diese Blüte steht schon im Katalog.",
      vorhanden: { slug: vorhanden.slug, handelsname: vorhanden.handelsname },
    };
  }

  const prisma = await getPrisma();
  // Gezaehlt vor dem Schreiben, ohne Transaktion: ein sechster Vorschlag bei
  // gleichzeitigem Absenden ist harmlos. Die Doppelsperre steht im Unique-Index.
  const offen = await prisma.sortenVorschlag.count({
    where: { mitgliedId: mitglied.mitgliedId, status: "OFFEN" },
  });
  if (offen >= MAX_OFFENE_VORSCHLAEGE) {
    return {
      ok: false,
      fehler: `Du hast schon ${MAX_OFFENE_VORSCHLAEGE} offene Vorschläge. Sobald wir sie geprüft haben, geht es weiter.`,
    };
  }

  try {
    await prisma.sortenVorschlag.create({
      data: {
        mitgliedId: mitglied.mitgliedId,
        handelsname: w.handelsname,
        schluessel: w.schluessel,
        hersteller: w.hersteller,
        kultivarName: w.kultivarName,
        kultivarTyp: w.kultivarTyp,
        thcProzent: w.thcProzent,
        cbdProzent: w.cbdProzent,
        terpene: w.terpene.length ? JSON.stringify(w.terpene) : null,
        quelle: w.quelle,
        notiz: w.notiz,
      },
    });
  } catch (fehler) {
    if (istEindeutigkeitsfehler(fehler)) {
      return { ok: false, fehler: "Diese Blüte hast du schon vorgeschlagen. Den Stand siehst du unter Mein Konto." };
    }
    throw fehler;
  }

  revalidatePath("/mitglied");
  revalidatePath("/admin");
  return { ok: true };
}
```

- [ ] **Step 4: Formular** (`components/vorschlag/BlueteVorschlagFormular.tsx`)

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { blueteVorschlagen, type VorschlagErgebnis } from "@/app/vorschlagen/aktionen";
import { Button, Field, Input, Meldung, Select } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import { textLinkKlassen } from "@/components/ui";
import type { SelectOption } from "@/components/ui";
import { KULTIVAR_TYPEN } from "@/db/enums";
import { MAX_VORSCHLAG_NOTIZ, MAX_VORSCHLAG_TERPENE } from "@/lib/vorschlag-eingabe";

const TYP_LABEL: Record<(typeof KULTIVAR_TYPEN)[number], string> = {
  INDICA: "Indica",
  SATIVA: "Sativa",
  HYBRID: "Hybrid",
  RUDERALIS: "Ruderalis",
};
const TYPEN: SelectOption[] = KULTIVAR_TYPEN.map((t) => ({ wert: t, label: TYP_LABEL[t] }));
const RANG = ["Dominantes Terpen", "Zweites Terpen", "Drittes Terpen"];

type Props = { terpene: readonly string[]; nameVorbelegt: string };

/**
 * Pruefung liegt in lib/vorschlag-eingabe.ts und laeuft in der Server Action;
 * maxLength ist Bedienkomfort, keine Absicherung.
 */
export function BlueteVorschlagFormular({ terpene, nameVorbelegt }: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [antwort, setAntwort] = useState<VorschlagErgebnis | null>(null);
  const optionen: SelectOption[] = terpene.map((t) => ({ wert: t, label: t }));

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const formular = ereignis.currentTarget;
    setLaeuft(true);
    setAntwort(null);
    try {
      const ergebnis = await blueteVorschlagen(new FormData(formular));
      setAntwort(ergebnis);
      if (ergebnis.ok) {
        formular.reset();
        router.refresh();
      }
    } catch {
      setAntwort({ ok: false, fehler: "Das hat nicht geklappt. Vielleicht ist die Sitzung abgelaufen, melde dich neu an." });
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-6">
      <Input id="vorschlag-name" name="handelsname" label="Handelsname" pflicht required maxLength={120}
        defaultValue={nameVorbelegt} hinweis="So, wie er auf der Packung oder beim Hersteller steht." />
      <Input id="vorschlag-quelle" name="quelle" label="Quelle" pflicht required maxLength={300}
        hinweis="Link zum Hersteller oder kurz, woher du es weißt, z. B. Packung." />
      <Input id="vorschlag-hersteller" name="hersteller" label="Hersteller" maxLength={120} />
      <Input id="vorschlag-kultivar" name="kultivarName" label="Kultivar" maxLength={120}
        hinweis="Die Genetik hinter dem Handelsnamen, falls bekannt." />
      <Select id="vorschlag-typ" name="kultivarTyp" label="Typ" optionen={TYPEN} platzhalter="Weiß ich nicht" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input id="vorschlag-thc" name="thc" label="THC in %" inputMode="decimal" />
        <Input id="vorschlag-cbd" name="cbd" label="CBD in %" inputMode="decimal" />
      </div>
      {RANG.slice(0, MAX_VORSCHLAG_TERPENE).map((label, i) => (
        <Select key={label} id={`vorschlag-terpen${i + 1}`} name={`terpen${i + 1}`} label={label}
          optionen={optionen} platzhalter="Keine Angabe" />
      ))}
      <Field id="vorschlag-notiz" label="Notiz für uns" hinweis="Freiwillig.">
        {(attribute) => (
          <textarea {...attribute} name="notiz" rows={3} maxLength={MAX_VORSCHLAG_NOTIZ}
            className="w-full rounded-md border border-border-strong bg-surface px-4 py-2 text-body text-text" />
        )}
      </Field>

      {antwort && !antwort.ok ? (
        <Meldung art="fehler">
          {antwort.fehler}
          {antwort.vorhanden ? (
            <>
              {" "}
              <Link href={`/produkte/${antwort.vorhanden.slug}`} className={textLinkKlassen}>
                Zu {antwort.vorhanden.handelsname}
              </Link>
            </>
          ) : null}
        </Meldung>
      ) : null}
      {antwort?.ok ? (
        <Meldung art="erfolg">Danke! Wir prüfen deinen Vorschlag und melden uns unter Mein Konto.</Meldung>
      ) : null}

      <div>
        <Button type="submit" disabled={laeuft || !hydriert}>
          {laeuft ? "Wird gesendet …" : "Blüte vorschlagen"}
        </Button>
      </div>
    </form>
  );
}
```

Vor dem Schreiben prüfen: `textLinkKlassen` ist in `components/ui/textlink.ts` ein String oder eine Funktion? Mit `grep -n "export const textLinkKlassen\|export function textLinkKlassen" components/ui/textlink.ts` nachsehen und den Aufruf anpassen (`textLinkKlassen` bzw. `textLinkKlassen()`). Ebenso prüfen, ob `Input` die Prop `pflicht` erwartet (Z. 15) und `Select` `name`/`defaultValue` durchreicht (Omit von `SelectHTMLAttributes`).

- [ ] **Step 5: Seite** (`app/vorschlagen/page.tsx`)

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BlueteVorschlagFormular } from "@/components/vorschlag/BlueteVorschlagFormular";
import { terpenNamen } from "@/lib/query/vorschlaege";
import { aktuellesMitglied } from "@/lib/session";

export const metadata: Metadata = {
  title: "Blüte vorschlagen",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Fehlt eine Bluete im Katalog, traegt ein angemeldetes Mitglied sie hier ein (Spec 4.1). */
export default async function VorschlagenPage({ searchParams }: Props) {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) redirect("/anmelden?weiter=%2Fvorschlagen");

  const roh = (await searchParams).name;
  const nameVorbelegt = (typeof roh === "string" ? roh : "").slice(0, 120);

  return (
    <div className="mx-auto w-full max-w-180 px-4 py-16 sm:px-8">
      <h1 className="text-h1 text-text text-balance">Blüte vorschlagen</h1>
      <p className="mt-2 max-w-[68ch] text-body text-text-muted text-pretty">
        Dir fehlt eine Blüte im Katalog? Trag ein, was du weißt. Wir prüfen die Angaben und nehmen sie
        auf. Unter Mein Konto siehst du, wie es um deinen Vorschlag steht.
      </p>
      <div className="mt-8">
        <BlueteVorschlagFormular terpene={await terpenNamen()} nameVorbelegt={nameVorbelegt} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Einstiege**

In `app/produkte/page.tsx` oberhalb von `async function Ergebnisbereich` einfügen:

```tsx
/** Einstieg "Bluete vorschlagen", mit dem Suchbegriff als Vorbelegung. */
function vorschlagLink(suche: string | undefined): string {
  return suche ? `/vorschlagen?name=${encodeURIComponent(suche)}` : "/vorschlagen";
}
```

Den `EmptyState` (Z. 89–97) ersetzen durch:

```tsx
          <EmptyState
            titel="Keine Blüten gefunden"
            beschreibung="Zu dieser Filterkombination ist keine Blüte gelistet. Weniger Kriterien führen meist zu Treffern. Fehlt dir eine Blüte, schlag sie vor."
            aktion={
              <div className="flex flex-wrap gap-4">
                <Link href="/produkte" className={buttonKlassen("secondary")}>
                  Alle Filter zurücksetzen
                </Link>
                <Link href={vorschlagLink(filter.q)} className={buttonKlassen("secondary")}>
                  Blüte vorschlagen
                </Link>
              </div>
            }
          />
```

Nach dem schließenden `)}` der Liste (vor `{liste.seitenAnzahl > 1 ? (`) einfügen:

```tsx
        <p className="text-small text-text-muted">
          Blüte fehlt?{" "}
          <Link href={vorschlagLink(filter.q)} className={textLinkKlassen}>
            Schlag sie vor
          </Link>
        </p>
```

Import in `app/produkte/page.tsx` erweitern: `import { EmptyState, Spinner, buttonKlassen, textLinkKlassen } from "@/components/ui";` (Aufrufform wie in Step 4 geprüft).

In `components/umfrage/VorschlagFormular.tsx` den `hinweis` des Select ersetzen durch einen Satz darunter (nach dem `<Select … />`):

```tsx
      <p className="text-small text-text-muted">
        Nur Blüten aus dem Katalog. Fehlt eine?{" "}
        <Link href="/vorschlagen" className={textLinkKlassen}>
          Schlag sie vor
        </Link>
      </p>
```

und die Zeile `hinweis="Nur Handelsnamen aus dem Katalog."` entfernen; Imports `Link` aus `next/link` und `textLinkKlassen` ergänzen.

- [ ] **Step 7: Tests, Typecheck, Lint**

Run: `npm test 2>&1 | tail -8 && npm run typecheck && npx eslint app/vorschlagen components/vorschlag app/produkte components/umfrage`
Expected: alle PASS, keine Fehler.

- [ ] **Step 8: Commit**

```bash
git add app/vorschlagen components/vorschlag app/produkte/page.tsx components/umfrage/VorschlagFormular.tsx tests/bluete-vorschlagen.test.ts
git commit -m "feat: Mitglieder schlagen fehlende Blueten vor (/vorschlagen) mit Einstiegen"
```

---

### Task 6: Betreiber gibt frei, lehnt ab, ordnet zu

**Files:**
- Create: `app/admin/vorschlag-aktionen.ts`, `components/admin/BlueteVorschlaege.tsx`, `components/admin/BlueteFreigabe.tsx`
- Modify: `app/admin/page.tsx` (neuer Abschnitt nach `UmfrageBereich`)
- Test: `tests/bluete-vorschlagen.test.ts` (ergänzen)

**Interfaces:**
- Consumes: `adminErforderlich`; `blueteFreigabePruefen`, `freigabeKonflikt`, `freigabeVorbelegen`, `vorschlaegeBuendeln`, `quelleAlsLink`, `type VorschlagGruppe`, `MAX_FREIGABE_TERPENE` (Task 3); `strainIdAusSlug`, `unternehmensIdAusSchluessel`, `unternehmensSchluessel` (Task 2); `benachrichtigen`, `nachrichtenFuer`, `textFreigegeben`, `textAbgelehnt` (Task 4); `terpenNamen`, `blueteVorhanden`, `offeneVorschlaegeFuerAdmin` (Task 4); `ladeStrainAuswahl` (`@/lib/query/strains`); `useAktion` (`@/components/admin/useAktion`).
- Produces: `blueteFreigeben(fd)`, `blueteAblehnen(fd)`, `blueteZuordnen(fd)`, alle `Promise<{ ok: true } | { ok: false; fehler: string }>`.

- [ ] **Step 1: Failing test ergänzen**

```ts
test("Admin-Aktionen: jede beginnt mit adminErforderlich", () => {
  const quelle = lies("app/admin/vorschlag-aktionen.ts");
  assert.match(quelle, /^"use server";/);
  for (const name of ["blueteFreigeben", "blueteAblehnen", "blueteZuordnen"]) {
    assert.match(quelle, new RegExp(`export async function ${name}\\([^)]*\\)[^{]*\\{\\s*await adminErforderlich\\(\\);`));
  }
  // Ids nach der Regel des Importskripts, nie zufaellig
  assert.match(quelle, /strainIdAusSlug\(/);
  assert.match(quelle, /unternehmensIdAusSchluessel\(/);
  // Benachrichtigen vor dem Statuswechsel (Wiederholung verliert keine Nachricht)
  assert.ok(quelle.indexOf("await benachrichtigen(") < quelle.indexOf("sortenVorschlag.updateMany("));
});

test("Admin-Seite zeigt den Abschnitt Vorgeschlagene Blueten", () => {
  const seite = lies("app/admin/page.tsx");
  assert.match(seite, /<BlueteVorschlaege \/>/);
});
```

- [ ] **Step 2: Test laufen lassen, muss scheitern**

Run: `npm test 2>&1 | tail -12`
Expected: FAIL.

- [ ] **Step 3: Aktionen** (`app/admin/vorschlag-aktionen.ts`)

```ts
"use server";

import { revalidatePath } from "next/cache";

import { adminErforderlich } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";
import { benachrichtigen, nachrichtenFuer, textAbgelehnt, textFreigegeben } from "@/lib/benachrichtigung";
import { blueteVorhanden, terpenNamen } from "@/lib/query/vorschlaege";
import { strainIdAusSlug, unternehmensIdAusSchluessel, unternehmensSchluessel } from "@/lib/stamm-id";
import { blueteFreigabePruefen, freigabeKonflikt } from "@/lib/vorschlag-eingabe";
import type { BenachrichtigungArt, VorschlagStatus } from "@/db/enums";

export type AdminVorschlagErgebnis = { ok: true } | { ok: false; fehler: string };

/**
 * Entscheidungen des Betreibers ueber Bluetenvorschlaege (Spec 4.2). D1 hat
 * keine Transaktionen: jeder Schritt ist so gebaut, dass ein zweiter Klick
 * nach einem Abbruch zum selben Ergebnis fuehrt.
 */

async function offeneLaden(schluessel: string) {
  const prisma = await getPrisma();
  return prisma.sortenVorschlag.findMany({
    where: { schluessel, status: "OFFEN" },
    select: { id: true, mitgliedId: true, handelsname: true },
    take: 200,
  });
}

/**
 * Benachrichtigt und schliesst die Vorschlaege. Erst die Nachricht, dann der
 * Status: bricht es dazwischen ab, bleibt der Vorschlag offen und ein zweiter
 * Klick holt es nach (schlimmstenfalls eine doppelte Nachricht, nie eine fehlende).
 */
async function abschliessen(
  offene: { id: string; mitgliedId: string }[],
  status: Exclude<VorschlagStatus, "OFFEN">,
  nachricht: { art: BenachrichtigungArt; text: string; link: string | null },
  felder: { strainId?: string; begruendung?: string | null },
) {
  await benachrichtigen(nachrichtenFuer(offene.map((v) => v.mitgliedId), nachricht));
  const prisma = await getPrisma();
  await prisma.sortenVorschlag.updateMany({
    where: { id: { in: offene.map((v) => v.id) }, status: "OFFEN" },
    data: { status, entschiedenAm: new Date(), ...felder },
  });
}

/** Hersteller finden oder mit der Id-Regel des Importskripts anlegen. */
async function herstellerSichern(name: string): Promise<string | null> {
  const schluessel = unternehmensSchluessel(name);
  if (!schluessel) return null;
  const prisma = await getPrisma();
  const id = await unternehmensIdAusSchluessel(schluessel);
  const vorhanden = await prisma.unternehmen.findFirst({
    where: { OR: [{ id }, { name: name.trim(), rolle: { in: ["HERSTELLER", "BEIDES"] } }] },
    select: { id: true },
  });
  if (vorhanden) return vorhanden.id;
  try {
    await prisma.unternehmen.create({ data: { id, name: name.trim(), rolle: "HERSTELLER" } });
  } catch (fehler) {
    if (!istEindeutigkeitsfehler(fehler)) throw fehler;
  }
  return id;
}

function neuLaden(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/mitglied");
  revalidatePath("/produkte");
  if (slug) revalidatePath(`/produkte/${slug}`);
}

export async function blueteFreigeben(formData: FormData): Promise<AdminVorschlagErgebnis> {
  await adminErforderlich();

  const geprueft = blueteFreigabePruefen(formData, await terpenNamen());
  if (!geprueft.ok) return geprueft;
  const w = geprueft.wert;

  const offene = await offeneLaden(w.vorschlagSchluessel);
  if (offene.length === 0) return { ok: false, fehler: "Zu diesem Vorschlag ist nichts mehr offen." };

  const strainId = await strainIdAusSlug(w.slug);
  const vorhanden = await blueteVorhanden(w.slug, w.handelsname);
  const konflikt = freigabeKonflikt(strainId, vorhanden);
  if (konflikt) {
    return {
      ok: false,
      fehler: `Unter diesem Namen steht schon eine Blüte im Katalog (${konflikt.slug}). Ordne die Vorschläge ihr zu.`,
    };
  }

  const prisma = await getPrisma();
  // Gibt es die Bluete mit genau dieser Id schon (Doppelklick, Import), bleibt
  // sie, wie sie ist: nur die Vorschlaege werden geschlossen.
  if (!vorhanden) {
    const herstellerId = w.hersteller ? await herstellerSichern(w.hersteller) : null;
    try {
      await prisma.strain.create({
        data: {
          id: strainId,
          slug: w.slug,
          handelsname: w.handelsname,
          darreichungsform: "BLUETE",
          kultivarName: w.kultivarName,
          kultivarTyp: w.kultivarTyp,
          thcMinProzent: w.thcMin,
          thcMaxProzent: w.thcMax,
          cbdMinProzent: w.cbdMin,
          cbdMaxProzent: w.cbdMax,
          bestrahlung: w.bestrahlung,
          anbauland: w.anbauland,
          herstellerId,
          // wie das Importskript: Name, Kultivar, Genetik klein
          suchtext: [w.handelsname, w.kultivarName].filter(Boolean).join(" ").toLowerCase(),
        },
      });
    } catch (fehler) {
      if (!istEindeutigkeitsfehler(fehler)) throw fehler;
    }

    if (w.terpene.length) {
      const terpene = await prisma.terpen.findMany({
        where: { name: { in: w.terpene } },
        select: { id: true, name: true },
      });
      const idNachName = new Map(terpene.map((t) => [t.name, t.id]));
      await prisma.strainTerpen.deleteMany({ where: { strainId } });
      await prisma.strainTerpen.createMany({
        data: w.terpene
          .filter((name) => idNachName.has(name))
          .map((name, index) => ({ strainId, terpenId: idNachName.get(name)!, rang: index + 1 })),
      });
    }
  }

  const slug = vorhanden?.slug ?? w.slug;
  const name = vorhanden?.handelsname ?? w.handelsname;
  await abschliessen(
    offene,
    "FREIGEGEBEN",
    { art: "VORSCHLAG_FREIGEGEBEN", text: textFreigegeben(name), link: `/produkte/${slug}` },
    { strainId: vorhanden?.id ?? strainId },
  );
  neuLaden(slug);
  return { ok: true };
}

export async function blueteAblehnen(formData: FormData): Promise<AdminVorschlagErgebnis> {
  await adminErforderlich();

  const schluessel = String(formData.get("vorschlagSchluessel") ?? "").trim();
  const begruendung = String(formData.get("begruendung") ?? "").trim().slice(0, 300) || null;
  if (!schluessel) return { ok: false, fehler: "Kein Vorschlag angegeben." };

  const offene = await offeneLaden(schluessel);
  if (offene.length === 0) return { ok: false, fehler: "Zu diesem Vorschlag ist nichts mehr offen." };

  await abschliessen(
    offene,
    "ABGELEHNT",
    { art: "VORSCHLAG_ABGELEHNT", text: textAbgelehnt(offene[0].handelsname, begruendung), link: "/mitglied" },
    { begruendung },
  );
  neuLaden();
  return { ok: true };
}

export async function blueteZuordnen(formData: FormData): Promise<AdminVorschlagErgebnis> {
  await adminErforderlich();

  const schluessel = String(formData.get("vorschlagSchluessel") ?? "").trim();
  const strainId = String(formData.get("strainId") ?? "").trim();
  if (!schluessel) return { ok: false, fehler: "Kein Vorschlag angegeben." };
  if (!strainId) return { ok: false, fehler: "Bitte eine Blüte aus dem Katalog wählen." };

  const prisma = await getPrisma();
  const strain = await prisma.strain.findUnique({
    where: { id: strainId },
    select: { id: true, slug: true, handelsname: true },
  });
  if (!strain) return { ok: false, fehler: "Diese Blüte gibt es nicht." };

  const offene = await offeneLaden(schluessel);
  if (offene.length === 0) return { ok: false, fehler: "Zu diesem Vorschlag ist nichts mehr offen." };

  await abschliessen(
    offene,
    "FREIGEGEBEN",
    { art: "VORSCHLAG_FREIGEGEBEN", text: textFreigegeben(strain.handelsname), link: `/produkte/${strain.slug}` },
    { strainId: strain.id },
  );
  neuLaden(strain.slug);
  return { ok: true };
}
```

Hinweis: Die Test-Regex in Step 1 verlangt, dass `await benachrichtigen(` im Quelltext vor `sortenVorschlag.updateMany(` steht. Das ist in `abschliessen` erfüllt.

- [ ] **Step 4: Freigabe-Formular** (`components/admin/BlueteFreigabe.tsx`)

```tsx
"use client";

import { blueteAblehnen, blueteFreigeben, blueteZuordnen } from "@/app/admin/vorschlag-aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Input, Meldung, Select } from "@/components/ui";
import type { SelectOption } from "@/components/ui";
import { BESTRAHLUNGEN, KULTIVAR_TYPEN } from "@/db/enums";
import { MAX_FREIGABE_TERPENE, type FreigabeVorbelegung } from "@/lib/vorschlag-eingabe";

type Props = {
  schluessel: string;
  vorbelegung: FreigabeVorbelegung;
  terpene: readonly string[];
  katalog: readonly SelectOption[];
};

const TYPEN: SelectOption[] = KULTIVAR_TYPEN.map((t) => ({ wert: t, label: t }));
const BESTRAHLUNG: SelectOption[] = BESTRAHLUNGEN.map((b) => ({ wert: b, label: b }));

/** Drei Wege fuer eine Gruppe: freigeben (Bluete anlegen), zuordnen, ablehnen. */
export function BlueteFreigabe({ schluessel, vorbelegung: v, terpene, katalog }: Props) {
  const freigabe = useAktion();
  const zuordnung = useAktion();
  const ablehnung = useAktion();
  const terpenOptionen: SelectOption[] = terpene.map((t) => ({ wert: t, label: t }));
  const id = (feld: string) => `freigabe-${schluessel}-${feld}`;

  function senden(aktion: typeof freigabe, lauf: (fd: FormData) => Promise<{ ok: true } | { ok: false; fehler: string }>) {
    return (ereignis: React.FormEvent<HTMLFormElement>) => {
      ereignis.preventDefault();
      const daten = new FormData(ereignis.currentTarget);
      aktion.ausfuehren(() => lauf(daten));
    };
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={senden(freigabe, blueteFreigeben)} className="flex flex-col gap-6">
        <input type="hidden" name="vorschlagSchluessel" value={schluessel} />
        <Input id={id("name")} name="handelsname" label="Handelsname" pflicht required defaultValue={v.handelsname} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input id={id("kultivar")} name="kultivarName" label="Kultivar" defaultValue={v.kultivarName} />
          <Select id={id("typ")} name="kultivarTyp" label="Typ" required optionen={TYPEN}
            platzhalter="Bitte wählen" defaultValue={v.kultivarTyp} />
          <Input id={id("thcmin")} name="thcMin" label="THC von %" required inputMode="decimal" defaultValue={v.thcMin} />
          <Input id={id("thcmax")} name="thcMax" label="THC bis %" required inputMode="decimal" defaultValue={v.thcMax} />
          <Input id={id("cbdmin")} name="cbdMin" label="CBD von %" required inputMode="decimal" defaultValue={v.cbdMin} />
          <Input id={id("cbdmax")} name="cbdMax" label="CBD bis %" required inputMode="decimal" defaultValue={v.cbdMax} />
          <Input id={id("hersteller")} name="hersteller" label="Hersteller" defaultValue={v.hersteller} />
          <Input id={id("land")} name="anbauland" label="Anbauland" />
          <Select id={id("bestrahlung")} name="bestrahlung" label="Bestrahlung" optionen={BESTRAHLUNG} defaultValue="UNBEKANNT" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: MAX_FREIGABE_TERPENE }, (_, i) => (
            <Select key={i} id={id(`terpen${i + 1}`)} name={`terpen${i + 1}`} label={`Terpen Rang ${i + 1}`}
              optionen={terpenOptionen} platzhalter="Keines" defaultValue={v.terpene[i] ?? ""} />
          ))}
        </div>
        {freigabe.fehler ? <Meldung art="fehler">{freigabe.fehler}</Meldung> : null}
        <div>
          <Button type="submit" disabled={!freigabe.bereit}>
            {freigabe.laeuft ? "Wird angelegt …" : "Freigeben und anlegen"}
          </Button>
        </div>
      </form>

      <form onSubmit={senden(zuordnung, blueteZuordnen)} className="flex flex-col gap-4">
        <input type="hidden" name="vorschlagSchluessel" value={schluessel} />
        <Select id={id("zuordnen")} name="strainId" label="Oder einer vorhandenen Blüte zuordnen" optionen={katalog}
          platzhalter="Blüte wählen" required />
        {zuordnung.fehler ? <Meldung art="fehler">{zuordnung.fehler}</Meldung> : null}
        <div>
          <Button type="submit" variante="secondary" disabled={!zuordnung.bereit}>
            {zuordnung.laeuft ? "Wird zugeordnet …" : "Zuordnen"}
          </Button>
        </div>
      </form>

      <form onSubmit={senden(ablehnung, blueteAblehnen)} className="flex flex-col gap-4">
        <input type="hidden" name="vorschlagSchluessel" value={schluessel} />
        <Input id={id("grund")} name="begruendung" label="Begründung (sieht das Mitglied)" maxLength={300} />
        {ablehnung.fehler ? <Meldung art="fehler">{ablehnung.fehler}</Meldung> : null}
        <div>
          <Button type="submit" variante="ghost" disabled={!ablehnung.bereit}>
            {ablehnung.laeuft ? "Wird abgelehnt …" : "Ablehnen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

Vor dem Schreiben prüfen, dass `Button` die Prop `variante` heißt (`grep -n "variante" components/ui/Button.tsx`) und `Select` `defaultValue` durchreicht.

- [ ] **Step 5: Abschnitt** (`components/admin/BlueteVorschlaege.tsx`)

```tsx
import { BlueteFreigabe } from "@/components/admin/BlueteFreigabe";
import { Badge, Card, CardBody, CardHeader, EmptyState, textLinkKlassen } from "@/components/ui";
import { ladeStrainAuswahl } from "@/lib/query/strains";
import { offeneVorschlaegeFuerAdmin, terpenNamen } from "@/lib/query/vorschlaege";
import { freigabeVorbelegen, quelleAlsLink, vorschlaegeBuendeln } from "@/lib/vorschlag-eingabe";

const DATUM = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

/** Offene Bluetenvorschlaege, gleiche gebuendelt, aelteste zuerst (Spec 4.2). */
export async function BlueteVorschlaege() {
  const [offene, terpene, strains] = await Promise.all([
    offeneVorschlaegeFuerAdmin(),
    terpenNamen(),
    ladeStrainAuswahl(),
  ]);
  const gruppen = vorschlaegeBuendeln(offene);
  const katalog = strains.map((s) => ({ wert: s.id, label: s.handelsname }));

  return (
    <section aria-labelledby="vorschlaege-titel">
      <Card>
        <CardHeader>
          <h2 id="vorschlaege-titel" className="text-h3 text-text">
            Vorgeschlagene Blüten
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-8">
          {gruppen.length === 0 ? (
            <EmptyState titel="Keine offenen Vorschläge" beschreibung="Neue Vorschläge der Mitglieder erscheinen hier." />
          ) : (
            gruppen.map((gruppe) => (
              <article key={gruppe.schluessel} className="flex flex-col gap-6 border-t border-border pt-8 first:border-t-0 first:pt-0">
                <header className="flex flex-wrap items-center gap-4">
                  <h3 className="text-h3 text-text wrap-break-word">{gruppe.vorschlaege[0].handelsname}</h3>
                  <Badge variante="accent">
                    {gruppe.vorschlaege.length === 1 ? "1 Vorschlag" : `${gruppe.vorschlaege.length} Vorschläge`}
                  </Badge>
                </header>
                <ul className="flex flex-col gap-4">
                  {gruppe.vorschlaege.map((v) => {
                    const link = quelleAlsLink(v.quelle);
                    return (
                      <li key={v.id} className="text-small text-text">
                        <span className="font-medium">{v.anzeigename}</span>
                        <span className="text-text-muted">, {DATUM.format(v.erstelltAm)}. Quelle: </span>
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer nofollow" className={textLinkKlassen}>
                            {v.quelle}
                          </a>
                        ) : (
                          <span>{v.quelle}</span>
                        )}
                        {v.notiz ? <span className="block text-text-muted">{v.notiz}</span> : null}
                      </li>
                    );
                  })}
                </ul>
                <BlueteFreigabe
                  schluessel={gruppe.schluessel}
                  vorbelegung={freigabeVorbelegen(gruppe)}
                  terpene={terpene}
                  katalog={katalog}
                />
              </article>
            ))
          )}
        </CardBody>
      </Card>
    </section>
  );
}
```

Die Aufrufform von `textLinkKlassen` wie in Task 5 Step 4 geprüft verwenden. Prüfen, dass `EmptyState` `titel`/`beschreibung` ohne `aktion` akzeptiert.

- [ ] **Step 6: In `app/admin/page.tsx` einhängen**

Import ergänzen: `import { BlueteVorschlaege } from "@/components/admin/BlueteVorschlaege";`
Nach dem `UmfrageBereich`-Suspense einfügen:

```tsx
        <Suspense fallback={<Spinner text="Vorschläge werden geladen" />}>
          <BlueteVorschlaege />
        </Suspense>
```

- [ ] **Step 7: Tests, Typecheck, Lint**

Run: `npm test 2>&1 | tail -8 && npm run typecheck && npx eslint app/admin components/admin`
Expected: alle PASS.

- [ ] **Step 8: Commit**

```bash
git add app/admin components/admin tests/bluete-vorschlagen.test.ts
git commit -m "feat: Admin prueft Bluetenvorschlaege (freigeben, zuordnen, ablehnen)"
```

---

### Task 7: Benachrichtigungen im Mitgliederbereich und Zähler im Kopf

**Files:**
- Create: `app/api/benachrichtigungen/route.ts`, `components/layout/KontoZaehler.tsx`, `components/mitglied/GelesenMarkieren.tsx`
- Modify: `components/layout/Kopf.tsx` (Konto-Pille Z. 63–69), `app/mitglied/page.tsx`, `app/mitglied/aktionen.ts`
- Test: `tests/bluete-vorschlagen.test.ts` (ergänzen)

**Interfaces:**
- Consumes: `aktuellesMitglied`, `mitgliedErforderlich`; `ungeleseneAnzahl`, `benachrichtigungenLaden` (Task 4); `eigeneVorschlaege` (Task 4).
- Produces: `GET /api/benachrichtigungen` → `{ ungelesen: number }` (Header `Cache-Control: private, no-store`); Server Action `benachrichtigungenGelesen(): Promise<void>`; Custom-Event `"benachrichtigungen-gelesen"` auf `window`.

- [ ] **Step 1: Failing test ergänzen**

```ts
test("Zaehler: Kopf bleibt statisch, Zahl kommt aus der API", () => {
  const kopf = lies("components/layout/Kopf.tsx");
  assert.match(kopf, /<KontoZaehler \/>/);
  assert.doesNotMatch(kopf, /aktuellesMitglied|headers\(\)|cookies\(\)/);
  const route = lies("app/api/benachrichtigungen/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /private, no-store/);
  const zaehler = lies("components/layout/KontoZaehler.tsx");
  assert.match(zaehler, /sr-only/);
  assert.match(zaehler, /sessionStorage/);
});

test("Mitgliederbereich: Benachrichtigungen und eigene Vorschlaege", () => {
  const seite = lies("app/mitglied/page.tsx");
  assert.match(seite, /benachrichtigungenLaden\(mitglied\.mitgliedId\)/);
  assert.match(seite, /eigeneVorschlaege\(mitglied\.mitgliedId\)/);
  assert.match(seite, /<GelesenMarkieren/);
  assert.match(lies("app/mitglied/aktionen.ts"), /export async function benachrichtigungenGelesen/);
});
```

- [ ] **Step 2: Test laufen lassen, muss scheitern**

Run: `npm test 2>&1 | tail -12`
Expected: FAIL.

- [ ] **Step 3: Route** (`app/api/benachrichtigungen/route.ts`)

```ts
import { NextResponse } from "next/server";

import { ungeleseneAnzahl } from "@/lib/query/benachrichtigungen";
import { aktuellesMitglied } from "@/lib/session";

/**
 * Anzahl ungelesener Benachrichtigungen fuer den Zaehler im Kopf. Der Kopf
 * liest bewusst keine Sitzung (sonst waere jede Seite dynamisch); er fragt
 * hier im Browser nach. Ohne Anmeldung 0, nie ein Fehler.
 */
export async function GET() {
  const mitglied = await aktuellesMitglied();
  const ungelesen = mitglied ? await ungeleseneAnzahl(mitglied.mitgliedId) : 0;
  return NextResponse.json({ ungelesen }, { headers: { "Cache-Control": "private, no-store" } });
}
```

- [ ] **Step 4: Zähler** (`components/layout/KontoZaehler.tsx`)

```tsx
"use client";

import { useEffect, useState } from "react";

const SPEICHER = "benachrichtigungen-ungelesen";
const GUELTIG_MS = 60_000;

/**
 * Zahl ungelesener Benachrichtigungen an der Konto-Pille. Holt sie einmal
 * nach dem Laden und merkt sie sich 60 s in sessionStorage, damit nicht jede
 * Seite eine Anfrage kostet. /mitglied loest "benachrichtigungen-gelesen" aus.
 */
export function KontoZaehler() {
  const [anzahl, setAnzahl] = useState(0);

  useEffect(() => {
    let aktiv = true;
    try {
      const roh = sessionStorage.getItem(SPEICHER);
      if (roh) {
        const { wert, zeit } = JSON.parse(roh) as { wert: number; zeit: number };
        if (Date.now() - zeit < GUELTIG_MS) {
          setAnzahl(wert);
          return;
        }
      }
    } catch {
      // Speicher gesperrt: dann eben fragen.
    }
    fetch("/api/benachrichtigungen", { credentials: "same-origin" })
      .then((antwort) => (antwort.ok ? antwort.json() : { ungelesen: 0 }))
      .then(({ ungelesen }: { ungelesen: number }) => {
        if (!aktiv) return;
        setAnzahl(ungelesen);
        try {
          sessionStorage.setItem(SPEICHER, JSON.stringify({ wert: ungelesen, zeit: Date.now() }));
        } catch {}
      })
      .catch(() => {});
    return () => {
      aktiv = false;
    };
  }, []);

  useEffect(() => {
    function gelesen() {
      setAnzahl(0);
      try {
        sessionStorage.setItem(SPEICHER, JSON.stringify({ wert: 0, zeit: Date.now() }));
      } catch {}
    }
    window.addEventListener("benachrichtigungen-gelesen", gelesen);
    return () => window.removeEventListener("benachrichtigungen-gelesen", gelesen);
  }, []);

  if (anzahl === 0) return null;
  return (
    <span className="numeric ml-2 inline-grid min-w-6 place-items-center rounded-full bg-accent px-2 text-caption text-accent-fg">
      <span aria-hidden="true">{anzahl}</span>
      <span className="sr-only">
        {anzahl === 1 ? "1 ungelesene Benachrichtigung" : `${anzahl} ungelesene Benachrichtigungen`}
      </span>
    </span>
  );
}
```

Hinweis: `min-w-6` = 24 px, `px-2` = 8 px, beides auf der Leiter. Das `ml-2` (8 px) trennt die Zahl vom Wort.

- [ ] **Step 5: In `components/layout/Kopf.tsx` einhängen**

Import: `import { KontoZaehler } from "@/components/layout/KontoZaehler";`
In der Konto-Pille nach `{KONTO_LINK.text}` einfügen: `<KontoZaehler />`

- [ ] **Step 6: Gelesen markieren**

In `app/mitglied/aktionen.ts` anfügen (die Datei hat schon `"use server"`; fehlende Imports `getPrisma`, `mitgliedErforderlich`, `revalidatePath` ergänzen, falls nicht vorhanden):

```ts
/** Alle Benachrichtigungen des angemeldeten Mitglieds als gelesen markieren. */
export async function benachrichtigungenGelesen(): Promise<void> {
  const mitglied = await mitgliedErforderlich();
  const prisma = await getPrisma();
  await prisma.benachrichtigung.updateMany({
    where: { mitgliedId: mitglied.mitgliedId, gelesenAm: null },
    data: { gelesenAm: new Date() },
  });
}
```

`components/mitglied/GelesenMarkieren.tsx`:

```tsx
"use client";

import { useEffect } from "react";

import { benachrichtigungenGelesen } from "@/app/mitglied/aktionen";

/** Markiert nach dem Anzeigen einmal alles als gelesen und setzt den Zaehler im Kopf auf 0. */
export function GelesenMarkieren({ ungelesen }: { ungelesen: number }) {
  useEffect(() => {
    if (ungelesen === 0) return;
    void benachrichtigungenGelesen()
      .then(() => window.dispatchEvent(new Event("benachrichtigungen-gelesen")))
      .catch(() => {});
  }, [ungelesen]);
  return null;
}
```

- [ ] **Step 7: Abschnitte in `app/mitglied/page.tsx`**

Imports ergänzen:

```tsx
import { GelesenMarkieren } from "@/components/mitglied/GelesenMarkieren";
import { benachrichtigungenLaden } from "@/lib/query/benachrichtigungen";
import { eigeneVorschlaege } from "@/lib/query/vorschlaege";
import type { VorschlagStatus } from "@/db/enums";
```

Nach `if (!mitglied) redirect(...)`:

```tsx
  const [nachrichten, vorschlaege] = await Promise.all([
    benachrichtigungenLaden(mitglied.mitgliedId),
    eigeneVorschlaege(mitglied.mitgliedId),
  ]);
  const ungelesen = nachrichten.filter((n) => !n.gelesen).length;
```

Auf Modulebene:

```tsx
const DATUM_KURZ = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

const STATUS_BADGE: Record<VorschlagStatus, { text: string; variante: "warning" | "success" | "danger" }> = {
  OFFEN: { text: "Wird geprüft", variante: "warning" },
  FREIGEGEBEN: { text: "Im Katalog", variante: "success" },
  ABGELEHNT: { text: "Abgelehnt", variante: "danger" },
};
```

Nach der Status-Section (vor dem Admin-Abschnitt) einfügen:

```tsx
      <section aria-labelledby="nachrichten-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="nachrichten-titel" className="text-h3 text-text">
              Benachrichtigungen
            </h2>
          </CardHeader>
          <CardBody>
            {nachrichten.length === 0 ? (
              <p className="text-body text-text-muted">Noch nichts Neues.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {nachrichten.map((n) => (
                  <li key={n.id} className="flex flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-2 text-small text-text-muted">
                      <span className="numeric">{DATUM_KURZ.format(n.erstelltAm)}</span>
                      {!n.gelesen ? <Badge variante="accent">Neu</Badge> : null}
                    </span>
                    {n.link ? (
                      <Link href={n.link} className={textLinkKlassen}>
                        {n.text}
                      </Link>
                    ) : (
                      <span className="text-body text-text">{n.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <GelesenMarkieren ungelesen={ungelesen} />
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="vorschlaege-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="vorschlaege-titel" className="text-h3 text-text">
              Meine Vorschläge
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col items-start gap-6">
            {vorschlaege.length === 0 ? (
              <p className="text-body text-text-muted">Du hast noch keine Blüte vorgeschlagen.</p>
            ) : (
              <ul className="flex w-full flex-col gap-4">
                {vorschlaege.map((v) => (
                  <li key={v.id} className="flex flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      {v.strainSlug ? (
                        <Link href={`/produkte/${v.strainSlug}`} className={textLinkKlassen}>
                          {v.handelsname}
                        </Link>
                      ) : (
                        <span className="text-body text-text wrap-break-word">{v.handelsname}</span>
                      )}
                      <Badge variante={STATUS_BADGE[v.status].variante}>{STATUS_BADGE[v.status].text}</Badge>
                    </span>
                    {v.status === "ABGELEHNT" && v.begruendung ? (
                      <span className="text-small text-text-muted">Grund: {v.begruendung}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/vorschlagen" className={buttonKlassen("secondary")}>
              Blüte vorschlagen
            </Link>
          </CardBody>
        </Card>
      </section>
```

Import aus `@/components/ui` um `textLinkKlassen` erweitern (Aufrufform wie in Task 5 geprüft).

- [ ] **Step 8: Tests, Typecheck, Lint, Farben**

Run: `npm test 2>&1 | tail -8 && npm run typecheck && npx eslint app components lib && npm run farben`
Expected: alle PASS.

- [ ] **Step 9: Commit**

```bash
git add app/api/benachrichtigungen components/layout/KontoZaehler.tsx components/layout/Kopf.tsx components/mitglied app/mitglied tests/bluete-vorschlagen.test.ts
git commit -m "feat: Benachrichtigungen im Mitgliederbereich und Zaehler an Mein Konto"
```

---

### Task 8: Live stellen und prüfen

**Files:** keine Codeänderung; `HANDOFF.md`.

- [ ] **Step 1: Remote-Migration** (additiv, neue Tabellen; muss vor dem Code live sein)

Run (Skill `cloudflare:wrangler` laden):
```bash
npm run db:migrate:remote
npm run db:constraints:remote
```
Expected: `0006_sorten_vorschlaege.sql` angewendet, Trigger gesetzt. Bei Netzfehler: stoppen, nicht wiederholen, dem Nutzer den Befehl geben.

- [ ] **Step 2: Push**

Vorher prüfen, dass kein Build läuft (`gh api repos/bratzi/cn-medcan/commits/<letzter-sha>/check-runs`), dann einmal `git push origin main`. Danach rund 15 Minuten nicht erneut pushen.

- [ ] **Step 3: Live prüfen per Browser-MCP** (Chrome im Vordergrund, Nutzer angemeldet als Admin)

1. `/vorschlagen`: Formular sichtbar; Vorschlag „Testblüte Vorschlag 1“ mit Quelle „Packung“ absenden → Erfolgsmeldung.
2. Gleichen Namen erneut → Meldung „schon vorgeschlagen“. Namen einer vorhandenen Blüte → Meldung mit Link.
3. `/produkte?q=gibtsnicht` → leerer Zustand mit „Blüte vorschlagen“, Link trägt `?name=gibtsnicht`.
4. `/admin` → Abschnitt „Vorgeschlagene Blüten“ mit der Testblüte; Typ, THC/CBD ergänzen, „Freigeben und anlegen“.
5. `/produkte/testbluete-vorschlag-1` lädt ohne 500.
6. Kopf: Zähler an „Mein Konto“ zeigt 1; `/mitglied` zeigt die Benachrichtigung mit „Neu“ und „Im Katalog“; nach Neuladen ist der Zähler weg.
7. Aufräumen nach Rückfrage beim Nutzer: Testblüte per `wrangler d1 execute cn-medcan-db --remote --command "delete from strains where slug = 'testbluete-vorschlag-1'"` entfernen (Vorschlag behält `strain_id = NULL`), oder stehen lassen.

- [ ] **Step 4: HANDOFF aktualisieren, committen, pushen**

In „Hier geht es weiter“: was live und geprüft ist, was nicht, offene Punkte (Mail später, Import-Anbindung nach Spec 4.4 beim JSON-Import).
