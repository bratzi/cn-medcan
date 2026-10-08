# Bewertungsbuch und Ranglisten Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/reviews` zeigt alle freigegebenen Bewertungen als ein Buch mit Bild (in Bänden zu 24, mit Seitenleiste), darunter für Mitglieder Ranglisten je Sorte mit fünf Reitern.

**Architecture:** Zwei unabhängige Stränge in eigenen Worktrees. Strang A baut das Buch über alle Sorten (Abfrage, Seitenleiste im `Buch`, Bandrouten, statisch). Strang B baut die Ranglisten (reine Ordnungslogik, D1-`GROUP BY`, Route Handler mit Sitzungsprüfung, Client-Insel). Task C setzt beides auf `/reviews` zusammen.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), Prisma 7 mit D1, Tailwind v4, Tests mit `tsx --test` (`npm test`).

**Spec:** `docs/superpowers/specs/2026-10-08-bewertungsbuch-ranglisten-design.md`

## Global Constraints

- Design-Regeln aus `.claude/skills/ui-design-engine.md` gelten für jede Datei unter `app/**` und `components/**`: Abstände nur 8, 16, 24, 32, 40, 48, 64, 80, 96, 128 px; nur semantische Farbtokens; Pillen `rounded-full`, Flächen eckig; Zahlen `numeric`; Daten über `Intl` (`formatiereDatum`, `formatiereZahl` aus `lib/format.ts`).
- Kein Geviertstrich (U+2014) und kein Gedankenstrich (U+2013) als Trenner in neuen Texten.
- Jeder sichtbare Text steht in `lib/i18n/de.ts` und `lib/i18n/en.ts` (gleiche Form, `tests/i18n-schema.test.ts`).
- Ranglisten-Wörter sachlich (§10 HWG): kein „Top“, kein „Beste“, keine Empfehlung.
- Ranglisten nur mit Sitzung: `aktuellesMitglied()` aus `lib/session.ts`, sonst HTTP 401.
- `/reviews` und `/reviews/band/[band]` bleiben `export const dynamic = "force-static"; export const revalidate = 300;`.
- Bilder nur über `components/medien/Bild` (`<Bild id sizes dekorativ? />`), Bild-Id `blueteBild(pfad) ?? musterBildId(slug)`.
- `cn` aus `lib/cn.ts` mischt nicht: keine widersprüchlichen Klassen in einem Aufruf.
- Kein lokales `next dev`/`next build`. Prüfen: `npm test`, `npx tsc --noEmit -p .`, `npx eslint <dateien>`, `npm run farben`.
- Commits mit Zeile `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Band 2 aufrufen, wenn es nur einen Band gibt: 404 statt leerem Buch (Test in Task A3).
- Sprung aus der Seitenleiste in einen anderen Band (`#nr-25`) schlägt im neuen Band genau Eintrag 25 auf (Test in Task A1 für `nummerSeite`).
- Gast öffnet `/api/ranglisten`: 401, keine Daten (Test in Task B2).
- Ungültige Parameter (`nach=xyz`, `seite=0`, `seite=abc`): fallen auf `hoechste` und Seite 1 zurück, kein 500 (Test in Task B1).
- Sorte ohne Gesamtnote in allen Bewertungen (Altbewertungen, `gesamtnote` null): taucht in keiner Rangliste auf, keine NaN-Anzeige (Test in Task B1).

---

## Strang A: Buch über alle Sorten (Worktree `strang-a`)

### Task A1: Reine Logik für Bände und Seitenleiste

**Files:**
- Modify: `lib/buch.ts` (anhängen)
- Test: `tests/buch-band.test.ts` (neu)

**Interfaces:**
- Produces:
  - `export const BAND_GROESSE = 24;`
  - `export function bandAnzahl(gesamt: number): number` (mindestens 1)
  - `export function bandVon(nummer: number): number` (Nummer 1-basiert, Band 1-basiert)
  - `export function bandHref(band: number): string` (`/reviews` für 1, sonst `/reviews/band/${band}`)
  - `export type Leistenpunkt = { art: "nummer"; nummer: number } | { art: "luecke"; schluessel: string };`
  - `export function seitenleiste(aktuell: number, gesamt: number, rand?: number, umfeld?: number): Leistenpunkt[]`
  - `export function nummerSeite(hash: string, basis: number, anzahl: number): number | null` (liest `#nr-<n>`, gibt Index im Band oder null)

- [ ] **Step 1: Failing test**

```ts
// tests/buch-band.test.ts
import assert from "node:assert/strict";
import test from "node:test";

import { BAND_GROESSE, bandAnzahl, bandHref, bandVon, nummerSeite, seitenleiste } from "@/lib/buch";

const zahlen = (p: ReturnType<typeof seitenleiste>) => p.map((x) => (x.art === "nummer" ? x.nummer : "…"));

test("Bände zu 24", () => {
  assert.equal(BAND_GROESSE, 24);
  assert.equal(bandAnzahl(0), 1);
  assert.equal(bandAnzahl(24), 1);
  assert.equal(bandAnzahl(25), 2);
  assert.equal(bandVon(1), 1);
  assert.equal(bandVon(24), 1);
  assert.equal(bandVon(25), 2);
  assert.equal(bandHref(1), "/reviews");
  assert.equal(bandHref(2), "/reviews/band/2");
});

test("Seitenleiste: wenige Einträge ohne Lücke", () => {
  assert.deepEqual(zahlen(seitenleiste(3, 7)), [1, 2, 3, 4, 5, 6, 7]);
});

test("Seitenleiste: Ränder und Umfeld mit Lücken", () => {
  assert.deepEqual(zahlen(seitenleiste(13, 26)), [1, 2, "…", 12, 13, 14, "…", 25, 26]);
  assert.deepEqual(zahlen(seitenleiste(1, 26)), [1, 2, "…", 25, 26]);
  assert.deepEqual(zahlen(seitenleiste(4, 26)), [1, 2, 3, 4, 5, "…", 25, 26]);
});

test("Lücken haben eindeutige Schlüssel", () => {
  const l = seitenleiste(13, 26).filter((x) => x.art === "luecke");
  assert.equal(new Set(l.map((x) => (x.art === "luecke" ? x.schluessel : ""))).size, l.length);
});

test("nummerSeite: #nr-25 in Band 2 ist Index 0", () => {
  assert.equal(nummerSeite("#nr-25", 24, 2), 0);
  assert.equal(nummerSeite("#nr-26", 24, 2), 1);
  assert.equal(nummerSeite("#nr-27", 24, 2), null);
  assert.equal(nummerSeite("#nr-3", 24, 2), null);
  assert.equal(nummerSeite("#eintrag-x", 0, 5), null);
  assert.equal(nummerSeite("#nr-abc", 0, 5), null);
});
```

