import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AromaErkundung } from "@/components/review/AromaErkundung";
import { AromaKarte } from "@/components/review/AromaKarte";
import { TerpenRegler } from "@/components/review/TerpenRegler";
import type { KartenTerpen } from "@/lib/aromakarte";
import { vorbelegungAus } from "@/lib/bewertung-vorbelegung";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";
import { leereGeschmacksMatrix } from "@/lib/query/bewertung";

/**
 * Aroma-Karte mit drei Ebenen (Masterplan Bewertung v2, T5): Herstellerangabe
 * mit vollem Puls, vom Nutzer ergänzt gestrichelt in eigener Farbe, Geister
 * blass ohne Puls; grüner Regler auf dem Community-Median.
 */
const texte = aromaTexte(de, "de");
const TERPINOLEN: KartenTerpen = { name: "Terpinolen", geschmack: "KRAEUTRIG", konzentrationProzent: null, rang: 99 };
const LIMONEN: KartenTerpen = { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: null, rang: 1 };
// Terpinolen trägt Kräutrig, Blumig, Zitrus und Holzig: alle vier Richtungen haben hier Werte.
const VOLL = { ...leereGeschmacksMatrix(), zitrus: 5, kraeutrig: 5, blumig: 5, holzig: 5 };
const HERSTELLER = { name: "Laut Hersteller", ton: "gruen" as const, matrix: VOLL };

const BEWERTUNG = { name: "Diese Bewertung", ton: "lila" as const, matrix: VOLL };
const karte = (props: Partial<Parameters<typeof AromaKarte>[0]>) =>
  renderToStaticMarkup(createElement(AromaKarte, { terpene: [TERPINOLEN], serien: [HERSTELLER, BEWERTUNG], texte, ...props }));

