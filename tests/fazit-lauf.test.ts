import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AromaErkundung } from "@/components/review/AromaErkundung";
import { KarteSofortKontext } from "@/components/review/AromaKarte";

/** Karte sofort zeichnen: im Server-HTML steht sonst nur der Platzhalter (CPU-Limit, Fehler 1102). */
function mitKarte(element: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(createElement(KarteSofortKontext.Provider, { value: true }, element));
}
import type { KartenTerpen } from "@/lib/aromakarte";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";

/** Mitlaufendes Fazit (T16): ein Fazit im DOM, sticky ab xl, mobil Leiste mit Kurzwerten. */
const TERPENE: KartenTerpen[] = [{ name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.8, rang: 1 }];

function erkundung(mitEigen: boolean) {
  return mitKarte(
    createElement(AromaErkundung, {
      titel: "Nebelharz 22 (fiktiv)",
      terpene: TERPENE,
      serien: [],
      zeilen: [],
      gesamteindruck: { werte: { aussehen: 2, geruch: 2, geschmack: 2, konsistenz: 2 }, anzahl: 2 },
      beschaffenheit: { werte: { chlorophyll: 1, trichomFarbe: 1 }, feuchte: 9, anzahl: 2 },
      modus: "maske",
      eigeneGesamtnote: mitEigen ? 5 : null,
      texte: aromaTexte(de, "de"),
    }),
  );
}

const anzahl = (html: string, teil: string) => html.split(teil).length - 1;

test("Fazit steht genau einmal im Markup, ab 118rem sticky außen im Seitenrand", () => {
  const html = erkundung(true);
  assert.equal(anzahl(html, `>${de.aroma.erkundung.communityFazit}</dt>`), 1);
  assert.equal(anzahl(html, "<aside"), 1);
  const aside = /<aside[^>]*>/.exec(html)![0];
  assert.match(aside, /min-\[118rem\]:absolute/);
  assert.match(aside, /min-\[118rem\]:left-full/);
  assert.match(html, /min-\[118rem\]:sticky min-\[118rem\]:top-\[calc\(var\(--kopf-h,4rem\)\+2rem\)\]/);
  // Die Regler behalten ihre Breite: kein Raster mit Fazitspalte mehr (Nutzer 2026-09-30).
  assert.doesNotMatch(html, /grid-cols-\[minmax\(0,1fr\)_18rem\]/);
});

test("Mobile Leiste: aria-expanded/aria-controls aufs Fazit und die Kurzwerte samt Delta", () => {
  const html = erkundung(true);
  const leiste = /<button[^>]*data-fazit-leiste=""[^>]*>[\s\S]*?<\/button>/.exec(html)![0];
  const id = /<aside[^>]*id="([^"]+)"/.exec(html)![1];
  assert.match(leiste, /aria-expanded="false"/);
  assert.match(leiste, new RegExp(`aria-controls="${id}"`));
  assert.match(leiste, /min-\[118rem\]:hidden/);
  assert.match(leiste, new RegExp(de.aroma.erkundung.deinFazit));
  assert.match(leiste, /Pkt\./);
  assert.match(leiste, /Prozentpunkte (über|unter) dem Community-Fazit|gleich dem Community-Fazit/);
});

test("Ohne eigene Werte zeigt die Leiste den Community-Wert, ohne Delta", () => {
  const leiste = /<button[^>]*data-fazit-leiste=""[^>]*>[\s\S]*?<\/button>/.exec(erkundung(false))![0];
  assert.match(leiste, new RegExp(de.aroma.erkundung.communityFazit));
  assert.doesNotMatch(leiste, /Pkt\./);
});

test("Handschrift-Zahl des Sortenfazits bleibt im Seitenrand ab 118rem bei 4rem (Fix I1)", () => {
  const html = erkundung(true);
  const zahlen = html.match(/class="[^"]*text-umschlag[^"]*"/g) ?? [];
  assert.ok(zahlen.length >= 2);
  for (const klasse of zahlen) assert.match(klasse, /min-\[118rem\]:text-\[4rem\]/);
});

test("Sheet hält den Fokus: Tab-Falle im Quelltext von FazitLauf (Fix I2)", async () => {
  const { readFileSync } = await import("node:fs");
  const quelle = readFileSync("components/review/FazitLauf.tsx", "utf8");
  assert.match(quelle, /ereignis\.key !== "Tab"/);
  assert.match(quelle, /letztes\.focus\(\)/);
  assert.match(quelle, /erstes\.focus\(\)/);
});