- [ ] **Step 2:** `npx tsx --test tests/buch-band.test.ts` — Expected: FAIL (Exporte fehlen).

- [ ] **Step 3: Implementierung** (an `lib/buch.ts` anhängen)

```ts
/** Ein Band des großen Buchs auf /reviews (Spec Bewertungsbuch 4): jede Doppelseite trägt eine Aroma-Karte. */
export const BAND_GROESSE = 24;

export function bandAnzahl(gesamt: number): number {
  return Math.max(1, Math.ceil(gesamt / BAND_GROESSE));
}

/** Band einer Eintragsnummer, beides ab 1. */
export function bandVon(nummer: number): number {
  return Math.floor((nummer - 1) / BAND_GROESSE) + 1;
}

export function bandHref(band: number): string {
  return band <= 1 ? "/reviews" : `/reviews/band/${band}`;
}

export type Leistenpunkt = { art: "nummer"; nummer: number } | { art: "luecke"; schluessel: string };

/** Nummern unter dem Buch: die Ränder, das Umfeld der aktuellen, dazwischen Lücken (ab 1). */
export function seitenleiste(aktuell: number, gesamt: number, rand = 2, umfeld = 1): Leistenpunkt[] {
  const zeigen = (n: number) => n <= rand || n > gesamt - rand || Math.abs(n - aktuell) <= umfeld;
  const punkte: Leistenpunkt[] = [];
  for (let n = 1; n <= gesamt; n++) {
    if (zeigen(n)) punkte.push({ art: "nummer", nummer: n });
    else if (punkte.at(-1)?.art !== "luecke") punkte.push({ art: "luecke", schluessel: `luecke-${n}` });
  }
  return punkte;
}

/** Sprungziel #nr-<n> aus einem anderen Band: Index im Band (basis = Nummer vor dem ersten Eintrag) oder null. */
export function nummerSeite(hash: string, basis: number, anzahl: number): number | null {
  const treffer = /^#nr-(\d+)$/.exec(hash);
  if (!treffer) return null;
  const index = Number(treffer[1]) - basis - 1;
  return index >= 0 && index < anzahl ? index : null;
}
```

- [ ] **Step 4:** `npx tsx --test tests/buch-band.test.ts` — Expected: PASS.
- [ ] **Step 5:** Commit `feat: Bände und Seitenleiste für das große Buch`.

### Task A2: Abfrage aller Bewertungen über alle Sorten

**Files:**
- Modify: `lib/query/strains.ts` (Bewertungs-`select` und Abbildung auf `ReviewEintrag` als benannte Konstanten herausziehen, Verhalten gleich)
- Create: `lib/query/buch-band.ts`
- Test: `tests/buch-band-abfrage.test.ts` (neu, Quelltext- und Abbildungstest)

**Interfaces:**
- Consumes: `BAND_GROESSE` (A1); `ReviewEintrag`, `KartenTerpen`-kompatible Terpene aus `lib/query/strains.ts`.
- Produces:
  - in `lib/query/strains.ts`: `export const BEWERTUNG_SELECT` (genau das heutige `select` der `reviews` in `ladeStrainDetail`), `export function alsReviewEintrag(review, autorZahlen: Map<string, number>): ReviewEintrag` (die heutige Abbildung aus `reviews: zeile.reviews.map(...)`) und `export function alsKartenTerpen(eintrag: { rang: number; konzentrationProzent: …; terpen: { name: string; geschmack: string } }): KartenTerpen` (mit den privaten `zuZahl` und `alsGeschmacksKategorie`, wie in `ladeStrainDetail`). `ladeStrainDetail` nutzt alle drei. `ladeAutorZahlen` kommt aus `lib/query/autoren.ts`.
  - in `lib/query/buch-band.ts`:
    ```ts
    export type BandEintrag = {
      review: ReviewEintrag;
      produkt: { handelsname: string; slug: string; terpene: KartenTerpen[]; bildPfad: string | null };
    };
    export type Band = { band: number; baende: number; gesamt: number; basis: number; eintraege: BandEintrag[] };
    export async function ladeBand(band: number): Promise<Band | null>; // null, wenn band > baende oder band < 1
    ```

- [ ] **Step 1:** Herausziehen in `lib/query/strains.ts`: das Objekt hinter `reviews: { where…, orderBy…, take: 20, select: {…} }` wird `BEWERTUNG_SELECT` (nur das `select`), die Abbildung `zeile.reviews.map((review) => ({…}))` wird `alsReviewEintrag(review, autorZahlen)`. `npm test` muss weiter 846+ grün sein.
- [ ] **Step 2: Failing test**

