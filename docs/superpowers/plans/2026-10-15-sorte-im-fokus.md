# Sorte im Fokus – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Sorte (Kultivar) wird Hauptobjekt: Bewertung = Sorte + Vertreiber (Stärke optional), `/blueten/[slug]` wird Sortenseite, Startseite bekommt einen klickbaren Sorten-Explorer.

**Architecture:** Additive D1-Migration (Kultivar-Slug, Review-Spalten `kultivar_id`, `vertreiber_id`, `ware_genau`, neue Tabelle `kultivar_vertreiber_kennwerte`); `Review.strainId` bleibt Pflicht. Schreibpfad (`bewertungPruefen`, `bewertungSpeichern`, `kennwerteFortschreiben`) zuerst, danach drei parallele Stränge in eigenen Worktrees: Sortenseite, Explorer, Anzeige überall; dazu ein Kleinkram-Strang.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), Prisma + D1 (SQLite), Tests `npm test` (tsx --test), `npm run typecheck`, `npm run lint`.

**Spec:** `docs/superpowers/specs/2026-10-15-sorte-im-fokus-design.md`

## Global Constraints

- Next.js weicht ab: vor Code `node_modules/next/dist/docs/` lesen (AGENTS.md).
- Kein `next dev/build` lokal; pushen und live prüfen (Memory live-statt-dev).
- Free-Plan-CPU 10 ms: keine GROUP BY/Aggregation je Seitenaufruf; Kennwerte beim Speichern fortschreiben.
- HWG: Vertreiber/Sorten nie nach Note sortieren; Reihenfolge Bewertungsanzahl, dann Name. Keine Wirkaussagen.
- Remote-D1 spielt Claude selbst ein: `npx wrangler d1 execute <db> --remote --file migrations/0024_sorte_im_fokus.sql` (nicht `migrations apply`).
- Design-Tokens und Regeln aus `ui-design-engine`; Texte deutsch und englisch in `lib/i18n/de.ts` und `en.ts`.
- Eine Bewertung je Mitglied + Sorte + Vertreiber.

## Review Focus

- Sorte mit genau einem Vertreiber und einem Produkt: Formular zeigt Vertreiber vorgewählt, keine Stärkenwahl, `ware_genau = 1`.
- Vertreiber führt mehrere Stärken, Mitglied wählt „Weiß ich nicht“: gespeichert mit `ware_genau = 0`, Anzeige zeigt keine Stärke.
- Mitglied bearbeitet eine alte Bewertung (vor Migration, Produkt bekannt): Vorbelegung wählt Vertreiber + Stärke, kein Duplikat entsteht.
- Alter Lesezeichen-Link `/blueten/<produkt-slug>#eintrag-…`: 308 auf Sortenseite mit `?ware=`, Anker bleibt erhalten.
- Explorer ohne JavaScript bzw. bei leerem Datensatz: Kapitel zeigt Kopf, Absatz und ersten Sorteneintrag statisch, kein leerer Kasten.

---

## Strang A (seriell, zuerst, im Hauptbaum)

### Task 1: Migration und Schema

**Skills:** cloudflare-d1, migration, prisma-cli, edge-stack-master

**Files:**
- Create: `migrations/0024_sorte_im_fokus.sql`, `scripts/kultivar-slugs.ts`, `tests/kultivar-slug.test.ts`
- Modify: `prisma/schema.prisma` (Kultivar, Review, Unternehmen, neues Modell), `lib/stamm-id.ts` (nur nutzen)

**Interfaces:**
- Produces: `kultivarSlugs(namen: {id: string; name: string}[]): Map<string, string>` in `lib/kultivar-slug.ts`; Prisma-Felder `Kultivar.slug`, `Review.kultivarId`, `Review.vertreiberId`, `Review.wareGenau`, Modell `KultivarVertreiberKennwerte { kultivarId, vertreiberId, anzahl, gesamtnoteMittel }`.

- [ ] **Step 1: Failing test**

