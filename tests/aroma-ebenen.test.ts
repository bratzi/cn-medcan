import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AromaErkundung } from "@/components/review/AromaErkundung";
import { erkundungsDaten } from "@/components/review/erkundung-daten";
import { AromaKarte, KarteSofortKontext } from "@/components/review/AromaKarte";

/** Karte sofort zeichnen: im Server-HTML steht sonst nur der Platzhalter (CPU-Limit, Fehler 1102). */
function mitKarte(element: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(createElement(KarteSofortKontext.Provider, { value: true }, element));
}
import {
  achsenIndex,
  communityMedian,
  terpenKandidaten,
  type KartenTerpen,
} from "@/lib/aromakarte";
import { vorbelegungAus } from "@/lib/bewertung-vorbelegung";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";
import { leereGeschmacksMatrix, mittleTerpenIntensitaet, terpenAnAus } from "@/lib/query/bewertung";

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
  mitKarte(createElement(AromaKarte, { terpene: [TERPINOLEN], serien: [HERSTELLER, BEWERTUNG], texte, ...props }));

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
  // Wert 5 ist „zu viel“ (Sweet-Spot-Skala, Nutzer 2026-09-30): ein kurzer Lichtstrich, kein Pulsieren.
  assert.match(html, /class="bogen-fluss"/);
  assert.doesNotMatch(html, /class="bogen-voll"/);
  assert.doesNotMatch(html, /class="bogen-puls"/);
  // Genau im Sweet Spot pulsiert die ganze Linie.
  const mitte = { ...leereGeschmacksMatrix(), zitrus: 2.5, kraeutrig: 2.5, blumig: 2.5, holzig: 2.5 };
  const imSweetSpot = karte({
    ebenen: { Terpinolen: "ergaenzt" },
    serien: [HERSTELLER, { ...BEWERTUNG, matrix: mitte }],
  });
  assert.match(imSweetSpot, /class="bogen-voll"/);
  assert.doesNotMatch(imSweetSpot, /class="bogen-fluss"/);
  // Knoten mit gestrichelter Kontur statt gefüllt.
  assert.match(html, /<circle[^>]*stroke="var\(--color-kopierstift\)"[^>]*stroke-dasharray="3 2.5"/);
});