```ts
// tests/buch-band-abfrage.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const q = readFileSync("lib/query/buch-band.ts", "utf8");

test("ladeBand: nur freigegebene, aktive Sorten, Buchreihenfolge, Band zu 24", () => {
  assert.match(q, /freigegeben: true/);
  assert.match(q, /strain: \{ aktiv: true \}/);
  assert.match(q, /orderBy: \[\{ istRedaktionell: "desc" \}, \{ erstelltAm: "desc" \}\]/);
  assert.match(q, /skip: \(band - 1\) \* BAND_GROESSE/);
  assert.match(q, /take: BAND_GROESSE/);
  assert.match(q, /BEWERTUNG_SELECT/);
});

test("ladeBand: Band außerhalb ergibt null", () => {
  assert.match(q, /if \(!Number\.isInteger\(band\) \|\| band < 1 \|\| band > baende\) return null;/);
});
```

- [ ] **Step 3:** `npx tsx --test tests/buch-band-abfrage.test.ts` — FAIL.
- [ ] **Step 4: Implementierung**

```ts
// lib/query/buch-band.ts
import { cache } from "react";

import type { KartenTerpen } from "@/lib/aromakarte";
import { BAND_GROESSE, bandAnzahl } from "@/lib/buch";
import { getPrisma } from "@/lib/prisma";
import { ladeAutorZahlen } from "@/lib/query/autoren";
import { BEWERTUNG_SELECT, alsKartenTerpen, alsReviewEintrag, type ReviewEintrag } from "@/lib/query/strains";

export type BandEintrag = {
  review: ReviewEintrag;
  produkt: { handelsname: string; slug: string; terpene: KartenTerpen[]; bildPfad: string | null };
};
export type Band = { band: number; baende: number; gesamt: number; basis: number; eintraege: BandEintrag[] };

const WO = { freigegeben: true, strain: { aktiv: true } } as const;

/**
 * Ein Band des großen Buchs (Spec Bewertungsbuch 4): alle freigegebenen Bewertungen
 * aller aktiven Sorten, Betreiber zuerst, dann die Community, je neueste zuerst.
 */
export const ladeBand = cache(async (band: number): Promise<Band | null> => {
  const prisma = await getPrisma();
  const gesamt = await prisma.review.count({ where: WO });
  const baende = bandAnzahl(gesamt);
  if (!Number.isInteger(band) || band < 1 || band > baende) return null;
  const zeilen = await prisma.review.findMany({
    where: WO,
    orderBy: [{ istRedaktionell: "desc" }, { erstelltAm: "desc" }],
    skip: (band - 1) * BAND_GROESSE,
    take: BAND_GROESSE,
    select: {
      ...BEWERTUNG_SELECT,
      strain: {
        select: {
          handelsname: true,
          slug: true,
          herstellerBildPfad: true,
          terpene: {
            orderBy: { rang: "asc" },
            select: { rang: true, konzentrationProzent: true, terpen: { select: { name: true, geschmack: true } } },
          },
        },
      },
    },
  });
  const autorZahlen = await ladeAutorZahlen(zeilen.flatMap((z) => (z.autorId ? [z.autorId] : [])));
  return {
    band,
    baende,
    gesamt,
    basis: (band - 1) * BAND_GROESSE,
    eintraege: zeilen.map((z) => ({
      review: alsReviewEintrag(z, autorZahlen),
      produkt: {
        handelsname: z.strain.handelsname,
        slug: z.strain.slug,
        bildPfad: z.strain.herstellerBildPfad,
        terpene: z.strain.terpene.map(alsKartenTerpen),
      },
    })),
  };
});
```

Hinweis: Wenn `bilder` im `BEWERTUNG_SELECT` steht, bleiben sie drin: das Buch zeigt Bewertungsbilder.

- [ ] **Step 5:** `npx tsx --test tests/buch-band-abfrage.test.ts`, `npm test`, `npx tsc --noEmit -p .` — PASS.
- [ ] **Step 6:** Commit `feat: Abfrage für Bände des großen Buchs`.

### Task A3: Seitenleiste im Buch, Sorte auf der Doppelseite, Bandseiten

**Files:**
- Modify: `components/review/Buch.tsx` (optionale Seitenleiste, Sprung `#nr-<n>`)
- Modify: `components/review/BuchDoppelseite.tsx` (optionales `sorte`: Handelsname als Link)
- Create: `components/review/GrossesBuch.tsx` (Server-Komponente: Band zu `Buch` + `BuchDoppelseite`)
- Modify: `app/[lang]/reviews/page.tsx` (Band 1, `Doppelseite` und `Inhaltsverzeichnis` raus)
- Create: `app/[lang]/reviews/band/[band]/page.tsx`
- Delete: `components/review/Inhaltsverzeichnis.tsx`, `tests/inhaltsverzeichnis.test.ts`; Einträge in `tests/hover.test.ts` und `tests/i18n-literale.test.ts` entfernen
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (Schlüssel unten)
- Modify: `tests/statische-seiten.test.ts` (Bandseite mit `"300"` aufnehmen)
- Test: `tests/grosses-buch.test.ts` (neu)

**Interfaces:**
- Consumes: `ladeBand`, `Band` (A2); `seitenleiste`, `nummerSeite`, `bandVon`, `bandHref`, `BAND_GROESSE` (A1).
- Produces: `export function GrossesBuch({ band, w, sprache, katalog }: { band: Band; w: Woerterbuch; sprache: Sprache; katalog: readonly KatalogTerpen[] })`. Task C setzt es ein.
- `Buch` bekommt die optionale Prop `leiste?: { basis: number; gesamt: number; texte: { leiste: string; nummer: string } }` (nur serialisierbare Werte). Ohne `leiste` verhält sich `Buch` wie heute (Blütenseite).
- `BuchDoppelseite` bekommt die optionale Prop `sorte?: boolean`: dann steht über dem Kopf der linken Seite der Handelsname als `Link` auf `eintragHref(eintrag.slug, eintrag.id)` in `font-buch text-h3`, `namenLinkKlassen()`.