```ts
// tests/kultivar-slug.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { kultivarSlugs } from "@/lib/kultivar-slug";

test("Slugs aus Namen, Kollision bekommt Zähler", () => {
  const m = kultivarSlugs([
    { id: "a", name: "8 Ball Kush" },
    { id: "b", name: "8-Ball Kush" },
    { id: "c", name: "Gelato" },
  ]);
  assert.equal(m.get("a"), "8-ball-kush");
  assert.equal(m.get("b"), "8-ball-kush-2");
  assert.equal(m.get("c"), "gelato");
});
```

- [ ] **Step 2:** `npm test -- --test-name-pattern=Slugs` → FAIL (Modul fehlt).

- [ ] **Step 3: Implementierung**

```ts
// lib/kultivar-slug.ts
import { slugAusName } from "@/lib/stamm-id";

/** Eindeutige Slugs je Kultivar; Reihenfolge nach id, damit der Lauf wiederholbar ist. */
export function kultivarSlugs(kultivare: readonly { id: string; name: string }[]): Map<string, string> {
  const vergeben = new Set<string>();
  const ergebnis = new Map<string, string>();
  for (const k of [...kultivare].sort((a, b) => a.id.localeCompare(b.id))) {
    const basis = slugAusName(k.name);
    let slug = basis;
    for (let n = 2; vergeben.has(slug); n++) slug = `${basis}-${n}`;
    vergeben.add(slug);
    ergebnis.set(k.id, slug);
  }
  return ergebnis;
}
```

- [ ] **Step 4:** Test PASS.

- [ ] **Step 5: Schema**

```prisma
model Kultivar {
  // …bestehend
  slug String? @unique
  reviews Review[]
  vertreiberKennwerte KultivarVertreiberKennwerte[]
}
model Review {
  // …bestehend
  kultivarId   String?      @map("kultivar_id")
  kultivar     Kultivar?    @relation(fields: [kultivarId], references: [id], onDelete: SetNull)
  vertreiberId String?      @map("vertreiber_id")
  vertreiber   Unternehmen? @relation("ReviewVertreiber", fields: [vertreiberId], references: [id], onDelete: SetNull)
  /// 1 = Produkt (Stärke) bekannt; 0 = nur Vertreiber gewählt, strainId ist dann Platzhalter (Spec 2026-10-15).
  wareGenau    Boolean      @default(true) @map("ware_genau")
  @@index([autorId, kultivarId, vertreiberId])
}
/// Note je Sorte und Vertreiber, beim Speichern fortgeschrieben (Spec 2026-10-15).
model KultivarVertreiberKennwerte {
  kultivarId       String      @map("kultivar_id")
  vertreiberId     String      @map("vertreiber_id")
  kultivar         Kultivar    @relation(fields: [kultivarId], references: [id], onDelete: Cascade)
  vertreiber       Unternehmen @relation(fields: [vertreiberId], references: [id], onDelete: Cascade)
  anzahl           Int
  gesamtnoteMittel Float?      @map("gesamtnote_mittel")
  aktualisiertAm   DateTime    @updatedAt @map("aktualisiert_am")
  @@id([kultivarId, vertreiberId])
  @@map("kultivar_vertreiber_kennwerte")
}
```
Gegenrelationen in `Unternehmen` ergänzen (`reviews Review[] @relation("ReviewVertreiber")`, `kultivarKennwerte KultivarVertreiberKennwerte[]`). `npx prisma generate`.

- [ ] **Step 6: Migration-SQL** (`scripts/kultivar-slugs.ts` liest Remote-Kultivare per `wrangler d1 execute --remote --json --command "SELECT id,name FROM kultivare"` und hängt die `UPDATE kultivare SET slug=…`-Zeilen an)

