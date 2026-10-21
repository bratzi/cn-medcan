# Strain-Seite agenturreif Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** /blueten bekommt Chipleiste mit Popovern (mobil Bottom-Sheet), Sortier-Segment, Aktiv-Zeile, volle Breite; Seitenkopf global volle Breite.

**Architecture:** Reiner Client-Zustand in `KatalogAnsicht`, URL bleibt Quelle (`StrainFilter`, `setze`). `FilterFelder` wird in einzelne Feld-Komponenten zerlegt, die je in einem Popover (Desktop) oder `<dialog>`-Sheet (mobil) sitzen. Filterspalte, MobilLeiste, FilterSchublade und `lib/katalog/filterspalte.ts` entfallen.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (Tokens in app/globals.css), Tests mit `tsx --test` und `renderToStaticMarkup`.

**Spec:** docs/superpowers/specs/2026-10-21-strainseite-agentur-design.md

## Global Constraints

- Keine neue Bibliothek. Kein CPU-Mehraufwand im Worker (Free-Limit 10 ms), alles im Client.
- Wording sichtbar: Blüte/Strain, Variante. Nie „Ware“, nie „Stärke“ (interne Schlüssel wie `ansicht: "ware"` bleiben).
- Touch-Ziele 44 px (`h-11`/`min-h-11`), sonst 8-px-Raster, nur Tokens aus ui-design-engine.
- Zahl im Handschrift-Akzent, Wort normal (Trefferzahl).
- Popover/Sheet: Fokus hinein, Esc schließt, Fokus zurück auf Chip, `aria-expanded`/`aria-controls`, Klick außen schließt.
- Kein `next dev` lokal. Prüfen mit `npm test`, `npx tsc --noEmit`, `npm run lint`; live nach Deploy.
- Skills je Task laden: ui-design-engine, design-taste-frontend, better-interface, emil-design-eng, apple-design, hicks-law, fitts-law, law-of-common-region, law-of-proximity, react-best-practices, edge-stack-master. Meldung beginnt mit Zeile „Skills: …“.

## Review Focus

1. Sticky-Leiste plus offenes Popover am unteren Viewport-Rand: Popover darf nicht abgeschnitten werden (max-h, eigenes Scrollen).
2. Suchtext gesetzt: Sortierung springt auf `relevanz`, Segment zeigt dann „…“-Knopf als aktiv mit Label „zuletzt geändert“.
3. Chip „Mehr“ nur mit Fachkreis-Feldern; ohne Fachkreis kein leerer Chip.
4. 390 px: Chipleiste scrollt waagerecht, Seite selbst nie (`scrollWidth == innerWidth`).
5. Zurück-Taste (popstate) bei offenem Popover: Popover zeigt neuen Filter, bleibt bedienbar.

---

## Strang A (Worktree `wt-kopf`): Seitenkopf global volle Breite

### Task A1: Kopf ohne max-w-360, Navigation rechtsbündig

**Files:**
- Modify: `components/layout/Kopf.tsx:46` (Container-Klasse), `:52-55` (nav)
- Test: `tests/kopf-breite.test.ts` (neu)

**Interfaces:** keine nach außen.

- [ ] **Step 1: Failing test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const kopf = readFileSync("components/layout/Kopf.tsx", "utf8");

test("Kopf: volle Breite, keine max-w-360", () => {
  assert.doesNotMatch(kopf, /max-w-360/);
});

