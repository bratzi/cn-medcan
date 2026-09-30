import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AromaErkundung } from "@/components/review/AromaErkundung";
import type { KartenTerpen } from "@/lib/aromakarte";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";

/** Mitlaufendes Fazit (T16): ein Fazit im DOM, sticky ab xl, mobil Leiste mit Kurzwerten. */
const TERPENE: KartenTerpen[] = [{ name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.8, rang: 1 }];

function erkundung(mitEigen: boolean) {
  return renderToStaticMarkup(
    createElement(AromaErkundung, {
      titel: "Nebelharz 22 (fiktiv)",
      terpene: TERPENE,
      serien: [],
      zeilen: [],
      gesamteindruck: { werte: { aussehen: 2, geruch: 2, geschmack: 2, konsistenz: 2 }, anzahl: 2 },
      beschaffenheit: { werte: { chlorophyll: 1, trichomFarbe: 1 }, feuchte: 9, anzahl: 2 },
      eingabe: true,
      eigeneGesamtnote: mitEigen ? 5 : null,
      texte: aromaTexte(de, "de"),
    }),
  );
}

const anzahl = (html: string, teil: string) => html.split(teil).length - 1;

test("Fazit steht genau einmal im Markup, in der sticky Spalte ab xl", () => {
  const html = erkundung(true);
  assert.equal(anzahl(html, `>${de.aroma.erkundung.communityFazit}</dt>`), 1);
  assert.equal(anzahl(html, "<aside"), 1);
  const aside = /<aside[^>]*>/.exec(html)![0];
  assert.match(aside, /xl:sticky/);
  assert.match(aside, /xl:top-\[calc\(var\(--kopf-h,4rem\)\+2rem\)\]/);
  assert.match(html, /xl:grid-cols-\[minmax\(0,1fr\)_18rem\]/);
});

test("Mobile Leiste: aria-expanded/aria-controls aufs Fazit und die Kurzwerte samt Delta", () => {
  const html = erkundung(true);
  const leiste = /<button[^>]*data-fazit-leiste=""[^>]*>[\s\S]*?<\/button>/.exec(html)![0];
  const id = /<aside[^>]*id="([^"]+)"/.exec(html)![1];
  assert.match(leiste, /aria-expanded="false"/);
  assert.match(leiste, new RegExp(`aria-controls="${id}"`));
  assert.match(leiste, /xl:hidden/);
  assert.match(leiste, new RegExp(de.aroma.erkundung.deinFazit));
  assert.match(leiste, /Pkt\./);
  assert.match(leiste, /Prozentpunkte (über|unter) dem Community-Fazit|gleich dem Community-Fazit/);
});

test("Ohne eigene Werte zeigt die Leiste den Community-Wert, ohne Delta", () => {
  const leiste = /<button[^>]*data-fazit-leiste=""[^>]*>[\s\S]*?<\/button>/.exec(erkundung(false))![0];
  assert.match(leiste, new RegExp(de.aroma.erkundung.communityFazit));
  assert.doesNotMatch(leiste, /Pkt\./);
});