```sql
-- migrations/0024_sorte_im_fokus.sql (Spec 2026-10-15). Per wrangler d1 execute --file, wiederholbar.
ALTER TABLE kultivare ADD COLUMN slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS kultivare_slug_key ON kultivare(slug);
ALTER TABLE reviews ADD COLUMN kultivar_id TEXT REFERENCES kultivare(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN vertreiber_id TEXT REFERENCES unternehmen(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN ware_genau INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS reviews_autor_kultivar_vertreiber_idx ON reviews(autor_id, kultivar_id, vertreiber_id);
UPDATE reviews SET
  kultivar_id = (SELECT kultivar_id FROM strains WHERE strains.id = reviews.strain_id),
  vertreiber_id = (SELECT vertreiber_id FROM strains WHERE strains.id = reviews.strain_id);
CREATE TABLE IF NOT EXISTS kultivar_vertreiber_kennwerte (
  kultivar_id TEXT NOT NULL REFERENCES kultivare(id) ON DELETE CASCADE,
  vertreiber_id TEXT NOT NULL REFERENCES unternehmen(id) ON DELETE CASCADE,
  anzahl INTEGER NOT NULL,
  gesamtnote_mittel REAL,
  aktualisiert_am DATETIME NOT NULL,
  PRIMARY KEY (kultivar_id, vertreiber_id)
);
-- darunter: generierte UPDATE kultivare SET slug = '…' WHERE id = '…';
```
Prüfen, dass `migrations/` Spaltennamen `strain_id`/`autor_id` so heißen (`grep -n "CREATE TABLE \"reviews\"" -A20 migrations/0001*`).

- [ ] **Step 7:** Remote einspielen (Global Constraints), dann lesend prüfen: `SELECT COUNT(*) FROM reviews WHERE vertreiber_id IS NULL` (erwartet: nur Bewertungen von Produkten ohne Vertreiber) und `SELECT COUNT(*) FROM kultivare WHERE slug IS NULL` = 0. Danach einmal `scripts/` Kennwert-Neuberechnung aus Task 2 Step 7.

- [ ] **Step 8: Commit** `feat(db): Sorte im Fokus – Kultivar-Slug, Vertreiber an der Bewertung`

### Task 2: Bewertung = Sorte + Vertreiber (Schreibpfad)

**Skills:** surgical-patch, test-driven-development, edge-stack-master, prisma-client-api

**Files:**
- Modify: `lib/bewertung-eingabe.ts`, `app/[lang]/blueten/[slug]/aktionen.ts`, `lib/kennwerte.ts`, `lib/i18n/de.ts`, `lib/i18n/en.ts`
- Create: `lib/ware-wahl.ts`, `tests/ware-wahl.test.ts`, `scripts/kennwerte-neu.ts`
- Test: `tests/bewertung-eingabe.test.ts` (bestehend erweitern)

**Interfaces:**
- Consumes: Task 1 Felder.
- Produces: `BewertungEingabe` mit `kultivarId: string; vertreiberId: string; strainId: string | null` (statt Pflicht-`strainId`); `waehleWare(produkte: WareProdukt[], vertreiberId: string, strainId: string | null): { ok: true; strainId: string; wareGenau: boolean } | { ok: false; grund: "vertreiberFremd" | "produktFremd" }` mit `type WareProdukt = { id: string; vertreiberId: string | null; handelsname: string; aktiv: boolean }`; `kennwerteFortschreiben(strainId)` schreibt zusätzlich `kultivarVertreiberKennwerte`.

- [ ] **Step 1: Failing tests**

```ts
// tests/ware-wahl.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { waehleWare } from "@/lib/ware-wahl";

const p = (id: string, v: string, h: string) => ({ id, vertreiberId: v, handelsname: h, aktiv: true });
const produkte = [p("x1", "V1", "B 22/1"), p("x2", "V1", "A 27/1"), p("y1", "V2", "C 20/1")];

test("ein Produkt beim Vertreiber: genau", () => {
  assert.deepEqual(waehleWare(produkte, "V2", null), { ok: true, strainId: "y1", wareGenau: true });
});
test("mehrere Stärken, keine gewählt: erstes nach Handelsname, ungenau", () => {
  assert.deepEqual(waehleWare(produkte, "V1", null), { ok: true, strainId: "x2", wareGenau: false });
});
test("Stärke gewählt: genau", () => {
  assert.deepEqual(waehleWare(produkte, "V1", "x1"), { ok: true, strainId: "x1", wareGenau: true });
});
test("fremder Vertreiber", () => {
  assert.deepEqual(waehleWare(produkte, "V9", null), { ok: false, grund: "vertreiberFremd" });
});
test("Produkt eines anderen Vertreibers", () => {
  assert.deepEqual(waehleWare(produkte, "V1", "y1"), { ok: false, grund: "produktFremd" });
});
```
In `tests/bewertung-eingabe.test.ts`: Formular ohne `vertreiberId` → `{ ok: false, fehler: { schluessel: "bewertung.vertreiberFehlt" } }`; ohne `kultivarId` → `bewertung.sorteFehlt`; mit `strainId=""` → `wert.strainId === null`.

