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
import { HOEHE, kartenHoeheMitReglern, REIHE, type KartenTerpen } from "@/lib/aromakarte";
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

/** Das Terpen-fieldset der Karte (sr-only), erkannt an seiner Legende; ohne Regler null. */
function terpenFeld(html: string): string | null {
  const start = html.indexOf(`<legend>${de.aroma.karte.terpenLegende}</legend>`);
  return start < 0 ? null : html.slice(start, html.indexOf("</fieldset>", start));
}

const rangeRegler = (html: string) => [...html.matchAll(/<input[^>]*type="range"[^>]*>/g)].map(([tag]) => tag);

test("Maske: ergänzt folgt dem Regler, auf 0 zurückgezogen geht es nicht mit (T5d)", () => {
  const html = erkundung({ eingabe: true, vorbelegung: vorbelegung({ Myrcen: 0, Ocimen: 4, Terpinolen: 0 }) });
  const f = felder(html);
  // Herstellerterpen auf 0 heißt „nicht geschmeckt“ und zählt; ergänzt auf 0 heißt nicht ergänzt.
  assert.equal(f.get("terpen-Myrcen"), "0");
  assert.equal(f.get("terpen-Ocimen"), "4");
  assert.equal(f.has("terpen-Terpinolen"), false);
  // In der Karte: nur Ocimen (über 0) trägt den gestrichelten Knoten der Ergänzung, Terpinolen bleibt Geist.
  assert.equal(html.match(/<circle[^>]*stroke-dasharray="3 2.5"/g)?.length, 1);
  // Kein manueller Ergänzen-Schritt und kein Sweet Spot mehr bei den Terpenen.
  assert.doesNotMatch(html, /Weiteres Terpen geschmeckt\?/);
  assert.doesNotMatch(html, /Sweet Spot gesucht/);
});

test("Maske: je Terpen ein Regler 0 bis 5 im Terpen-fieldset der Karte, die eigene Box entfällt", () => {
  const html = erkundung({ eingabe: true, median: MEDIAN, vorbelegung: vorbelegung({ Myrcen: 2, Ocimen: 4 }) });
  const feld = terpenFeld(html);
  assert.ok(feld, "Terpen-fieldset in der Karte");
  const regler = rangeRegler(feld);
  assert.equal(regler.length, KATALOG.length);
  for (const tag of regler) {
    assert.match(tag, /min="0"/);
    assert.match(tag, /max="5"/);
    assert.match(tag, /step="1"/);
  }
  for (const { name } of KATALOG) assert.match(feld, new RegExp(`${name}: Intensität`));
  // Vorlesetext wie bisher: Stufenname und „x von 5“, mit Median dazu der Community-Median.
  assert.match(feld, /aria-valuetext="etwas schwach, 2 von 5 · Community-Median 3"/);
  assert.match(feld, /aria-valuetext="nicht geschmeckt, 0 von 5 · Community-Median 3"/);
  assert.match(feld, /aria-valuetext="etwas stark, 4 von 5"/);
  assert.match(feld, /aria-valuetext="nicht geschmeckt, 0 von 5"/);
  // Keine Box mehr unter der Karte.
  assert.doesNotMatch(html, /Je Terpen/);
  assert.doesNotMatch(html, /Weitere Terpene/);
  // Der Hinweis unter der Karte nennt die rechte Seite.
  assert.ok(html.includes(de.aroma.karte.hinweisRegler));
  assert.ok(html.includes(de.aroma.karte.hinweisTerpenRegler));
});

test("Anzeige ohne Maske: keine Terpen-Regler in der Karte, der Hinweis nennt nur die linke Seite", () => {
  const html = erkundung({ median: MEDIAN });
  assert.equal(terpenFeld(html), null);
  assert.doesNotMatch(html, /data-terpen-griff/);
  assert.ok(html.includes(de.aroma.karte.hinweisRegler));
  assert.ok(!html.includes(de.aroma.karte.hinweisTerpenRegler));
  assert.equal(terpenFeld(karte({})), null);
});