test("Herstellerangabe ohne Streifen (Nutzer 2026-09-30), die Bewertung mit Lichtfluss, kein Puls", () => {
  const html = karte({ terpene: [LIMONEN], ebenen: { Limonen: "hersteller" } });
  assert.doesNotMatch(html, /data-schicht="streifen"/);
  // Zitrus steht auf 5 (VOLL), also „zu viel“: ein laufender Lichtstrich statt Pulsieren.
  assert.match(html, /class="bogen-fluss"/);
  assert.doesNotMatch(html, /class="bogen-voll"/);
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

test("Skala links: „Sweet Spot je Geschmack“ (Nutzer 2026-09-30), grüner Ring auf dem Community-Median", () => {
  const html = karte({ regler: { ...REGLER, vergleich: { ...VOLL, zitrus: 2 } } });
  assert.match(html, new RegExp(`>${de.aroma.karte.sweetSkala.titel}<`));
  assert.doesNotMatch(html, /Terpen-Intensität/);
  assert.match(html, new RegExp(`>${de.aroma.karte.sweetSkala.mitte}<`));
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
  mitKarte(
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

/** Das Terpen-fieldset der Karte (sr-only), erkannt an seiner Legende; ohne Regler null. */
function terpenFeld(html: string): string | null {
  const start = html.indexOf(`<legend>${de.aroma.karte.terpenLegende}</legend>`);
  return start < 0 ? null : html.slice(start, html.indexOf("</fieldset>", start));
}

test("Anzeige ohne Maske: keine Terpen-Regler in der Karte, der Hinweis nennt nur die linke Seite", () => {
  const html = erkundung({ median: MEDIAN });
  assert.equal(terpenFeld(html), null);
  assert.doesNotMatch(html, /data-terpen-griff/);
  assert.ok(html.includes(de.aroma.karte.hinweisRegler));
  assert.ok(!html.includes(de.aroma.karte.hinweisTerpenRegler));
  assert.equal(terpenFeld(karte({})), null);
});

// ---------------------------------------------------------------------------
//  Terpen-Regler in der Karte (Nutzer 2026-09-30: keine eigene Box, ein Regler je Terpen)
// ---------------------------------------------------------------------------

/**
 * Überarbeitung des Kartengraphs (Nutzer 2026-10-03): die Herstellerangaben sagen nichts über
 * die Geschmacksintensität, also verschwinden sie als Serie und als Soll-Strich. Die Infotafel
 * überlagert, statt Höhe zu reservieren, und jede Achse wie jedes Terpen hat eine Trefffläche,
 * damit die Box im Web schon beim Überfahren wechselt.
 */
const quelleKarte = () => readFileSync(join(process.cwd(), "components/review/AromaKarte.tsx"), "utf8");

test("Erkundungsdaten tragen keine grüne Herstellerserie mehr (Nutzer 2026-10-03)", () => {
  const terpene: KartenTerpen[] = [{ name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.8, rang: 1 }];
  const daten = erkundungsDaten(terpene, [], { hersteller: "Laut Hersteller", community: "Laut Community" }, null);
  assert.deepEqual(daten.serien, []);
});

test("Karte zeichnet keinen Soll-Strich und kennt kein bezug mehr (Nutzer 2026-10-03)", () => {
  const quelle = quelleKarte();
  assert.doesNotMatch(quelle, /data-schicht="soll"/);
  assert.doesNotMatch(quelle, /sollSerie/);
  assert.doesNotMatch(quelle, /bezug\?: "median" \| "serie"/);
  assert.doesNotMatch(quelle, /art="soll"/);
});

test("Ein Geschmackswert über Null macht die Achse aktiv (Nutzer 2026-10-03)", () => {
  const quelle = quelleKarte();
  assert.match(quelle, /const achseFarbig = \(index: number\) => \(aktiv === null \? wertAuf\(index\) > 0 :/);
  assert.doesNotMatch(quelle, /wertAuf\(index\) > SPUERBAR/);
});

test("Infotafel hat feste Höhe, die Sektion springt nicht und die Karte bleibt frei (Nutzer 2026-10-03)", () => {
  const quelle = quelleKarte();
  // Keine Mindesthöhe mehr, die ein langer Terpentext überschreiten könnte.
  assert.doesNotMatch(quelle, /min-h-80/);
  assert.doesNotMatch(quelle, /sm:min-h-56/);
  // Feste Höhe statt Mindesthöhe: der Platz ändert sich nie.
  assert.match(quelle, /"pointer-events-none grid h-56 justify-items-center overflow-hidden"/);
  // Langer Text scrollt in der Tafel, statt die Sektion zu dehnen.
  assert.match(quelle, /\*:max-h-56 \*:overflow-y-auto/);
});

test("Jede Achse und jedes Terpen hat eine Trefffläche, auch ohne Regler (Nutzer 2026-10-03)", () => {
  const quelle = quelleKarte();
  assert.match(quelle, /data-treffer="achse"/);
  assert.match(quelle, /data-treffer="terpen"/);
  // Die Flächen hängen nicht an der Maske: ihr Block prüft nur die Sichtbarkeit der Karte.
  const vorTreffer = quelle.slice(quelle.indexOf('data-treffer="achse"') - 700, quelle.indexOf('data-treffer="achse"'));
  assert.match(vorTreffer, /\{kartenSichtbar > 0\.5 \? \(/);
  assert.doesNotMatch(vorTreffer, /\{regler &&/);
  // Fingertipp bleibt unverändert: mobil gibt es kein Überfahren.
  assert.match(quelle, /e\.pointerType !== "touch"/);
});

/**
 * Terpene per Klick (Nutzer 2026-10-03): die Stärkeregler sind zu komplex. Zieht man einen
 * Geschmack über Null, schaltet sich das eindeutig zuständige Terpen selbst an; tragen mehrere
 * die Richtung, wählt der Nutzer im nächsten Schritt.
 */
test("Terpen-Kandidaten einer Achse: keiner, genau einer, mehrere (Nutzer 2026-10-03)", () => {
  const erdig = achsenIndex("ERDIG");
  const myrcen: KartenTerpen = { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.9, rang: 1 };
  const limonen: KartenTerpen = { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: 0.4, rang: 2 };
  const humulen: KartenTerpen = { name: "Humulen", geschmack: "ERDIG", konzentrationProzent: 0.2, rang: 3 };

  // Keiner: die Achse trägt kein Terpen der Sorte. Nichts darf pulsieren.
  assert.deepEqual(terpenKandidaten(achsenIndex("SUESS"), [myrcen]), []);
  // Genau einer: eindeutig zuzuordnen, die Automatik darf schalten.
  assert.deepEqual(terpenKandidaten(erdig, [myrcen, limonen]), ["Myrcen"]);
  // Mehrere: der Nutzer wählt, nichts schaltet sich selbst.
  const mehrere = terpenKandidaten(erdig, [myrcen, limonen, humulen]);
  assert.deepEqual(new Set(mehrere), new Set(["Myrcen", "Humulen"]));
  // Geister zählen mit: genau sie soll man aktivieren können, deshalb filtert die Funktion
  // nicht nach Ebene (anders als leuchtendeTerpene).
  assert.deepEqual(terpenKandidaten(erdig, [myrcen]), ["Myrcen"]);
});

test("Terpen-Werte werden als an oder aus gelesen; alte Stufen gelten als an (Nutzer 2026-10-03)", () => {
  // Eine Bewertung von vor der Umstellung trägt Stufen bis 5. Jede Stufe über 0 heißt "an",
  // nie 3 von 5 (sonst zählte eine alte Bewertung dreifach gegen eine neue).
  assert.equal(terpenAnAus(3), 1);
  assert.equal(terpenAnAus(0), 0);
  // Der Mittelwert ist damit der Anteil der Bewertenden, die das Terpen aktiviert haben.
  const mittel = mittleTerpenIntensitaet([{ Myrcen: 3 }, { Myrcen: 0 }, { Myrcen: 1 }]);
  assert.equal(mittel.Myrcen.anzahl, 3);
  assert.equal(mittel.Myrcen.mittel, 0.7);
  // Auch der vorberechnete Median aus sorten_kennwerte wird so gelesen.
  const median = communityMedian({ terpenMedian: JSON.stringify({ Myrcen: 4, Limonen: 0 }), geschmackMedian: null, anzahl: 3 });
  assert.deepEqual(median?.terpene, { Myrcen: 1, Limonen: 0 });
});

test("Karte hat keine Terpen-Stärkeregler mehr, sondern Schalter (Nutzer 2026-10-03)", () => {
  const karte = quelleKarte();
  const raster = readFileSync(join(process.cwd(), "lib/regler-raster.ts"), "utf8");
  assert.doesNotMatch(karte, /terpenRegler/);
  assert.doesNotMatch(karte, /terpenSpur/);
  assert.doesNotMatch(raster, /TERPEN_STUFEN_MAX|terpenZeiger|terpenTaste/);
  // Der Name rechts in der Karte ist der Schalter.
  assert.match(karte, /aria-pressed=\{terpenSchalter \? an : undefined\}/);
  assert.match(karte, /onClick=\{terpenSchalter \? \(\) => terpenSchalter\.umschalten\(name\) : undefined\}/);
});

test("Erkundung schaltet das eindeutige Terpen selbst an, mehrere Kandidaten pulsieren (Nutzer 2026-10-03)", () => {
  const quelle = readFileSync(join(process.cwd(), "components/review/AromaErkundung.tsx"), "utf8");
  assert.match(quelle, /terpenKandidaten\(achse, kartenTerpene\)/);
  assert.match(quelle, /if \(offen\.length === 1\)/);
  assert.match(quelle, /setPulsierend\(new Set\(offen\)\)/);
  // Ein auf 0 zurückgezogener Geschmack schaltet kein Terpen ab.
  assert.match(quelle, /kein Nebeneffekt/);
});

test("Kandidaten pulsieren in Kopierstift-Violett, bei reduzierter Bewegung ruhig", () => {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  assert.match(css, /\.terpen-kandidat \{\s*color: var\(--color-kopierstift\);/);
  const erlaubt = [...css.matchAll(/@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/g)].map(([, block]) => block);
  assert.ok(erlaubt.some((block) => /\.terpen-kandidat \{[^}]*animation: terpen-kandidat/.test(block)));
  assert.match(css, /@keyframes terpen-kandidat/);
});