- [ ] **Step 2:** `npm test` → neue Tests FAIL.

- [ ] **Step 3: Implementierung**

```ts
// lib/ware-wahl.ts
export type WareProdukt = { id: string; vertreiberId: string | null; handelsname: string; aktiv: boolean };
export type WareWahl = { ok: true; strainId: string; wareGenau: boolean } | { ok: false; grund: "vertreiberFremd" | "produktFremd" };

/**
 * Ordnet die Bewertung einem Produkt zu (Spec 2026-10-15, Abschnitt 1): ohne gewählte Stärke steht das
 * erste aktive Produkt des Vertreibers als Platzhalter, `wareGenau` sagt, ob die Stärke bekannt ist.
 */
export function waehleWare(produkte: readonly WareProdukt[], vertreiberId: string, strainId: string | null): WareWahl {
  const beimVertreiber = produkte.filter((p) => p.vertreiberId === vertreiberId && p.aktiv);
  if (beimVertreiber.length === 0) return { ok: false, grund: "vertreiberFremd" };
  if (strainId) {
    const treffer = beimVertreiber.find((p) => p.id === strainId);
    return treffer ? { ok: true, strainId: treffer.id, wareGenau: true } : { ok: false, grund: "produktFremd" };
  }
  const sortiert = [...beimVertreiber].sort((a, b) => a.handelsname.localeCompare(b.handelsname, "de"));
  return { ok: true, strainId: sortiert[0].id, wareGenau: beimVertreiber.length === 1 };
}
```
In `bewertungPruefen`: `strainId` wird optional (`text(...) || null`), neu Pflicht `kultivarId` (Fehler `bewertung.sorteFehlt`) und `vertreiberId` (Fehler `bewertung.vertreiberFehlt`). Neue Schlüssel in `de.ts`/`en.ts` unter `meldung.bewertung`: `vertreiberFehlt: "Wähle den Vertreiber deiner Ware."` / `"Pick the distributor of your batch."`, `wareFremd: "Diese Ware gehört nicht zu dieser Sorte."` / `"This product does not belong to this strain."`.

In `bewertungSpeichern` den Block ab `prisma.strain.findUnique` ersetzen:

```ts
const geprueft = bewertungPruefen(formData, bekannte.map((terpen) => terpen.name));
if (!geprueft.ok) return { ok: false, fehler: text(w, sprache, geprueft.fehler) };
const e = geprueft.wert;
const kultivar = await prisma.kultivar.findUnique({
  where: { id: e.kultivarId },
  select: { id: true, slug: true, strains: { select: { id: true, vertreiberId: true, handelsname: true, aktiv: true } } },
});
if (!kultivar) return { ok: false, fehler: text(w, sprache, { schluessel: "bewertung.sorteWeg" }) };
const ware = waehleWare(kultivar.strains, e.vertreiberId, e.strainId);
if (!ware.ok) return { ok: false, fehler: text(w, sprache, { schluessel: "bewertung.wareFremd" }) };
```
(Terpen-Abfrage vorziehen.) Charge-Upsert nutzt `ware.strainId`. Upsert ersetzen, weil der neue Schlüssel nullable Spalten hat:

```ts
// Eine Bewertung je Mitglied, Sorte und Vertreiber (Spec 2026-10-15); ältere je Produkt werden mitgefunden.
const bestehend = await prisma.review.findFirst({
  where: { autorId: mitglied.mitgliedId, kultivarId: kultivar.id, vertreiberId: e.vertreiberId },
  select: { id: true },
});
const zuordnungDaten = { strainId: ware.strainId, kultivarId: kultivar.id, vertreiberId: e.vertreiberId, wareGenau: ware.wareGenau };
if (bestehend) await prisma.review.update({ where: { id: bestehend.id }, data: { ...daten, ...zuordnungDaten } });
else await prisma.review.create({ data: { autorId: mitglied.mitgliedId, ...daten, ...zuordnungDaten } });
await kennwerteFortschreiben(ware.strainId);
```
`@@unique([autorId, strainId])` bleibt im Schema; beim Wechsel auf einen anderen Platzhalter derselben Ware kann er greifen → vor `create` prüfen: existiert `autorId_strainId` mit anderem Vertreiber nicht (Platzhalter gehören immer zum gewählten Vertreiber, Kollision also nur bei derselben Sorte+Vertreiber, die `findFirst` schon fand). Revalidierung auf `/blueten/${kultivar.slug}`; Rückgabe `slug: kultivar.slug`.