test("Karten-Regler rechts: Griff je Terpen, lila Füllung bis zum Wert, grüner Ring am Median, bei 0 blass", () => {
  const html = karte({
    terpene: [LIMONEN, TERPINOLEN],
    ebenen: { Limonen: "hersteller", Terpinolen: "geist" },
    terpenRegler: { werte: { Limonen: 4 }, median: { Limonen: 2.5 }, aendern: () => {} },
  });
  // Je Terpen ein Griff; Begleitstoffe (Ester, Thiole) bekommen keinen Regler.
  assert.equal(html.match(/data-terpen-griff=/g)?.length, 2);
  assert.doesNotMatch(html, /data-terpen-griff="(Ester|Thiole)"/);
  assert.match(html, /<circle data-terpen-griff="Limonen"[^>]*r="7"[^>]*fill="var\(--color-kopierstift\)"[^>]*opacity="1"/);
  // Auf 0 bleibt der Griff am Knoten sichtbar, nur blasser.
  assert.match(html, /<circle data-terpen-griff="Terpinolen"[^>]*opacity="0.6"/);
  // Lila Füllung nur, wo ein Wert steht; der grüne Ring nur, wo es einen Median gibt.
  assert.equal(html.match(/data-terpen-fuellung=/g)?.length, 1);
  assert.equal(html.match(/<circle[^>]*r="9"[^>]*stroke="var\(--color-accent\)"/g)?.length, 1);
  assert.match(terpenFeld(html) ?? "", /aria-valuetext="etwas stark, 4 von 5 · Community-Median 2,5"/);
});

test("Karten-Regler: die Karte wächst mit der Terpenspalte, die Geschmacksachsen stehen mittig darin", () => {
  const viele: KartenTerpen[] = Array.from({ length: 12 }, (_, i) => ({
    name: `Terpen ${i + 1}`,
    geschmack: "ERDIG",
    konzentrationProzent: null,
    rang: 99,
  }));
  // Zwölf Terpene und die zwei Begleitstoffe.
  const hoehe = kartenHoeheMitReglern(12 + 2, HOEHE);
  assert.equal(hoehe, 668);
  const mit = karte({ terpene: viele, terpenRegler: { werte: {}, aendern: () => {} } });
  assert.match(mit, new RegExp(`viewBox="0 0 640 ${hoehe}"`));
  // Die Achsen behalten ihren Abstand und rücken um die halbe Mehrhöhe nach unten; die Skala
  // (Linie bei 2,5 ab 30 über der ersten Achse) wandert mit.
  const mitte = (html: string) => Number(/<line[^>]*data-skala="mitte"[^>]*y1="([\d.]+)"/.exec(html)?.[1]);
  assert.equal(mitte(mit), 48 + (hoehe - HOEHE) / 2 - 30);
  const ohne = karte({ terpene: viele });
  assert.match(ohne, new RegExp(`viewBox="0 0 640 ${HOEHE}"`));
  assert.equal(mitte(ohne), 48 - 30);
});

// ---------------------------------------------------------------------------
//  Terpen-Regler in der Karte (Nutzer 2026-09-30: keine eigene Box, ein Regler je Terpen)
// ---------------------------------------------------------------------------

test("Kartenhöhe mit Terpen-Reglern: 44 je Zeile, nie niedriger als die normale Karte", () => {
  assert.equal(REIHE, 44);
  // Wenige Einträge: die normale Höhe reicht.
  assert.equal(kartenHoeheMitReglern(3, HOEHE), HOEHE);
  assert.equal(kartenHoeheMitReglern(0, HOEHE), HOEHE);
  // Viele Einträge: Rand oben und unten plus 44 je Abstand.
  assert.equal(kartenHoeheMitReglern(30, HOEHE), 48 + 48 + 29 * 44);
  assert.equal(kartenHoeheMitReglern(30, HOEHE), 1372);
});

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

test("Infotafel überlagert bei jeder Breite und hält keine Höhe frei (Nutzer 2026-10-03)", () => {
  const quelle = quelleKarte();
  assert.doesNotMatch(quelle, /min-h-80/);
  assert.doesNotMatch(quelle, /sm:min-h-56/);
  assert.match(quelle, /"pointer-events-none absolute inset-x-0 bottom-0 z-10 grid justify-items-center"/);
  // Langer Text scrollt in der Tafel, statt die Sektion zu dehnen.
  assert.match(quelle, /\*:max-h-64 \*:overflow-y-auto/);
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