**i18n (de / en), in `buch`:**
- `leiste: "Alle Einträge"` / `"All entries"` (aria-label der Navigation)
- `nummer: "Eintrag {nummer}"` / `"Entry {nummer}"` (aria-label je Pille)
- `grossBereich: "Alle Bewertungen"` / `"All reviews"` (Bezeichnung des Buchs)

**Seitenleiste in `Buch.tsx`:** unter der bestehenden Zeile Zurück / „Seite x von n“ / Weiter eine `<nav aria-label={leiste.texte.leiste}>` mit `seitenleiste(basis + stand.index + 1, gesamt)`. Je Punkt:
- Nummer im eigenen Band (`basis < n <= basis + seiten.length`): `<button type="button" onClick={() => blaettern(n - basis - 1)}>`; die aktuelle mit `aria-current="page"` und gefüllt (`bg-accent text-accent-fg border-accent`), sonst `border-border-strong`.
- Nummer in anderem Band: `<a href={`${bandHref(bandVon(n))}#nr-${n}`}>`.
- Lücke: `<span aria-hidden="true">…</span>`.
- Pillen `inline-flex size-11 items-center justify-center rounded-full border numeric text-small`, Leiste `flex flex-wrap justify-center gap-2`.
- Sprung: dort, wo `ankerSeite` ausgewertet wird, zusätzlich `nummerSeite(anker, leiste.basis, seiten.length)` prüfen, wenn `leiste` gesetzt ist.

**Seiten:**

```tsx
// app/[lang]/reviews/band/[band]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BewertungenSeite } from "@/app/[lang]/reviews/seite";
import { holeWoerterbuch } from "@/lib/i18n";

export const dynamic = "force-static";
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.reviews.titel, description: w.reviews.metaBeschreibung };
}

export default async function BandPage({ params }: { params: Promise<{ band: string }> }) {
  const { band } = await params;
  const nummer = Number(band);
  // Band 1 hat genau eine Adresse: /reviews.
  if (!/^\d+$/.test(band) || nummer < 2) notFound();
  return <BewertungenSeite band={nummer} />;
}
```

Gemeinsamer Inhalt in `app/[lang]/reviews/seite.tsx` (`export async function BewertungenSeite({ band }: { band: number })`): lädt `ladeBand(band)`, `holeWoerterbuch()`, `holeSprache()`, `ladeTerpenKatalog()`; `null` und `band > 1` ergibt `notFound()`; `gesamt === 0` den bestehenden `EmptyState`; sonst `Seitenkopf` (mittig: Klasse `text-center` und `mx-auto` am Satz) und `GrossesBuch`. `app/[lang]/reviews/page.tsx` rendert `<BewertungenSeite band={1} />` und behält `dynamic`, `revalidate`, `generateMetadata`.

- [ ] **Step 1: Failing test**

```ts
// tests/grosses-buch.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const seite = readFileSync("app/[lang]/reviews/page.tsx", "utf8");
const band = readFileSync("app/[lang]/reviews/band/[band]/page.tsx", "utf8");
const gross = readFileSync("components/review/GrossesBuch.tsx", "utf8");
const buch = readFileSync("components/review/Buch.tsx", "utf8");

test("/reviews und Bandseiten statisch, 300 s", () => {
  for (const q of [seite, band]) {
    assert.match(q, /export const dynamic = "force-static";/);
    assert.match(q, /export const revalidate = 300;/);
  }
});

test("/reviews ohne alte Doppelseite und ohne Inhaltsverzeichnis", () => {
  assert.doesNotMatch(seite, /Doppelseite|Inhaltsverzeichnis/);
});

test("Bandseite: Band 1 und Unsinn sind 404", () => {
  assert.match(band, /if \(!\/\^\\d\+\$\/\.test\(band\) \|\| nummer < 2\) notFound\(\);/);
});

test("Großes Buch: BuchDoppelseite mit Sorte, Seitenleiste mit Basis", () => {
  assert.match(gross, /<BuchDoppelseite[^>]*sorte/);
  assert.match(gross, /leiste=\{\{ basis: band\.basis, gesamt: band\.gesamt/);
});

test("Buch: Sprung #nr- nur mit Seitenleiste", () => {
  assert.match(buch, /nummerSeite\(/);
});
```

Dazu ein Render-Test in derselben Datei für `BuchDoppelseite` mit `sorte` (Muster: `tests/buch-doppelseite.test.ts`, Hilfe `tests/hilfen/eintrag.ts`): das Markup enthält den Handelsnamen als Link auf `/blueten/<slug>#eintrag-<id>`; ohne `sorte` nicht.

- [ ] **Step 2:** `npx tsx --test tests/grosses-buch.test.ts` — FAIL.
- [ ] **Step 3:** Implementieren wie oben beschrieben.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit -p .`, `npx eslint app components lib tests`, `npm run farben` — PASS.
- [ ] **Step 5:** Commit `feat: großes Buch über alle Bewertungen mit Seitenleiste`.

---

## Strang B: Ranglisten (Worktree `strang-b`)

### Task B1: Reine Ranglistenlogik

**Files:**
- Create: `lib/rangliste.ts`
- Test: `tests/rangliste.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const RANGLISTEN = ["hoechste", "niedrigste", "meiste", "neueste", "uneins"] as const;
  export type Rangliste = (typeof RANGLISTEN)[number];
  export const KARTEN_JE_SEITE = 12;
  export const BAYES_C = 3;
  export type SortenZeile = {
    strainId: string;
    anzahl: number;          // Bewertungen mit Gesamtnote
    summe: number;           // Summe der Gesamtnoten
    betreiber: number | null;   // Gesamtnote der neuesten Betreiber-Bewertung
    communityAnzahl: number;
    communitySumme: number;
    zuletzt: string;         // ISO-Zeit der jüngsten Bewertung
  };
  export type Platz = SortenZeile & { rang: number; schnitt: number; gewichtet: number; abstand: number | null };
  export function parameter(nach: string | null, seite: string | null): { nach: Rangliste; seite: number };
  export function ordne(zeilen: readonly SortenZeile[], nach: Rangliste): Platz[];
  export function seiteVon(plaetze: readonly Platz[], seite: number): { plaetze: Platz[]; seiten: number };
  ```

- [ ] **Step 1: Failing test**

```ts
// tests/rangliste.test.ts
import assert from "node:assert/strict";
import test from "node:test";