In `kennwerteFortschreiben` nach dem Kultivar-Block:

```ts
if (strain.kultivarId && strain.vertreiberId) {
  const paar = await prisma.review.findMany({
    where: { freigegeben: true, kultivarId: strain.kultivarId, vertreiberId: strain.vertreiberId },
    select: { gesamtnote: true },
  });
  const noten = paar.map((r) => r.gesamtnote).filter((n): n is number => n !== null);
  const daten = { anzahl: paar.length, gesamtnoteMittel: noten.length ? Math.round((noten.reduce((s, n) => s + n, 0) / noten.length) * 10) / 10 : null };
  await prisma.kultivarVertreiberKennwerte.upsert({
    where: { kultivarId_vertreiberId: { kultivarId: strain.kultivarId, vertreiberId: strain.vertreiberId } },
    create: { kultivarId: strain.kultivarId, vertreiberId: strain.vertreiberId, ...daten },
    update: daten,
  });
}
```
Die Kultivar-Abfrage `imKultivar` filtert künftig `where: { freigegeben: true, kultivarId: strain.kultivarId }` (Spalte am Review).

- [ ] **Step 4:** `npm test`, `npm run typecheck` → PASS.
- [ ] **Step 5:** `scripts/kennwerte-neu.ts`: ruft `kennwerteFortschreiben` für je ein Produkt jedes (Kultivar, Vertreiber)-Paars mit Bewertungen (gegen Remote per bestehendem Skript-Muster, z. B. `scripts/stamm/`), einmal ausführen.
- [ ] **Step 6: Commit** `feat(bewertung): Sorte und Vertreiber statt Produkt`

---

## Parallel nach Strang A (je Strang ein Worktree, `superpowers:using-git-worktrees`)

### Task 3 (Strang B): Sortenseite Daten und Umleitung

**Skills:** edge-stack-master, prisma-client-api, test-driven-development, surgical-patch

**Files:**
- Create: `lib/query/sorte.ts`, `tests/sorte-weiterleitung.test.ts`
- Modify: `lib/alte-adressen.ts`, `proxy.ts`

**Interfaces:**
- Produces: `ladeSorte(slug: string, fachkreis: boolean): Promise<SorteDetail | null>` mit `SorteDetail = { kultivar: { id; name; slug; typ; genetik }; spanne: { thcMin; thcMax; cbdMin; cbdMax }; kennwerte: KultivarKennwerte | null; waren: WareKarte[] }` und `WareKarte = { vertreiberId: string; vertreiberName: string; produkte: { id; slug; handelsname; thcMin; thcMax; cbdMin; cbdMax }[]; anzahl: number; gesamtnoteMittel: number | null }`, Waren sortiert nach `anzahl` absteigend, dann Name. `produktZuSorte(pfad: string): Promise<string | null>` liefert `/blueten/<kultivar-slug>?ware=<produkt-slug>`; reine Funktion `sortenWeiterleitung(pfad: string, suche: string, kultivarSlugVon: (produktSlug: string) => string | null): string | null` für Tests.