test("Geist: ein Geschmack allein zündet kein Terpen, blasser Bogen ohne Puls und ohne Lichtpunkt", () => {
  // Selbst mit Kraft (wie früher über den Geschmack) bleibt ein Geist ein Geist: die Ebene entscheidet.
  const html = karte({ ebenen: { Terpinolen: "geist" }, staerken: { Terpinolen: 0.6 } });
  assert.doesNotMatch(html, /class="bogen-puls"/);
  assert.doesNotMatch(html, /class="bogen-fluss"/);
  assert.doesNotMatch(html, /filter:saturate\(/);
});

test("Ergänzt: gestrichelt in eigener Farbe (Kopierstift), Lichtpunkt ja, voller Puls nein", () => {
  const html = karte({ ebenen: { Terpinolen: "ergaenzt" }, staerken: { Terpinolen: 0.36 } });
  assert.match(html, /<path[^>]*stroke="var\(--color-kopierstift\)"[^>]*stroke-dasharray="6 5"/);
  // Voller Wert (5): die ganze Linie pulsiert statt eines Lichtstrichs (T5d).
  assert.match(html, /class="bogen-voll"/);
  assert.doesNotMatch(html, /class="bogen-puls"/);
  // Knoten mit gestrichelter Kontur statt gefüllt.
  assert.match(html, /<circle[^>]*stroke="var\(--color-kopierstift\)"[^>]*stroke-dasharray="3 2.5"/);
});

test("Herstellerangabe (T5b): stiller Streifen, die Bewertung darüber mit Lichtfluss, kein Puls", () => {
  const html = karte({ terpene: [LIMONEN], ebenen: { Limonen: "hersteller" } });
  assert.match(html, /data-schicht="streifen"/);
  assert.match(html, /class="bogen-(fluss|voll)"/);
  assert.doesNotMatch(html, /bogen-puls/);
});

test("Legende der Ebenen nur, wenn es mehr als die Herstellerangabe gibt", () => {
  const mit = karte({ terpene: [LIMONEN, TERPINOLEN], ebenen: { Limonen: "hersteller", Terpinolen: "geist" } });
  assert.match(mit, new RegExp(de.aroma.karte.ebenen.hersteller));
  assert.match(mit, new RegExp(de.aroma.karte.ebenen.geist));
  assert.doesNotMatch(mit, new RegExp(de.aroma.karte.ebenen.ergaenzt));
  const ohne = karte({ terpene: [LIMONEN] });
  assert.doesNotMatch(ohne, new RegExp(de.aroma.karte.ebenen.geist));
});

const REGLER = { werte: VOLL, aendern: () => {} };

test("Skala links: „Terpen-Intensität“ ohne Sweet Spot (T5d), grüner Ring auf dem Community-Median", () => {
  const html = karte({ regler: { ...REGLER, vergleich: { ...VOLL, zitrus: 2 } } });
  assert.match(html, /Terpen-Intensität/);
  assert.doesNotMatch(html, /Sweet Spot/);
  assert.match(html, new RegExp(de.aroma.karte.median));
  assert.match(html, /<circle[^>]*r="11.5"[^>]*stroke="var\(--color-accent\)"/);
  assert.doesNotMatch(html, new RegExp(de.aroma.karte.keinMedian));
});

test("Review Focus 1: ohne Median kein grüner Regler, dafür „Noch kein Community-Wert“, nichts zeigt 0 oder NaN", () => {
  const html = karte({ regler: REGLER });
  assert.match(html, new RegExp(de.aroma.karte.keinMedian));
  assert.doesNotMatch(html, /r="11.5"/);
  assert.doesNotMatch(html, /NaN/);
});

// ---------------------------------------------------------------------------
//  Erkundung und Maske
// ---------------------------------------------------------------------------

const TERPENE: KartenTerpen[] = [
  { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.8, rang: 1 },
  { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: 0.4, rang: 2 },
];
const KATALOG = [
  { name: "Limonen", geschmack: "ZITRUS" as const },
  { name: "Myrcen", geschmack: "ERDIG" as const },
  { name: "Ocimen", geschmack: "SUESS" as const },
  { name: "Terpinolen", geschmack: "KRAEUTRIG" as const },
];
const MEDIAN = { geschmack: { ...leereGeschmacksMatrix(), erdig: 3, zitrus: 2 }, terpene: { Myrcen: 3, Limonen: 3 }, anzahl: 2 };

function vorbelegung(terpenIntensitaet: Record<string, number>) {
  return vorbelegungAus({
    aussehen: 4,
    geruch: 4,
    geschmack: 4,
    wirkung: 3,
    konsistenz: 4,
    gesamtnote: 4,
    feuchtigkeitProzent: null,
    geschmacksMatrix: JSON.stringify({ ...leereGeschmacksMatrix(), erdig: 4 }),
    terpenIntensitaet: JSON.stringify(terpenIntensitaet),
    beschaffenheit: null,
    notiz: null,
    instagramReelUrl: null,
    charge: null,
    aktualisiertAm: new Date("2026-09-29T10:00:00.000Z"),
  });
}

const erkundung = (props: Partial<Parameters<typeof AromaErkundung>[0]>) =>
  renderToStaticMarkup(
    createElement(AromaErkundung, {
      titel: "Nebelharz 22 (fiktiv)",
      terpene: TERPENE,
      katalog: KATALOG,
      serien: [],
      zeilen: [
        { terpen: "Myrcen", wert: 3, anzahl: 2 },
        { terpen: "Limonen", wert: 3, anzahl: 2 },
      ],
      texte,
      ...props,
    }),
  );

test("Maske: „Deine Nase vs. Community“ am Kartenende mit Ø Δ und der Zahl ergänzter Terpene", () => {
  const html = erkundung({ eingabe: true, median: MEDIAN, vorbelegung: vorbelegung({ Myrcen: 2, Limonen: 5, Ocimen: 4 }) });
  assert.match(html, new RegExp(de.aroma.karte.nase));
  // |2 - 3| und |5 - 3|: Ø 1,5; Ocimen ist ergänzt.
  assert.match(html, /Ø Δ 1,5/);
  assert.match(html, /1 ergänztes Terpen/);
});

test("Ohne Median oder ohne eigene Terpenwerte keine Abweichungszeile", () => {
  assert.doesNotMatch(erkundung({ eingabe: true, vorbelegung: vorbelegung({ Myrcen: 2 }) }), new RegExp(de.aroma.karte.nase));
  assert.doesNotMatch(erkundung({ median: MEDIAN }), new RegExp(de.aroma.karte.nase));
});

test("Erkundung: grüner Regler auf dem Median, ohne Median der Hinweis", () => {
  assert.match(erkundung({ median: MEDIAN }), /<circle[^>]*r="11.5"[^>]*stroke="var\(--color-accent\)"/);
  const ohne = erkundung({ median: null });
  assert.doesNotMatch(ohne, /r="11.5"/);
  assert.match(ohne, new RegExp(de.aroma.karte.keinMedian));
});

/** Die versteckten Felder der Maske, so wie das Formular sie abschickt. */
function felder(html: string): Map<string, string> {
  const aus = new Map<string, string>();
  for (const [tag] of html.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = /name="([^"]*)"/.exec(tag)?.[1];
    const wert = /value="([^"]*)"/.exec(tag)?.[1];
    if (name && wert !== undefined) aus.set(name, wert);
  }
  return aus;
}