import { KARTEN_JE_SEITE, ordne, parameter, seiteVon, type SortenZeile } from "@/lib/rangliste";

const z = (id: string, noten: number[], extra: Partial<SortenZeile> = {}): SortenZeile => ({
  strainId: id,
  anzahl: noten.length,
  summe: noten.reduce((a, b) => a + b, 0),
  betreiber: null,
  communityAnzahl: noten.length,
  communitySumme: noten.reduce((a, b) => a + b, 0),
  zuletzt: "2026-10-01T00:00:00.000Z",
  ...extra,
});

test("parameter: Unsinn fällt auf hoechste und Seite 1", () => {
  assert.deepEqual(parameter("xyz", "0"), { nach: "hoechste", seite: 1 });
  assert.deepEqual(parameter(null, "abc"), { nach: "hoechste", seite: 1 });
  assert.deepEqual(parameter("uneins", "3"), { nach: "uneins", seite: 3 });
});

test("hoechste: eine einzelne 5,0 schlägt nicht viele 4,6 (Bayes)", () => {
  const p = ordne([z("eins", [5]), z("viele", [4.6, 4.6, 4.6, 4.6, 4.6, 4.6]), z("mittel", [3, 3, 3])], "hoechste");
  assert.deepEqual(p.map((x) => x.strainId), ["viele", "eins", "mittel"]);
  assert.equal(p[1].schnitt, 5);
  assert.deepEqual(p.map((x) => x.rang), [1, 2, 3]);
});

test("niedrigste ist die Umkehrung", () => {
  const p = ordne([z("a", [5, 5]), z("b", [1, 1])], "niedrigste");
  assert.equal(p[0].strainId, "b");
});

test("meiste: Anzahl, dann Schnitt", () => {
  const p = ordne([z("a", [3, 3]), z("b", [4, 4]), z("c", [5])], "meiste");
  assert.deepEqual(p.map((x) => x.strainId), ["b", "a", "c"]);
});

test("neueste: jüngste Bewertung zuerst", () => {
  const p = ordne([z("alt", [4], { zuletzt: "2026-01-01T00:00:00.000Z" }), z("neu", [4], { zuletzt: "2026-10-01T00:00:00.000Z" })], "neueste");
  assert.equal(p[0].strainId, "neu");
});

test("uneins: nur mit Betreiber und Community, größter Abstand zuerst", () => {
  const p = ordne(
    [
      z("ohne", [4]),
      z("klein", [4, 4], { betreiber: 4.5, communityAnzahl: 1, communitySumme: 4 }),
      z("gross", [2, 5], { betreiber: 5, communityAnzahl: 1, communitySumme: 2 }),
    ],
    "uneins",
  );
  assert.deepEqual(p.map((x) => x.strainId), ["gross", "klein"]);
  assert.equal(p[0].abstand, 3);
});

test("Sorten ohne Gesamtnote fehlen, nie NaN", () => {
  const p = ordne([z("leer", []), z("a", [4])], "hoechste");
  assert.deepEqual(p.map((x) => x.strainId), ["a"]);
  assert.ok(p.every((x) => Number.isFinite(x.schnitt) && Number.isFinite(x.gewichtet)));
});

test("seiteVon: 12 je Seite, Seite außerhalb ergibt leer", () => {
  const viele = ordne(Array.from({ length: 30 }, (_, i) => z(`s${i}`, [1 + (i % 5)])), "hoechste");
  assert.equal(seiteVon(viele, 1).plaetze.length, KARTEN_JE_SEITE);
  assert.equal(seiteVon(viele, 3).plaetze.length, 6);
  assert.equal(seiteVon(viele, 3).seiten, 3);
  assert.equal(seiteVon(viele, 9).plaetze.length, 0);
});
```

- [ ] **Step 2:** `npx tsx --test tests/rangliste.test.ts` — FAIL.
- [ ] **Step 3: Implementierung**

```ts
// lib/rangliste.ts
/**
 * Ranglisten je Sorte (Spec Bewertungsbuch 5). Geordnet wird nach dem
 * Bayes-Mittel (C · m + Summe) / (C + n), angezeigt der echte Schnitt: so
 * schlägt eine einzelne 5,0 nicht viele gute Bewertungen (Muster Untappd).
 */
export const RANGLISTEN = ["hoechste", "niedrigste", "meiste", "neueste", "uneins"] as const;
export type Rangliste = (typeof RANGLISTEN)[number];
export const KARTEN_JE_SEITE = 12;
export const BAYES_C = 3;

export type SortenZeile = {
  strainId: string;
  anzahl: number;
  summe: number;
  betreiber: number | null;
  communityAnzahl: number;
  communitySumme: number;
  zuletzt: string;
};
export type Platz = SortenZeile & { rang: number; schnitt: number; gewichtet: number; abstand: number | null };