- [ ] Step 1: Tests für `sortenWeiterleitung`: `/blueten/420-evolution-22-1-ca-mac` → `/blueten/mac-1?ware=420-evolution-22-1-ca-mac`; vorhandene `?x=1` bleibt angehängt (`&`); Kultivar-Slug selbst → `null` (keine Schleife); unbekannter Slug → `null`.
- [ ] Step 2: FAIL. Step 3: implementieren; in `proxy.ts` nur für `/blueten/<slug>` ohne Treffer in `kultivare.slug` aufrufen (eine indexierte Abfrage auf `strains.slug`, nur wenn Pfad kein Kultivar-Slug ist; Ergebnis per `Cache-Control` der 308 gecacht). Anker überträgt der Browser bei 308 selbst.
- [ ] Step 4: `ladeSorte` mit einer Prisma-Abfrage (`kultivar.findUnique({ where: { slug }, include strains (aktiv) mit vertreiber, kennwerte, vertreiberKennwerte })`), Gruppierung im Code (≤ 30 Produkte).
- [ ] Step 5: PASS, Commit `feat(sorte): Sortendaten und Umleitung alter Produktadressen`.

### Task 4 (Strang B): Sortenseite UI und Bewerten-Formular

**Skills:** ui-design-engine, frontend-design, better-interface, better-layout, better-accessibility, law-of-common-region, hicks-law, fitts-law, emil-design-eng, animate, react-best-practices

**Files:**
- Modify: `app/[lang]/blueten/[slug]/page.tsx`, `components/review/BewertungsFormular.tsx`, `components/review/VertreiberWahl.tsx` (wird Ware-Leiste), `components/review/VertreiberVergleich.tsx` (entfällt in Ware-Leiste), `lib/bewertung-vorbelegung.ts`, `lib/i18n/de.ts`, `lib/i18n/en.ts`
- Create: `components/sorte/WareLeiste.tsx` (Client), `components/sorte/WareWahlFeld.tsx` (Client, im Formular), `tests/ware-leiste.test.ts`

**Interfaces:**
- Consumes: `ladeSorte`, `WareKarte` (Task 3), Formularfelder `kultivarId`, `vertreiberId`, `strainId` (Task 2).
- Produces: Suchparameter `?vertreiber=<id>` und `?ware=<produkt-slug>`; `WareWahlFeld({ waren: WareKarte[]; vorgewaehlt: { vertreiberId: string | null; strainId: string | null } })` rendert versteckte Inputs `vertreiberId`, `strainId`.

- [ ] Step 1: Test (Render per `react-dom/server` wie bestehende Komponententests): Ware-Leiste rendert Karten in Reihenfolge Anzahl/Name, `aria-pressed` auf gewählter Karte; WareWahlFeld zeigt Stärken-Chips nur bei > 1 Produkt, Chip „Weiß ich nicht“ setzt `strainId` leer.
- [ ] Step 2: FAIL. Step 3: `ProduktInhalt` → `SorteInhalt`: lädt `ladeSorte(slug)`, wählt aktive Ware aus `?ware`/`?vertreiber` (sonst meistbewertete), lädt Produktdetail (`ladeStrainDetail(aktivesProdukt.slug)`) nur für Angaben/Terpene/Chargen. Kopf: Sortenname (h1), Typ, Genetik, Spanne, Hauptnote (BlattAnzeige aus `KultivarKennwerte`), Anzahl. Darunter `WareLeiste` (Karten = Links mit `?vertreiber=`, `scroll={false}`), Bewertungsbuch gefiltert auf `vertreiberId` der Auswahl mit Umschalter „Alle Vertreiber“. Formular: `WareWahlFeld` ersetzt `VertreiberWahl`; versteckt `kultivarId`.
- [ ] Step 4: Vorbelegung: `ladeEigeneBewertung` sucht per `autorId, kultivarId, vertreiberId`; `wareGenau=false` → keine Stärke vorgewählt.
- [ ] Step 5: Katalog `/blueten` (`app/[lang]/blueten/page.tsx`, `lib/query/strains.ts`/`kultivar-liste.ts`): ein Eintrag je Kultivar (Name, Vertreiberzahl, THC-Spanne), Link auf Kultivar-Slug; Filter wirken auf Produkte darunter.
- [ ] Step 6: `npm test`, `typecheck`, `lint` PASS; Commit `feat(sorte): Blütenseite wird Sortenseite mit Ware-Leiste`.

### Task 5 (Strang C): Explorer-Daten

**Skills:** edge-stack-master, test-driven-development

**Files:**
- Create: `lib/query/sorten-explorer.ts`, `tests/sorten-explorer.test.ts`
- Modify: `lib/query/vertreiber-beispiel.ts` (entfällt nach Task 6, Tests mitnehmen)