test("Kopf: ab lg Logo links, Navigation und Konto rechts", () => {
  assert.match(kopf, /lg:grid-cols-\[auto_1fr_auto\]/);
  assert.match(kopf, /<nav\s+aria-label=\{w\.kopf\.hauptnavigation\}\s+className="[^"]*justify-self-end/);
});
```

- [ ] **Step 2:** `npx tsx --test tests/kopf-breite.test.ts` — Erwartung FAIL (max-w-360 vorhanden).
- [ ] **Step 3:** In Kopf.tsx `mx-auto ... max-w-360` ersetzen durch `grid w-full ...` (ohne `mx-auto max-w-360`). nav behält `justify-self-end`. Prüfen, dass Fuss.tsx und Seitenkopf.tsx ihr eigenes `max-w-360` behalten (Inhaltsbreite, nicht Kopf).
- [ ] **Step 4:** Test PASS, `npm test` grün.
- [ ] **Step 5:** Commit `Kopf: volle Breite, Navigation und Konto rechts`.

---

## Strang B (Worktree `wt-leiste`): Werkzeugleiste, Chips, Popover, Sheet

### Task B1: Logik — Chip-Zähler und Sortier-Segment

**Files:**
- Create: `lib/katalog/chipleiste.ts`
- Test: `tests/katalog-chipleiste.test.ts`

**Interfaces — Produces:**
```ts
export type ChipSchluessel = "community" | "terpene" | "geschmack" | "typ" | "thc" | "vertreiber" | "form" | "verfuegbar" | "mehr";
export const CHIPS: readonly ChipSchluessel[];
export function chipZahl(f: StrainFilter, chip: ChipSchluessel): number;
export const SORTIER_SEGMENT: readonly ["community", "stimmen", "neueste", "thc_absteigend"];
export const SORTIER_MEHR: readonly Sortierung[]; // Rest aus SORTIERUNGEN in Originalreihenfolge
export function sichtbareChips(fachkreis: boolean): ChipSchluessel[]; // ohne "mehr" bei !fachkreis
```

- [ ] **Step 1: Failing test**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { CHIPS, SORTIER_MEHR, SORTIER_SEGMENT, chipZahl, sichtbareChips } from "@/lib/katalog/chipleiste";
import { SORTIERUNGEN, leererFilter } from "@/lib/query/filter";

const f = (teil = {}) => ({ ...leererFilter(), ...teil });

test("chipZahl zählt aktive Werte je Chip", () => {
  assert.equal(chipZahl(f(), "terpene"), 0);
  assert.equal(chipZahl(f({ terp: ["Myrcen", "Limonen"] }), "terpene"), 2);
  assert.equal(chipZahl(f({ note: 4, bewertet: true }), "community"), 2);
  assert.equal(chipZahl(f({ thcMin: 20, cbd: true }), "thc"), 2);
  assert.equal(chipZahl(f({ apotheke: ["a"], preisMax: 900 }), "mehr"), 2);
  assert.equal(chipZahl(f({ nurVerfuegbar: true }), "verfuegbar"), 1);
});

test("Sortier-Segment plus Mehr deckt alle Sortierungen genau einmal ab", () => {
  assert.deepEqual([...SORTIER_SEGMENT, ...SORTIER_MEHR].sort(), [...SORTIERUNGEN].sort());
});

test("Chip Mehr nur für Fachkreis", () => {
  assert.ok(!sichtbareChips(false).includes("mehr"));
  assert.deepEqual(sichtbareChips(true), [...CHIPS]);
});
```

- [ ] **Step 2:** `npx tsx --test tests/katalog-chipleiste.test.ts` — FAIL (Modul fehlt).
- [ ] **Step 3: Implementierung**

```ts
import { SORTIERUNGEN, leererFilter, type Sortierung, type StrainFilter } from "@/lib/query/filter";

/** Chips der Werkzeugleiste (Spec 2026-10-21), Reihenfolge = Anzeige. */
export const CHIPS = ["community", "terpene", "geschmack", "typ", "thc", "vertreiber", "form", "verfuegbar", "mehr"] as const;
export type ChipSchluessel = (typeof CHIPS)[number];

export const SORTIER_SEGMENT = ["community", "stimmen", "neueste", "thc_absteigend"] as const satisfies readonly Sortierung[];
export const SORTIER_MEHR: readonly Sortierung[] = SORTIERUNGEN.filter((s) => !(SORTIER_SEGMENT as readonly string[]).includes(s));

/** Zahl aktiver Werte am Chip; 0 heißt: kein Zähler. */
export function chipZahl(f: StrainFilter, chip: ChipSchluessel): number {
  const leer = leererFilter();
  switch (chip) {
    case "community": return (f.note !== undefined ? 1 : 0) + (f.bewertet ? 1 : 0);
    case "terpene": return f.terp.length;
    case "geschmack": return f.geschmack.length;
    case "typ": return f.typ.length;
    case "thc": return (f.thcMin !== leer.thcMin || f.thcMax !== leer.thcMax ? 1 : 0) + (f.cbd ? 1 : 0);
    case "vertreiber": return f.vertreiber.length;
    case "form": return f.form.length;
    case "verfuegbar": return f.nurVerfuegbar ? 1 : 0;
    case "mehr": return f.apotheke.length + (f.preisMax !== undefined ? 1 : 0);
  }
}

export function sichtbareChips(fachkreis: boolean): ChipSchluessel[] {
  return CHIPS.filter((c) => fachkreis || c !== "mehr");
}
```

- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `Katalog: Chip-Zähler und Sortier-Segment als reine Logik`.

### Task B2: FilterFelder in Feld-Komponenten zerlegen

**Files:**
- Modify: `components/katalog/FilterFelder.tsx` (ganze Datei)
- Test: `tests/katalog-filterfelder.test.ts` (neu oder bestehenden erweitern, vorher `ls tests | grep filterfeld` prüfen)

**Interfaces — Produces:**
```ts
export type FeldProps = Omit<Props, never>; // die bisherigen Props von FilterFelder
export function FilterFeld(props: FeldProps & { chip: ChipSchluessel }): JSX.Element | null;
export function SuchFeld(props: FeldProps): JSX.Element; // Debounce 300 ms wie bisher
```
`FilterFeld` rendert den bisherigen Inhalt der jeweiligen Gruppe/Klappe ohne `<details>`-Hülle (Klappe entfällt). `mehr` = Apotheke + Höchstpreis, `null` ohne Fachkreis. Entwurf-Debounce (THC, Preis) bleibt je Feld; `SuchFeld` hat eigenen Entwurf für `q`.

- [ ] **Step 1: Failing test** — rendert `FilterFeld` je Chip mit `renderToStaticMarkup`, `daten` mit 2 Terpenen, 1 Vertreiber, `fachkreis: false`:

```ts
for (const chip of ["community", "terpene", "geschmack", "typ", "thc", "vertreiber", "form", "verfuegbar"] as const) {
  test(`FilterFeld ${chip} rendert ohne details-Hülle`, () => {
    const html = feld(chip);
    assert.ok(html.length > 0);
    assert.doesNotMatch(html, /<details/);
  });
}
test("FilterFeld mehr ohne Fachkreis leer", () => assert.equal(feld("mehr"), ""));
test("SuchFeld ist type=search mit Label", () => assert.match(such(), /type="search"/));
```
(`feld`/`such` als Helfer analog `leiste()` in tests/katalog-werkzeugleiste.test.ts, Texte `de.katalog.leiste`, Labels aus `de.label`.)

- [ ] **Step 2:** FAIL. **Step 3:** Zerlegen, `Klappe` und `FilterFelder` entfernen. **Step 4:** PASS. **Step 5:** Commit `Katalog: Filterfelder einzeln für Popover und Sheet`.

### Task B3: ChipPopover und ChipSheet

**Files:**
- Create: `components/katalog/ChipFenster.tsx`
- Test: `tests/katalog-chipfenster.test.ts`

**Interfaces — Produces:**
```ts
export function ChipFenster(props: {
  titel: string; zahl: number; offen: boolean;
  oeffne: () => void; schliesse: () => void;
  /** Ergebnisknopf im Sheet: „{anzahl} Treffer zeigen“. */
  fussText: string;
  children: ReactNode;
}): JSX.Element;
```
Ein Element für beide Breiten: Auslöser-Knopf (Chip, `h-11 rounded-full`, Zähler-Badge `bg-accent text-accent-fg` nur bei `zahl > 0`, `aria-expanded`, `aria-controls`, `aria-haspopup="dialog"`). Inhalt ist ein `<dialog>`: ab lg mit `show()` als Popover unter dem Chip (absolute, `w-80 max-h-[min(70dvh,32rem)] overflow-y-auto`, Schatten), unter lg mit `showModal()` als Bottom-Sheet (Klassen aus FilterSchublade übernehmen, `.katalog-schublade` bleibt in globals.css). Breite per `matchMedia("(width >= 64rem)")` beim Öffnen. Esc: `onCancel` schließt. Klick außen: `pointerdown` auf document, wenn Ziel außerhalb von Chip und Dialog. Nach Schließen Fokus auf Chip. Fuß nur im Sheet: Knopf mit `fussText` schließt.

