import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CannabinoidBar } from "@/components/produkt/CannabinoidBar";
import { TerpenChips } from "@/components/produkt/TerpenChips";
import { Titelblatt, type TitelblattProps } from "@/components/produkt/Titelblatt";
import { CommunityStimmen } from "@/components/review/CommunityStimmen";
import type { ReviewEintrag } from "@/lib/query/strains";

const BASIS: TitelblattProps = {
  handelsname: "Nebelharz 22 (fiktiv)",
  kultivarName: "Nebelharz",
  kultivarTyp: "INDICA",
  darreichungsform: "BLUETE",
  anzahlApothekenVerfuegbar: 2,
  thcMin: 20,
  thcMax: 24,
  cbdMin: 0,
  cbdMax: 1,
  meineBewertung: null,
};
const zeige = (props: TitelblattProps) => renderToStaticMarkup(createElement(Titelblatt, props));
const TAG = new Date("2026-09-12T12:00:00Z");

test("Meine Note mit Datum und Charge", () => {
  const html = zeige({ ...BASIS, meineBewertung: { note: 4.6, erstelltAm: TAG, chargenNr: "CH-2401" } });
  assert.match(html, /Unsere Note/);
  assert.match(html, />4,6</);
  assert.match(html, /Bewertet am 12\.09\.2026, Charge CH-2401/);
});

test("Meine Note ohne Charge: nur das Datum", () => {
  const html = zeige({ ...BASIS, meineBewertung: { note: 4, erstelltAm: TAG, chargenNr: null } });
  assert.match(html, /Bewertet am 12\.09\.2026</);
  assert.doesNotMatch(html, /Charge/);
});

test("ohne eigene Bewertung: noch nicht getestet, Weg zur Abstimmung", () => {
  const html = zeige(BASIS);
  assert.match(html, /Noch nicht von uns getestet./);
  assert.match(html, /href="\/umfragen"[^>]*>Zur Abstimmung</);
  assert.doesNotMatch(html, /Meine Note/);
});

test("Titelblatt: Papier statt Glas, kein Bild, langer Name bricht um", () => {
  const html = zeige({ ...BASIS, handelsname: "Sehrlangerhandelsnameohneleerzeichenundmitvielenbuchstaben" });
  assert.doesNotMatch(html, /backdrop-blur|background-image|bg-surface\/95/);
  assert.match(html, /<h1[^>]*wrap-break-word/);
  assert.match(html, /hyphens-auto/);
});

test("Verfügbarkeit in der Einzahl", () => {
  assert.match(zeige({ ...BASIS, anzahlApothekenVerfuegbar: 1 }), /Bei 1 Apotheke verfügbar/);
  assert.match(zeige({ ...BASIS, anzahlApothekenVerfuegbar: 0 }), /Derzeit nicht lieferbar/);
});

function stimme(id: string, note: number, notiz: string | null): ReviewEintrag {
  return {
    id,
    istRedaktionell: false,
    aussehen: note,
    geruch: note,
    geschmack: note,
    wirkung: note,
    konsistenz: note,
    feuchtigkeitProzent: null,
    geschmacksMatrix: null,
    terpenIntensitaet: null,
    notiz,
    instagramReelUrl: null,
    chargenNr: null,
    erstelltAm: TAG,
  };
}

test("Community: Mittel in Einzahl und Mehrzahl als ganze Sätze", () => {
  const eine = renderToStaticMarkup(createElement(CommunityStimmen, { bewertungen: [stimme("c1", 3, null)], mittel: 3 }));
  assert.match(eine, /Aus einer Bewertung: <span class="numeric">3,0<\/span> von 5/);
  const zwei = renderToStaticMarkup(
    createElement(CommunityStimmen, { bewertungen: [stimme("c1", 3, "Gut."), stimme("c2", 4, null)], mittel: 3.5 }),
  );
  assert.match(zwei, /Mittel aus 2 Bewertungen: <span class="numeric">3,5<\/span> von 5/);
  assert.equal(zwei.match(/<li/g)?.length, 2);
  assert.match(zwei, /<h2[^>]*>Stimmen der Community<\/h2>/);
});

test("Datengrafik in Tinte, Terpen-Chips als Pillen ohne Grün", () => {
  const balken = renderToStaticMarkup(createElement(CannabinoidBar, { thcMin: 20, thcMax: 24, cbdMin: 0, cbdMax: 1 }));
  assert.doesNotMatch(balken, /bg-accent/);
  const chips = renderToStaticMarkup(
    createElement(TerpenChips, { terpene: [{ name: "Myrcen", rang: 1 }, { name: "Limonen", rang: 2 }] }),
  );
  assert.doesNotMatch(chips, /accent/);
  assert.match(chips, /rounded-full/);
  assert.match(chips, /border-2 border-text/);
});

test("Titelblatt: Weg zur Abstimmung ist 44 px hoch", () => {
  assert.match(zeige(BASIS), /<a[^>]*class="[^"]*min-h-11[^"]*"[^>]*>Zur Abstimmung</);
});

test("Titelblatt: THC und CBD brechen nicht zwischen Bezeichnung und Wert um", () => {
  const html = zeige(BASIS);
  assert.match(html, /<span class="whitespace-nowrap">THC [^<]*<\/span>/);
  assert.match(html, /<span class="whitespace-nowrap">CBD [^<]*<\/span>/);
});