**Interfaces:**
- Produces: `type ExplorerSorte = { slug: string; name: string; typ: KultivarTyp; anzahl: number; waren: ExplorerWare[] }`, `type ExplorerWare = { vertreiberId: string; vertreiberName: string; thc: [number, number]; cbd: [number, number]; staerken: number; anzahl: number; note: number | null }`; reine `waehleExplorerSorten(kandidaten: ExplorerSorte[]): ExplorerSorte[]` (≥ 2 Waren, Sortierung `anzahl` desc dann Name, max. 12, je Sorte ≤ 8 Waren nach Anzahl/Name); `ladeSortenExplorer(): Promise<ExplorerSorte[]>`.

- [ ] Step 1: Tests: Sorte mit einer Ware fällt raus; 13 Kandidaten → 12; Reihenfolge nie nach `note` (zwei Sorten gleicher Anzahl, höhere Note zuerst im Input → Ergebnis alphabetisch); 9 Waren → 8.
- [ ] Step 2: FAIL. Step 3: implementieren; `ladeSortenExplorer` liest `kultivar.findMany` mit aktiven Strains + `vertreiberKennwerte` + `kennwerte.anzahl`, `take: 60` nach `kennwerte.anzahl desc`.
- [ ] Step 4: PASS, Commit `feat(start): Daten für den Sorten-Explorer`.

### Task 6 (Strang C): Sorten-Explorer-Insel

**Skills:** ui-design-engine, frontend-design, design-taste-frontend, build-awwwards-quality-sites, animate, emil-design-eng, apple-design, better-interface, better-accessibility, hicks-law, law-of-similarity, von-restorff-effect, peak-end-rule, critique-visual-hierarchy, critique-composition, react-best-practices

**Files:**
- Create: `components/story/SortenExplorer.tsx` (Client), `components/story/ExplorerWareKarte.tsx`, `tests/sorten-explorer-insel.test.ts`
- Modify: `components/story/VertreiberKapitel.tsx`, `lib/i18n/de.ts`, `lib/i18n/en.ts` (`start.vertreiber` → Texte `suchen`, `vergleichen`, `vergleichEnde`, `zurSorte`, `wareBewerten`, `staerken`, `sorteGewechselt`), `app/globals.css` (nur Tokens/Keyframes falls nötig)
- Delete: `components/story/VertreiberBeispielKarte.tsx`, `lib/query/vertreiber-beispiel.ts` (+ Tests)

**Interfaces:**
- Consumes: `ExplorerSorte[]` (Task 5) als Prop aus dem Server-Kapitel.

- [ ] Step 1: Tests (Server-Render + Zustandslogik als reine Funktion `explorerZustand(aktion, zustand)` in `components/story/explorer-zustand.ts`): Start = erste Sorte, erste Ware ausgewählt; `sorte` wechselt und setzt Auswahl/Vergleich zurück; `vergleichen` mit zweiter Ware → `vergleich = [a, b]`; dritte ersetzt die ältere; Suche filtert Chips case-insensitiv, leeres Ergebnis zeigt Hinweis.
- [ ] Step 2: FAIL. Step 3: Insel bauen:
  - Chips `role="radiogroup"`, roving tabindex, Pfeiltasten; Suchfeld (`type="search"`) darüber.
  - Ware-Karten als `<button aria-pressed>`: Vertreibername, THC- und CBD-Balken auf gemeinsamer Skala der Sorte (`thc[1]` max der Sorte), `staerken` als Zahl, `anzahl`, `BlattAnzeige` bei `note`. Knopf „Vergleichen“ je Karte.
  - Detailfläche: Stärken, Links `/blueten/<slug>?vertreiber=<id>` („Zur Sorte“) und `…#bewerten` („Diese Ware bewerten“).
  - Vergleich: zwei Spalten ab `md`, sonst untereinander; Differenz THC/CBD als Text („+4 % THC“).
  - Motion: Kartenwechsel per CSS `transition` (opacity/transform, 200 ms ease-out), Balken `scaleX` beim Einblenden; `prefers-reduced-motion` und `[data-sparmodus]` aus. Live-Region `aria-live="polite"` meldet `sorteGewechselt`.
  - Ohne JS: Server rendert erste Sorte vollständig (Insel hydratisiert denselben Startzustand).