- [ ] **Step 1: Failing test** — statisch gerendert: `aria-expanded="false"`, Zähler `>2<` bei `zahl: 2`, kein Zähler bei `zahl: 0`, `aria-controls` gleich `id` des `<dialog>`.
- [ ] **Step 2:** FAIL. **Step 3:** Implementieren. **Step 4:** PASS. **Step 5:** Commit `Katalog: ChipFenster als Popover und Sheet`.

### Task B4: Werkzeugleiste neu, KatalogAnsicht umbauen, Altes entfernen

**Files:**
- Modify: `components/katalog/Werkzeugleiste.tsx` (neu schreiben), `components/katalog/KatalogAnsicht.tsx`
- Modify: `components/katalog/SortierWahl.tsx` (wird Segment + „…“-Menü)
- Delete: `components/katalog/MobilLeiste.tsx`, `components/katalog/FilterSchublade.tsx`, `lib/katalog/filterspalte.ts`, `tests/katalog-filterspalte.test.ts`
- Modify: `app/[lang]/layout.tsx` (FILTER_SKRIPT-Import und Script raus), `tests/thema.test.ts:51` (Regex ohne FILTER_SKRIPT), `app/globals.css:2550-2575` (`.katalog-filterspalte`, `.katalog-filterknopf` raus)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` — `leiste.chips: Record<ChipSchluessel,string>` (de: Community-Note, Terpene, Geschmack, Typ, THC/CBD, Hersteller, Form, Verfügbarkeit, Mehr), `leiste.sortierenKurz: { community: "Community", stimmen: "Stimmen", neueste: "Neueste", thc_absteigend: "THC" }`, `leiste.weitereSortierung: "Weitere Sortierungen"`, `leiste.legendeKurz: "✓ Datenblatt bestätigt · + Community gefunden"`; en entsprechend.
- Test: `tests/katalog-werkzeugleiste.test.ts` (neu schreiben)

**Interfaces — Consumes:** B1 `sichtbareChips`, `chipZahl`, `SORTIER_SEGMENT`, `SORTIER_MEHR`; B2 `FilterFeld`, `SuchFeld`; B3 `ChipFenster`.

Aufbau (wie freigegebener Prototyp):
- Über der Leiste: `SuchFeld` volle Inhaltsbreite.
- Leiste `sticky top-(--kopf-h,4rem) z-20 bg-bg border-b border-border py-4 flex flex-col gap-3`.
- Zeile 1: Ansicht-Segment (Blüten | Handelsnamen, `aria-pressed`), Trefferzahl `<p aria-live="polite">` mit Zahl in `<span class="font-hand text-accent ...">` (Handschrift-Token aus ui-design-engine) und Wort normal, rechts (`ms-auto`) Sortier-Segment ab lg. Mobil Sortierung als `ChipFenster` mit Radioliste aller SORTIERUNGEN.
- Segment: Knöpfe `aria-pressed`, „…“-Knopf öffnet Menü (`ChipFenster` ohne Zähler) mit `SORTIER_MEHR`; ist die aktive Sortierung in `SORTIER_MEHR`, trägt „…“ `aria-pressed="true"` und zeigt ihr Label.
- Zeile 2: `sichtbareChips(daten?.fachkreis ?? false)` als `ChipFenster`, Inhalt `FilterFeld`. Unter lg `flex-nowrap overflow-x-auto overscroll-x-contain`, ab lg `flex-wrap`. Ein offener Chip zur Zeit (Zustand `offenerChip` in Werkzeugleiste).
- Zeile 3 (nur bei aktiven Chips): bestehende `aktiveChips()`-Liste plus „Alle zurücksetzen“, rechts `legendeKurz` in `text-caption text-text-muted`. `GeschmackLegende` über dem Raster entfällt.
- RASTER: `grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5` (unter sm 1 Spalte: `grid-cols-1 sm:grid-cols-2`). Raster volle Breite, kein `aside` mehr.

- [ ] **Step 1: Failing tests**

```ts
test("Werkzeugleiste: Sortier-Segment zeigt vier Knöpfe, aktiver pressed", () => {
  const html = leiste({ filter: { ...leererFilter(), sortierung: "stimmen" } });
  for (const s of SORTIER_SEGMENT) assert.match(html, new RegExp(`>${de.katalog.leiste.sortierenKurz[s]}<`));
  assert.match(html, /aria-pressed="true"[^>]*>Stimmen</);
});
test("Werkzeugleiste: Sortierung aus Mehr-Menü markiert den …-Knopf", () => {
  const html = leiste({ filter: { ...leererFilter(), sortierung: "name" } });
  assert.match(html, /aria-pressed="true"[^>]*>Name/);
});
test("Werkzeugleiste: Chip zeigt Zahl aktiver Werte", () => {
  const html = leiste({ filter: { ...leererFilter(), terp: ["Myrcen", "Limonen"] } });
  assert.match(html, />Terpene<[\s\S]*?>2</);
});
test("Aktiv-Zeile nur bei aktiven Filtern", () => {
  assert.doesNotMatch(ansicht(leererFilter()), /Alle zurücksetzen|Alle löschen/);
});
test("Altes ist weg", () => {
  for (const p of ["components/katalog/MobilLeiste.tsx", "components/katalog/FilterSchublade.tsx", "lib/katalog/filterspalte.ts"])
    assert.ok(!existsSync(p));
  assert.doesNotMatch(lies("app/globals.css"), /katalog-filterspalte|katalog-filterknopf/);
});
test("Sichtbare Texte ohne Ware und Stärke", () => {
  const html = leiste();
  assert.doesNotMatch(html, /Ware|Stärke/);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** Umbauen, Altes löschen, Texte ergänzen. **Step 4:** `npm test`, `npx tsc --noEmit`, `npm run lint` grün.
- [ ] **Step 5:** Commit `Strains: Chipleiste mit Popovern, Sortier-Segment, volle Breite`.

---

## Strang C (Worktree `wt-karte`): Karte neu gewichtet

### Task C1: KatalogKarte Reihenfolge Name, Community-Note, Terpen-Punkte, THC

**Files:**
- Modify: `components/katalog/KatalogKarte.tsx` (nur diese Datei)
- Test: `tests/katalog-karte.test.ts` (bestehenden erweitern, sonst neu)

Vorher Datei lesen und mit critique-visual-hierarchy, critique-information-density bewerten. Ziel: Name oben, darunter Community-Note (Zahl Handschrift-Akzent, Blätter), dann Terpen-Punkte (vorhandene Geschmacks-/Terpenchips kompakt), unten THC. Hersteller, CBD, Variantenzahl in die Fußzeile `text-caption text-text-muted`. Subgrid (`row-span-5`) bleibt, also genau fünf Zeilen. `min-w-0` bleibt (Überlauf-Fix 6bcfd95).

- [ ] **Step 1: Failing test** — gerenderte `BlueteKarte`: Index von Name < Note < erstes Terpen/Geschmack < „THC“; genau fünf direkte Kind-Zeilen im `<article>`.
- [ ] **Step 2:** FAIL. **Step 3:** Umbauen. **Step 4:** PASS, `npm test`.
- [ ] **Step 5:** Commit `Strains: Karte gewichtet Name, Note, Terpene, THC`.
- Startseite: `grep -rn "BlueteKarte\|StrainKarte" app components` — nutzt die Startseite sie, dort Darstellung prüfen und im selben Commit mitziehen (Dauerregel). Stand 2026-10-21: keine Nutzung außerhalb components/katalog.

---

## Abschluss (Hauptsession)

- [ ] Stränge A, B, C nacheinander nach `main` mergen, `npm test` + `npx tsc --noEmit` nach jedem Merge.
- [ ] Neuigkeit in `lib/neuigkeiten/eintraege.ts`.
- [ ] Ein Push nach `main`.
- [ ] Live-Prüfagent: /blueten bei 390/1280/1536/1920 hell/dunkel, `scrollWidth == innerWidth`, Popover per Tastatur (Tab, Enter, Esc, Fokus zurück), Sheet mobil, Startseite unverändert heil; S84-Prüfung gleich mit.