export function parameter(nach: string | null, seite: string | null): { nach: Rangliste; seite: number } {
  const n = (RANGLISTEN as readonly string[]).includes(nach ?? "") ? (nach as Rangliste) : "hoechste";
  const s = seite && /^\d+$/.test(seite) && Number(seite) >= 1 ? Number(seite) : 1;
  return { nach: n, seite: s };
}

export function ordne(zeilen: readonly SortenZeile[], nach: Rangliste): Platz[] {
  const mit = zeilen.filter((z) => z.anzahl > 0);
  const n = mit.reduce((a, z) => a + z.anzahl, 0);
  const m = n === 0 ? 0 : mit.reduce((a, z) => a + z.summe, 0) / n;
  let plaetze = mit.map((z) => ({
    ...z,
    rang: 0,
    schnitt: z.summe / z.anzahl,
    gewichtet: (BAYES_C * m + z.summe) / (BAYES_C + z.anzahl),
    abstand: z.betreiber !== null && z.communityAnzahl > 0 ? Math.abs(z.betreiber - z.communitySumme / z.communityAnzahl) : null,
  }));
  const name = (a: Platz, b: Platz) => a.strainId.localeCompare(b.strainId);
  if (nach === "uneins") plaetze = plaetze.filter((p) => p.abstand !== null);
  const ordnung: Record<Rangliste, (a: Platz, b: Platz) => number> = {
    hoechste: (a, b) => b.gewichtet - a.gewichtet || b.anzahl - a.anzahl || name(a, b),
    niedrigste: (a, b) => a.gewichtet - b.gewichtet || b.anzahl - a.anzahl || name(a, b),
    meiste: (a, b) => b.anzahl - a.anzahl || b.schnitt - a.schnitt || name(a, b),
    neueste: (a, b) => b.zuletzt.localeCompare(a.zuletzt) || name(a, b),
    uneins: (a, b) => (b.abstand ?? 0) - (a.abstand ?? 0) || name(a, b),
  };
  return plaetze.sort(ordnung[nach]).map((p, i) => ({ ...p, rang: i + 1 }));
}

export function seiteVon(plaetze: readonly Platz[], seite: number): { plaetze: Platz[]; seiten: number } {
  const seiten = Math.max(1, Math.ceil(plaetze.length / KARTEN_JE_SEITE));
  return { plaetze: plaetze.slice((seite - 1) * KARTEN_JE_SEITE, seite * KARTEN_JE_SEITE), seiten };
}
```

- [ ] **Step 4:** `npx tsx --test tests/rangliste.test.ts` — PASS.
- [ ] **Step 5:** Commit `feat: Ordnung der Ranglisten je Sorte`.

### Task B2: D1-Abfrage und Route Handler

**Files:**
- Create: `lib/query/rangliste.ts`
- Create: `app/api/ranglisten/route.ts`
- Test: `tests/ranglisten-route.test.ts`

**Interfaces:**
- Consumes: `SortenZeile`, `ordne`, `seiteVon`, `parameter`, `Rangliste` (B1).
- Produces:
  ```ts
  // lib/query/rangliste.ts
  export type RanglistenKarte = {
    rang: number; slug: string; handelsname: string; hersteller: string | null; bildId: string;
    schnitt: number; anzahl: number; betreiber: number | null; zuletzt: string; abstand: number | null;
  };
  export type RanglistenAntwort = { nach: Rangliste; seite: number; seiten: number; karten: RanglistenKarte[] };
  export async function ladeRangliste(nach: Rangliste, seite: number): Promise<RanglistenAntwort>;
  ```
  Route `GET /api/ranglisten?nach=&seite=`: 401 `{ fehler: "anmelden" }` ohne Sitzung; sonst `RanglistenAntwort` als JSON, Header `Cache-Control: private, no-store`.

**SQL** (`$queryRawUnsafe`, Muster `lib/query/konto.ts`; Spalten laut `prisma/schema.prisma`: `reviews.strain_id`, `gesamtnote`, `ist_redaktionell`, `freigegeben`, `erstellt_am`; `strains.aktiv`):

```sql
SELECT r.strain_id AS strainId,
       COUNT(*) AS anzahl,
       SUM(r.gesamtnote) AS summe,
       (SELECT b.gesamtnote FROM reviews b
         WHERE b.strain_id = r.strain_id AND b.freigegeben = 1 AND b.ist_redaktionell = 1 AND b.gesamtnote IS NOT NULL
         ORDER BY b.erstellt_am DESC LIMIT 1) AS betreiber,
       SUM(CASE WHEN r.ist_redaktionell = 0 THEN 1 ELSE 0 END) AS communityAnzahl,
       SUM(CASE WHEN r.ist_redaktionell = 0 THEN r.gesamtnote ELSE 0 END) AS communitySumme,
       MAX(r.erstellt_am) AS zuletzt
FROM reviews r
JOIN strains s ON s.id = r.strain_id AND s.aktiv = 1
WHERE r.freigegeben = 1 AND r.gesamtnote IS NOT NULL
GROUP BY r.strain_id
```

Zahlen aus D1 mit `Number(...)` umwandeln (D1 liefert teils BigInt oder String, Muster `stimmZahlen` in `lib/query/konto.ts`), `zuletzt` mit `String(...)`. Nach `ordne` und `seiteVon` die Karten für höchstens 12 Ids mit einem `prisma.strain.findMany({ where: { id: { in: ids } }, select: { id, slug, handelsname, herstellerBildPfad, hersteller: { select: { name: true } } } })` anreichern; `bildId = blueteBild(herstellerBildPfad) ?? musterBildId(slug)`; Reihenfolge der Plätze behalten.

- [ ] **Step 1: Failing test**

```ts
// tests/ranglisten-route.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("app/api/ranglisten/route.ts", "utf8");
const abfrage = readFileSync("lib/query/rangliste.ts", "utf8");