- [ ] Step 4: `VertreiberKapitel` lädt `ladeSortenExplorer()`; leer → nur Kopf und Absatz.
- [ ] Step 5: PASS, Commit `feat(start): Sorten-Explorer statt Beispielkarte`.

### Task 7 (Strang D): Anzeige der Bewertung überall

**Skills:** ui-design-engine, better-typography, better-writing, critique-brand-consistency, surgical-patch

**Files:**
- Create: `lib/ware-zeile.ts`, `tests/ware-zeile.test.ts`
- Modify: Bewertungs-Selects (`lib/query/bewertung.ts` `BEWERTUNG_SELECT`, `lib/query/buch-band.ts`, `lib/query/reviews.ts`, `lib/query/profil.ts`, `lib/query/ig-feed.ts`), Anzeigen (`components/review/BuchDoppelseite.tsx`, `components/review/GrossesBuch.tsx`, Startseiten-Doppelseite, Profil-Listen), `lib/rangliste.ts`, `lib/query/rangliste.ts`

**Interfaces:**
- Produces: `wareZeile(r: { vertreiberName: string | null; wareGenau: boolean; handelsname: string }, texte: { ueber: string }): string` → `"über Four 20 Pharma · MAC 1 22/1"` bzw. ohne Handelsname bei `wareGenau=false`.

- [ ] Step 1: Tests für `wareZeile` (genau/ungenau/ohne Vertreiber → leerer String). Rangliste: Test, dass Bayes-Wertung je Kultivar gruppiert (zwei Produkte derselben Sorte → ein Eintrag).
- [ ] Step 2: FAIL. Step 3: Selects um `kultivar { name, slug }`, `vertreiber { name }`, `wareGenau` erweitern; Titel jeder Bewertung = Sortenname, Unterzeile = `wareZeile`; Links auf `/blueten/<kultivar-slug>?vertreiber=…#eintrag-…`. Startseite im selben Zug (Memory startseite-mitziehen).
- [ ] Step 4: PASS, Commit `feat(bewertung): Sorte als Titel, Vertreiber als Unterzeile überall`.

### Task 8 (Strang E): Kleinkram aus älteren Sessions

**Skills:** surgical-patch, better-writing, better-accessibility, cloudflare-d1

**Files:** je Punkt die genannte Datei.

- [ ] Kommentar-Filter fängt Beugungen (`lib/hwg-filter.ts`): Test „hilft bei Migräne“, „half gegen Schmerzen“, „Linderung“, „lindernd“ → abgelehnt; Wortstämme statt Vollwörter.
- [ ] Link „Kommentare (n)“ öffnet den Bereich (`components/reaktionen/…`: `<details>` per Hash `#kommentare-<id>` öffnen).
- [ ] „auch bei 1 weiteren Vertreiber“ → „einem“ (`mehrzahl` mit Sonderform 1) in `de.ts`.
- [ ] `redaktionelleReviews` entfernen, falls ungenutzt (`grep -rn redaktionelleReviews`).
- [ ] Datendublette „8 Ball Kush“/„8-Ball Kush“: `migrations/0025_kultivar_8ball.sql` legt Strains auf einen Kultivar, verschiebt Reviews/Kennwerte, löscht den zweiten (Muster wie 0022); Kennwerte neu.
- [ ] Spanne „25 bis 25 % THC“ → „25 % THC“ (`lib/format.ts` Spannenformat), Test.
- [ ] Commit je Punkt `fix: …`.

---

## Abschluss

- [ ] Stränge mergen, Gesamtreview (superpowers:requesting-code-review), `npm test`, `typecheck`, `lint`.
- [ ] Push nach `main`; Build per Cloudflare-API prüfen; live: Sortenseite (Ware wählen, bewerten mit/ohne Stärke), alte Produktadresse 308, Explorer bei 390 px und Desktop, hell/dunkel, Tastatur, CPU-Telemetrie `/` und `/blueten/*`.
- [ ] HANDOFF.md aktualisieren.
