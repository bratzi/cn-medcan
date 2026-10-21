import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KatalogAnsicht } from "@/components/katalog/KatalogAnsicht";
import { Werkzeugleiste } from "@/components/katalog/Werkzeugleiste";
import { de } from "@/lib/i18n/de";
import { SORTIER_MEHR, SORTIER_SEGMENT } from "@/lib/katalog/chipleiste";
import type { BlueteZeile } from "@/lib/katalog/typen";
import { leererFilter, type StrainFilter } from "@/lib/query/filter";

const lies = (pfad: string) => readFileSync(pfad, "utf8");

type LeistenProps = ComponentProps<typeof Werkzeugleiste>;
const daten = (fachkreis: boolean): LeistenProps["daten"] => ({
  vertreiber: [{ i: "v1", n: "Aurora" }],
  terpene: [{ n: "Myrcen", g: "ERDIG" }],
  apotheken: [{ s: "a1", n: "Apotheke Eins" }],
  fachkreis,
});

const leiste = (teil: Partial<LeistenProps> = {}) =>
  renderToStaticMarkup(
    createElement(Werkzeugleiste, {
      filter: { ...leererFilter(), sortierung: "stimmen" },
      zahlen: null,
      daten: daten(false),
      setze: () => undefined,
      deaktiviert: false,
      trefferText: "123 Blüten",
      gesamt: 123,
      aktiveChips: [],
      zuruecksetzen: () => undefined,
      texte: de.katalog,
      labels: de.label,
      sprache: "de",
      ...teil,
    }),
  );

test("Werkzeugleiste: Sortier-Segment zeigt vier Knöpfe, aktiver pressed", () => {
  const html = leiste({ filter: { ...leererFilter(), sortierung: "stimmen" } });
  for (const s of SORTIER_SEGMENT) assert.match(html, new RegExp(`>${de.katalog.leiste.sortierenKurz[s]}<`));
  assert.match(html, /aria-pressed="true"[^>]*>Stimmen</);
});

test("Werkzeugleiste: Sortierung aus Mehr-Menü markiert den …-Knopf", () => {
  const html = leiste({ filter: { ...leererFilter(), sortierung: "name" } });
  assert.match(html, /aria-pressed="true"[^>]*>Name/);
});

test("Werkzeugleiste: Suchtext mit Relevanz zeigt den …-Knopf aktiv mit „zuletzt geändert“ (Review Focus 2)", () => {
  const html = leiste({ filter: { ...leererFilter(), q: "haze", sortierung: "relevanz" } });
  assert.match(html, /aria-pressed="true"[^>]*>zuletzt geändert/);
});

test("Werkzeugleiste: Mehr-Menü bietet genau die übrigen Sortierungen", () => {
  const html = leiste();
  for (const s of SORTIER_MEHR) assert.match(html, new RegExp(`>${de.katalog.leiste.sortierungen[s]}<`));
});

test("Werkzeugleiste: Chip zeigt Zahl aktiver Werte", () => {
  const html = leiste({ filter: { ...leererFilter(), terp: ["Myrcen", "Limonen"] } });
  assert.match(html, />Terpene<[\s\S]*?>2</);
});

test("Werkzeugleiste: Chip „Mehr“ nur mit Fachkreis (Review Focus 3)", () => {
  assert.doesNotMatch(leiste({ daten: daten(false) }), />Mehr</);
  assert.match(leiste({ daten: daten(true) }), />Mehr</);
});

test("Werkzeugleiste: Chipleiste scrollt mobil waagerecht, ab lg umbrechend (Review Focus 4)", () => {
  const html = leiste();
  const zeile = html.match(/<div[^>]*data-chipleiste[^>]*>/)?.[0] ?? "";
  for (const k of ["flex-nowrap", "overflow-x-auto", "overscroll-x-contain", "lg:flex-wrap", "lg:overflow-visible", "min-w-0"])
    assert.match(zeile, new RegExp(`\\b${k.replace(":", "\\:")}\\b`), k);
});