test("Route: ohne Sitzung 401, privat und ungecacht", () => {
  assert.match(route, /aktuellesMitglied\(\)/);
  assert.match(route, /status: 401/);
  assert.match(route, /"Cache-Control": "private, no-store"/);
  assert.match(route, /parameter\(/);
});

test("Abfrage: GROUP BY in D1, nur freigegeben und aktive Sorten, höchstens 12 Sorten nachladen", () => {
  assert.match(abfrage, /GROUP BY r\.strain_id/);
  assert.match(abfrage, /r\.freigegeben = 1/);
  assert.match(abfrage, /s\.aktiv = 1/);
  assert.match(abfrage, /id: \{ in: ids \}/);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** Implementieren.

```ts
// app/api/ranglisten/route.ts
import { NextResponse, type NextRequest } from "next/server";

import { ladeRangliste } from "@/lib/query/rangliste";
import { parameter } from "@/lib/rangliste";
import { aktuellesMitglied } from "@/lib/session";

const PRIVAT = { "Cache-Control": "private, no-store" } as const;

/**
 * Ranglisten je Sorte, nur für angemeldete Mitglieder (Spec Bewertungsbuch 5,
 * §10 HWG). /reviews bleibt statisch; die Insel fragt hier im Browser nach.
 */
export async function GET(anfrage: NextRequest) {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) return NextResponse.json({ fehler: "anmelden" }, { status: 401, headers: PRIVAT });
  const { nach, seite } = parameter(anfrage.nextUrl.searchParams.get("nach"), anfrage.nextUrl.searchParams.get("seite"));
  return NextResponse.json(await ladeRangliste(nach, seite), { headers: PRIVAT });
}
```

- [ ] **Step 4:** `npm test`, `npx tsc --noEmit -p .` — PASS.
- [ ] **Step 5:** Commit `feat: Ranglisten-Abfrage und Route für Mitglieder`.

### Task B3: Client-Insel Ranglisten

**Files:**
- Create: `components/rangliste/Ranglisten.tsx` (`"use client"`)
- Create: `components/rangliste/RanglistenKarte.tsx`
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (neues Objekt `rangliste`)
- Test: `tests/ranglisten-insel.test.ts`

**Interfaces:**
- Consumes: `RanglistenAntwort`, `RanglistenKarte` (B2, nur `import type`), `RANGLISTEN`, `Rangliste` (B1).
- Produces: `export function Ranglisten({ texte, sprache }: { texte: Woerterbuch["rangliste"]; sprache: Sprache })`. Task C setzt sie ein.

**i18n `rangliste` (de / en):**
- `titel: "Ranglisten"` / `"Rankings"`
- `satz: "Je Sorte, aus allen freigegebenen Bewertungen. Geordnet wird nach einem gewichteten Schnitt, damit eine einzelne Bewertung nicht die ganze Liste anführt. Angezeigt wird der echte Schnitt."` / `"Per strain, from all approved reviews. Ordered by a weighted average so that a single review does not lead the whole list. The real average is shown."`
- `reiterLeiste: "Ranglisten"` / `"Rankings"`
- `reiter: { hoechste: "Am höchsten bewertet", niedrigste: "Am niedrigsten bewertet", meiste: "Meistbewertet", neueste: "Neu bewertet", uneins: "Wir und ihr uneins" }` / `{ hoechste: "Highest rated", niedrigste: "Lowest rated", meiste: "Most reviewed", neueste: "Recently reviewed", uneins: "We disagree" }`
- `schnitt: "Schnitt {zahl} von 5"` / `"Average {zahl} of 5"`
- `anzahl: { one: "{anzahl} Bewertung", other: "{anzahl} Bewertungen" }` / `{ one: "{anzahl} review", other: "{anzahl} reviews" }`
- `betreiber: "Unsere Note {zahl}"` / `"Our score {zahl}"`
- `abstand: "Abstand {zahl}"` / `"Gap {zahl}"`
- `zuletzt: "Zuletzt {datum}"` / `"Last {datum}"`
- `rang: "Platz {rang}"` / `"Rank {rang}"`
- `seiten: "Seiten der Rangliste"` / `"Ranking pages"`
- `seite: "Seite {seite}"` / `"Page {seite}"`
- `gast: "Die Ranglisten sehen angemeldete Mitglieder."` / `"Rankings are visible to signed-in members."`
- `anmelden: "Anmelden"` / `"Sign in"`
- `fehler: "Die Rangliste lässt sich gerade nicht laden."` / `"The ranking cannot be loaded right now."`
- `nochmal: "Neu laden"` / `"Reload"`
- `leer: "Hier steht noch keine Sorte."` / `"No strain here yet."`
- `leerUneins: "Sobald eine Sorte unsere und eure Bewertung hat, steht sie hier."` / `"As soon as a strain has our review and yours, it appears here."`
- `laedt: "Rangliste lädt"` / `"Loading ranking"`

**Verhalten `Ranglisten.tsx`:**
- Zustand `{ nach, seite }` aus dem Hash `#ranglisten-<nach>-<seite>` (beim Laden lesen, bei Wechsel `history.replaceState` setzen; `parameter()` aus B1 prüft).
- Laden mit `fetch(`/api/ranglisten?nach=${nach}&seite=${seite}`, { credentials: "same-origin" })`. Zustände: `laedt` (Skelett: 12 Kartenflächen `bg-surface-sunken`, `role="status"` mit `texte.laedt`), `gast` (bei 401: Satz `texte.gast` plus `<Link href="/anmelden?weiter=%2Freviews%23ranglisten" className={buttonKlassen("primary")}>`), `fehler` (Satz plus `<button>` `texte.nochmal`), `daten`.
- Ohne JavaScript: Server-Erstausgabe ist der Gast-Zustand (Anmelde-Hinweis), damit nichts leer steht.
- Reiter: `<div role="tablist">` mit fünf `<button role="tab" aria-selected>`, Stil wie `ProfilReiter` (gedruckt, `text-h3`, aktiv `underline decoration-accent decoration-2 underline-offset-8`, sonst `text-text-muted`), `min-h-11`, Pfeiltasten links/rechts wechseln den Reiter. Darunter `role="tabpanel"`.
- Raster `grid grid-cols-1 gap-8 min-[640px]:grid-cols-2 min-[1080px]:grid-cols-4` (Pixel-Breakpoints, nie mit `sm:` mischen).
- Seitenzahlen der Rangliste unten: Pillen wie die Seitenleiste des Buchs (`size-11 rounded-full border numeric`), aktuelle gefüllt, `aria-current="page"`.
- Leer: `texte.leer`, beim Reiter `uneins` `texte.leerUneins`.
- Reiterwechsel blendet das Raster per `transition-opacity duration-fast` ein, `motion-reduce:transition-none`.

**`RanglistenKarte.tsx`:** `<article className="relative flex flex-col gap-4 border-t border-border-strong pt-4">`; oben `<Bild id={karte.bildId} sizes="(min-width: 1080px) 25vw, (min-width: 640px) 50vw, 100vw" dekorativ />` in `aspect-square bg-surface-sunken`; Rang `numeric text-h2` mit `aria-label={t(texte.rang, …)}`; Handelsname als `<Link href={`/blueten/${slug}`} className={namenLinkKlassen("font-buch text-h3 wrap-break-word after:absolute after:inset-0")}>`; Hersteller `text-small text-text-muted`; Zeile mit Schnitt (`formatiereZahl(schnitt, 1, sprache)`, `numeric text-h3`) und `mehrzahl(sprache, texte.anzahl, anzahl)`; darunter `betreiber` (falls), `abstand` (nur Reiter `uneins`), `zuletzt` mit `formatiereDatum(new Date(zuletzt), sprache)`.

- [ ] **Step 1: Failing test** (Render mit `renderToStaticMarkup`, Muster `tests/profil-seite.test.ts`)

```ts
// tests/ranglisten-insel.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RanglistenKarte } from "@/components/rangliste/RanglistenKarte";
import { Ranglisten } from "@/components/rangliste/Ranglisten";
import { de } from "@/lib/i18n/de";

const karte = {
  rang: 1, slug: "remexian", handelsname: "Remexian 30/1 PGF CIS", hersteller: "Purplefarm", bildId: "bluete-02",
  schnitt: 4.5, anzahl: 3, betreiber: 4.5, zuletzt: "2026-10-08T00:00:00.000Z", abstand: null,
};

test("Karte: Link zur Blüte, Schnitt de-DE, Anzahl in Mehrzahl", () => {
  const html = renderToStaticMarkup(createElement(RanglistenKarte, { karte, nach: "hoechste", texte: de.rangliste, sprache: "de" }));
  assert.match(html, /href="\/blueten\/remexian"/);
  assert.match(html, /4,5/);
  assert.match(html, /3 Bewertungen/);
  assert.doesNotMatch(html, /Abstand/);
});

test("Insel: ohne JavaScript steht der Anmelde-Hinweis", () => {
  const html = renderToStaticMarkup(createElement(Ranglisten, { texte: de.rangliste, sprache: "de" }));
  assert.match(html, /angemeldete Mitglieder/);
  assert.match(html, /\/anmelden\?weiter=/);
});

test("Wörter sachlich: kein Top, kein Beste", () => {
  const alles = JSON.stringify(de.rangliste);
  assert.doesNotMatch(alles, /\bTop\b|[Bb]este/);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** Implementieren. **Step 4:** `npm test`, `npx tsc --noEmit -p .`, `npx eslint components/rangliste lib tests`, `npm run farben` — PASS.
- [ ] **Step 5:** Commit `feat: Ranglisten als Insel für Mitglieder`.

---

## Task C: Zusammensetzen auf /reviews (Hauptsitzung, nach Merge von A und B)

**Files:**
- Modify: `app/[lang]/reviews/seite.tsx` (aus A3)
- Modify: `HANDOFF.md`, `.claude/skills/ui-design-engine.md` (Regel: Ranglisten nur für Mitglieder, Wörter sachlich)
- Test: `tests/grosses-buch.test.ts` erweitern

- [ ] **Step 1:** Test ergänzen: `seite.tsx` enthält `<Ranglisten` nach `<GrossesBuch` und einen `SektionsKopf`-artigen mittigen Kopf mit `id="ranglisten"`.
- [ ] **Step 2:** In `BewertungenSeite` unter dem Buch: `<section id="ranglisten" aria-labelledby="ranglisten-titel" className="relative isolate overflow-x-clip pt-24 sm:pt-32">` mit `Schlagwort` (Satz de „wer vorn liegt“, en „who leads“, als `rangliste.schlagwort` in beide Wörterbücher), mittigem Kopf (`font-buch text-kapitel`, Satz `texte.satz`) und `<Ranglisten texte={w.rangliste} sprache={sprache} />`. Das Buch selbst bekommt ebenfalls Schlagwort und mittigen Kopf wie auf der Blütenseite.
- [ ] **Step 3:** `npm test`, `npx tsc --noEmit -p .`, `npx eslint app components lib tests`, `npm run farben` — PASS.
- [ ] **Step 4:** Commit, push nach `main` (Live-Gang), live prüfen: `/reviews` als Gast und als Mitglied, Band 2 über die Seitenleiste, Reiterwechsel, 390 px und 1418 px, hell und dunkel.