test("Maske: ergänzt folgt dem Regler, auf 0 zurückgezogen geht es nicht mit (T5d)", () => {
  const html = erkundung({ eingabe: true, vorbelegung: vorbelegung({ Myrcen: 0, Ocimen: 4, Terpinolen: 0 }) });
  const f = felder(html);
  // Herstellerterpen auf 0 heißt „nicht geschmeckt“ und zählt; ergänzt auf 0 heißt nicht ergänzt.
  assert.equal(f.get("terpen-Myrcen"), "0");
  assert.equal(f.get("terpen-Ocimen"), "4");
  assert.equal(f.has("terpen-Terpinolen"), false);
  assert.match(html, new RegExp(de.aroma.terpenRegler.nichtAngegeben));
  assert.match(html, new RegExp(de.aroma.terpenRegler.weitere));
  // Kein manueller Ergänzen-Schritt und kein Sweet Spot mehr bei den Terpenen.
  assert.doesNotMatch(html, /Weiteres Terpen geschmeckt\?/);
  assert.doesNotMatch(html, /Sweet Spot gesucht/);
});

test("Maske: alle Katalogterpene stehen als Regler, Herstellerterpene zuerst (T5d)", () => {
  const html = erkundung({ eingabe: true, vorbelegung: vorbelegung({ Myrcen: 2 }) });
  const myrcen = html.indexOf("Myrcen: Intensität");
  assert.ok(myrcen >= 0);
  assert.ok(html.indexOf("Ocimen: Intensität") > myrcen);
  assert.ok(html.indexOf("Terpinolen: Intensität") > myrcen);
  // Nichts ergänzt: die weiteren Terpene sind zugeklappt.
  assert.doesNotMatch(html, /<details open/);
  // Ohne Eingabe (Startseite) keine Regler.
  assert.doesNotMatch(erkundung({}), /Myrcen: Intensität/);
});

test("Terpen-Regler: der Community-Wert ist ein grüner Ring um den eigenen Punkt", () => {
  const html = renderToStaticMarkup(
    createElement(TerpenRegler, {
      titel: "Je Terpen",
      hersteller: ["Myrcen"],
      weitere: [],
      zeilen: [{ terpen: "Myrcen", wert: 2.5, anzahl: 3 }],
      texte,
      bedienung: { eigen: { Myrcen: 4 }, aendern: () => {} },
    }),
  );
  assert.match(html, /border-accent/);
  assert.match(html, /Community-Median 2,5/);
});
