import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KatalogAnsicht } from "@/components/katalog/KatalogAnsicht";
import { MobilLeiste } from "@/components/katalog/MobilLeiste";
import { Werkzeugleiste } from "@/components/katalog/Werkzeugleiste";
import { de } from "@/lib/i18n/de";
import type { BlueteZeile } from "@/lib/katalog/typen";
import { SORTIERUNGEN, leererFilter } from "@/lib/query/filter";

const lies = (pfad: string) => readFileSync(pfad, "utf8");

const leiste = (teil: Partial<ComponentProps<typeof Werkzeugleiste>> = {}) =>
  renderToStaticMarkup(
    createElement(Werkzeugleiste, {
      filter: { ...leererFilter(), sortierung: "stimmen" },
      aktiv: 2,
      filterOffen: false,
      filterId: "katalog-filter",
      umschalten: () => undefined,
      setze: () => undefined,
      deaktiviert: false,
      trefferText: "123 Blüten",
      texte: de.katalog,
      ...teil,
    }),
  );

const optionen = (html: string) => [...html.matchAll(/<option value="([^"]+)"[^>]*>([^<]+)<\/option>/g)];

test("Werkzeugleiste: der Filter-Knopf steuert die Filterspalte und nennt die Zahl aktiver Filter", () => {
  const knopf = leiste().match(/<button[^>]*aria-controls="katalog-filter"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? "";
  assert.match(knopf, /aria-expanded="false"/);
  assert.match(knopf, />Filter</);
  assert.match(knopf, />2<\/span>/);
  assert.match(leiste({ filterOffen: true }), /aria-expanded="true"/);
});

test("Werkzeugleiste: Sortierung als select mit derselben Liste wie mobil, die gewählte steht", () => {
  const html = leiste();
  assert.deepEqual(optionen(html).map((o) => o[1]), [...SORTIERUNGEN]);
  assert.deepEqual(optionen(html).map((o) => o[2]), SORTIERUNGEN.map((s) => de.katalog.leiste.sortierungen[s]));
  assert.match(html, /<option value="stimmen" selected="">/);
  assert.match(html, /<label[^>]*>Sortierung<\/label>/);
});

test("Werkzeugleiste: Filter-Knopf und Sortierung erst ab lg, Ansicht und Trefferzahl auch mobil", () => {
  const html = leiste();
  const knopf = html.match(/<button[^>]*aria-controls="katalog-filter"[^>]*>/)?.[0] ?? "";
  assert.match(knopf, /class="[^"]*\bhidden\b[^"]*\blg:inline-flex\b/);
  assert.match(html, /<div class="hidden[^"]*lg:flex[^"]*"><label/);
  assert.match(html, /<nav aria-label="Ansicht">/);
  assert.match(html, /<p aria-live="polite"[^>]*>123 Blüten<\/p>/);
});

test("Sortierung: MobilLeiste und Werkzeugleiste teilen eine Komponente statt Doppelcode", () => {
  for (const datei of ["MobilLeiste", "Werkzeugleiste"]) {
    const s = lies(`components/katalog/${datei}.tsx`);
    assert.match(s, /<SortierWahl/, datei);
    assert.doesNotMatch(s, /SORTIERUNGEN\.map/, datei);
  }
  const mobil = renderToStaticMarkup(
    createElement(MobilLeiste, { filter: leererFilter(), aktiv: 0, gesamt: 3, setze: () => undefined, oeffne: () => undefined, texte: de.katalog.leiste }),
  );
  assert.deepEqual(optionen(mobil).map((o) => o[1]), [...SORTIERUNGEN]);
  assert.match(mobil, /<label[^>]*class="sr-only"[^>]*>Sortierung<\/label>/);
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

test("Katalog-Insel: Werkzeugleiste über Filterspalte und Raster, aria-controls zeigt auf die Spalte", () => {
  const html = ansicht();
  const ziel = html.match(/aria-controls="([^"]+)"/)?.[1];
  assert.ok(ziel, "Filter-Knopf ohne aria-controls");
  const spalte = html.match(new RegExp(`<aside[^>]*id="${ziel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`))?.[0] ?? "";
  assert.match(spalte, /class="katalog-filterspalte /);
  const pos = ["data-werkzeugleiste", `id="${ziel}"`, "data-legende", "data-kultivar"].map((m) => html.indexOf(m));
  assert.ok(pos.every((p) => p >= 0), `Teil fehlt: ${pos.join(",")}`);
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
  assert.equal(html.split("data-legende").length - 1, 1, "Legende genau einmal");
});

test("Katalog-Insel: Raster ab 15rem je Spalte mit gap-6, Karten teilen ihre Zeilen per subgrid", () => {
  const html = ansicht();
  assert.match(html, /<ul class="grid grid-cols-\[repeat\(auto-fill,minmax\(min\(15rem,100%\),1fr\)\)\] gap-6">/);
  assert.match(html, /<li class="row-span-5 grid grid-rows-subgrid" data-kultivar="k1">/);
  assert.doesNotMatch(lies("components/katalog/KatalogAnsicht.tsx"), /16rem/);
});

test("Katalog-Insel: Zustand der Spalte aus useSyncExternalStore, Wahl beim Mount aus dem Speicher nachgezogen", () => {
  const s = lies("components/katalog/KatalogAnsicht.tsx");
  assert.match(s, /useSyncExternalStore\(abonniereFilterSpalte, filterSpalteOffen, \(\) => false\)/);
  assert.match(s, /useLayoutEffect\(\(\) => zeigeFilterWahl\(gespeicherteFilterWahl\(\)\), \[\]\)/);
});

test("Blütenseite: volle Breite mit Seitenrand, Kopf im Lesemaß, kein zweites main", () => {
  const seite = lies("app/[lang]/blueten/page.tsx");
  assert.doesNotMatch(seite, /max-w-7xl/);
  assert.doesNotMatch(seite, /<main/);
  assert.match(seite, /className="w-full px-4 py-10 sm:px-8 lg:py-16"/);
  assert.match(seite, /<header className="flex max-w-\[68ch\] flex-col gap-2">/);
});