test("Werkzeugleiste: sticky unter dem Seitenkopf, Trefferzahl in Handschrift, Wort gedruckt", () => {
  const html = leiste();
  assert.match(html, /<div[^>]*data-werkzeugleiste[^>]*class="[^"]*\bsticky\b[^"]*top-\(--kopf-h,4rem\)/);
  assert.match(html, /<p aria-live="polite"[^>]*><span class="[^"]*font-hand[^"]*text-accent[^"]*">123<\/span> Blüten<\/p>/);
});

test("Werkzeugleiste: Ansicht als Segment mit aria-pressed", () => {
  const html = leiste();
  assert.match(html, /aria-pressed="true"[^>]*>Blüten</);
  assert.match(html, /aria-pressed="false"[^>]*>Handelsnamen</);
});

test("Aktiv-Zeile: Chips entfernbar, Zurücksetzen, Legende", () => {
  const html = leiste({
    aktiveChips: [{ schluessel: "terp-Myrcen", text: "Myrcen", ohne: { terp: [] } as Partial<StrainFilter> }],
  });
  assert.match(html, /aria-label="Filter Myrcen entfernen"/);
  assert.match(html, new RegExp(`>${de.katalog.zuruecksetzen}<`));
  assert.match(html, /data-legende/);
});

test("Sichtbare Texte ohne Ware und Stärke", () => {
  const html = leiste({ daten: daten(true) });
  assert.doesNotMatch(html, /Ware|Stärke/);
});

const ZEILE: BlueteZeile = {
  id: "k1", name: "Apples & Bananas", slug: "apples-bananas", typ: "HYBRID", thcMin: 24, thcMax: 27, cbdMax: 0.5,
  terpene: [{ name: "Ocimen", geschmack: "SUESS" }], vertreiberIds: [], handelsnamen: 1, community: null, geschmackMedian: null,
  eigeneNote: null, letzteBewertung: null, bildSlug: null, herstellerBildPfad: null, suchtext: "", waren: [],
};

const ansicht = () =>
  renderToStaticMarkup(
    createElement(KatalogAnsicht, { start: { zeilen: [ZEILE], gesamt: 1, seitenAnzahl: 1, vertreiber: [] }, w: de, sprache: "de" }),
  );

test("Aktiv-Zeile nur bei aktiven Filtern", () => {
  assert.doesNotMatch(ansicht(), /Alle zurücksetzen|Alle löschen|Alle Filter zurücksetzen/);
});

test("Katalog-Insel: Suche über der Leiste, Legende genau einmal, kein aside", () => {
  const html = ansicht();
  const pos = ['type="search"', "data-werkzeugleiste", "data-kultivar"].map((m) => html.indexOf(m));
  assert.ok(pos.every((p) => p >= 0), `Teil fehlt: ${pos.join(",")}`);
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
  assert.equal(html.split("data-legende").length - 1, 1, "Legende genau einmal");
  assert.doesNotMatch(html, /<aside/);
});

test("Katalog-Insel: Raster volle Breite 1/2/3/4/5 Spalten", () => {
  const html = ansicht();
  assert.match(html, /<ul class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">/);
  assert.match(html, /<li class="[^"]*grid-rows-subgrid[^"]*" data-kultivar="k1">/);
});

test("Altes ist weg", () => {
  for (const p of ["components/katalog/MobilLeiste.tsx", "components/katalog/FilterSchublade.tsx", "lib/katalog/filterspalte.ts", "tests/katalog-filterspalte.test.ts"])
    assert.ok(!existsSync(p), p);
  assert.doesNotMatch(lies("app/globals.css"), /katalog-filterspalte|katalog-filterknopf/);
  assert.doesNotMatch(lies("app/[lang]/layout.tsx"), /FILTER_SKRIPT/);
  assert.doesNotMatch(lies("components/katalog/KatalogAnsicht.tsx"), /GeschmackLegende/);
});

test("Blütenseite: volle Breite mit Seitenrand, Kopf im Lesemaß, kein zweites main", () => {
  const seite = lies("app/[lang]/blueten/page.tsx");
  assert.doesNotMatch(seite, /max-w-7xl/);
  assert.doesNotMatch(seite, /<main/);
  assert.match(seite, /className="w-full px-4 py-10 sm:px-8 lg:py-16"/);
});
