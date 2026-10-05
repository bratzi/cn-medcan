import { test } from "node:test";
import assert from "node:assert/strict";

import {
  balkenVergleich,
  bogenSchicht,
  flussDauer,
  gezaehlteTerpene,
  herstellerKraft,
  linienBreite,
  streifen,
  type KartenTerpen,
} from "@/lib/aromakarte";

/**
 * Aroma-Karte v2 (T5b, Nutzer 2026-09-29): nur die eigene Bewertung bewegt
 * sich. Herstellerangaben liegen als stiller, blasser Streifen hinten; die
 * Linie der Bewertung erscheint erst mit einem Wert, dünn und langsam bei
 * wenig, dick und schnell bei viel. Balken grün bis zum Bezug, lila darüber.
 */

test("Linienbreite: ohne Wert keine Linie, 1,5 px bei 0,5 bis 6 px bei 5, Nebennoten feiner", () => {
  assert.equal(linienBreite(0), 0);
  assert.equal(linienBreite(0.05), 0);
  assert.equal(linienBreite(0.5), 1.5);
  assert.equal(linienBreite(5), 6);
  // Über 5 gibt es nicht; der Wert wird gedeckelt.
  assert.equal(linienBreite(7), 6);
  // Nebennote mit 20 % Anteil: 6 · (0,35 + 0,65 · 0,2).
  assert.equal(linienBreite(5, 0.2), 2.88);
  for (let wert = 0.5; wert < 5; wert += 0.5) {
    assert.ok(linienBreite(wert + 0.5) > linienBreite(wert), `monoton bei ${wert}`);
  }
});

test("Flussdauer: wenig Wert langsam (6 s), viel Wert schnell (1,2 s), dazwischen streng fallend", () => {
  assert.equal(flussDauer(0.5), 6);
  assert.equal(flussDauer(0.1), 6);
  assert.equal(flussDauer(5), 1.2);
  assert.equal(flussDauer(9), 1.2);
  for (let wert = 0.5; wert < 5; wert += 0.5) {
    assert.ok(flussDauer(wert + 0.5) < flussDauer(wert), `schneller bei ${wert + 0.5}`);
  }
});

test("Balkenton: grün auf oder unter dem Bezug, lila darüber, ohne Bezug lila ohne Vergleich", () => {
  assert.deepEqual(balkenVergleich(3, null), { ton: "lila", puls: null });
  assert.deepEqual(balkenVergleich(3, undefined), { ton: "lila", puls: null });
  // Gleichauf (|Δ| < 0,1): grün ohne Puls.
  assert.deepEqual(balkenVergleich(3, 3.05), { ton: "gruen", puls: null });
  assert.deepEqual(balkenVergleich(2.08, 2), { ton: "gruen", puls: null });
  // Darüber: der lila Überstand vom Bezug bis zum Balkenende pulsiert.
  assert.deepEqual(balkenVergleich(4, 2), { ton: "lila", puls: { art: "ueber", von: 2, bis: 4 } });
  // Darunter: das grüne Fehlstück vom Balkenende bis zum Bezug pulsiert.
  assert.deepEqual(balkenVergleich(1, 3), { ton: "gruen", puls: { art: "fehlt", von: 1, bis: 3 } });
  // Ohne eigenen Wert kein Balken und kein Fehlstück: die Karte zeigt nur Streifen.
  assert.deepEqual(balkenVergleich(0, 3), { ton: "gruen", puls: null });
});

test("Streifen: deutlich breiter und blasser als die Linie, nach Ausprägung der Herstellerangabe", () => {
  assert.deepEqual(streifen(1, 1), { breite: 14, deckkraft: 0.3 });
  assert.deepEqual(streifen(0, 1), { breite: 3, deckkraft: 0.12 });
  const neben = streifen(1, 0.2);
  assert.ok(neben.breite < 14 && neben.deckkraft < 0.3, "Nebennote schmaler und blasser");
  assert.ok(streifen(1, 1).breite > 2 * linienBreite(5), "Streifen hinter der dicksten Linie noch sichtbar");
});

test("Herstellerkraft: das stärkste angegebene Terpen ist 1, Konzentration schlägt Rang", () => {
  const T = (name: string, konzentrationProzent: number | null, rang: number): KartenTerpen => ({
    name,
    geschmack: "ERDIG",
    konzentrationProzent,
    rang,
  });
  assert.deepEqual(herstellerKraft([]), {});
  assert.deepEqual(herstellerKraft([T("Myrcen", 0.8, 1), T("Limonen", 0.4, 2)]), { Myrcen: 1, Limonen: 0.5 });
  const nachRang = herstellerKraft([T("A", null, 1), T("B", null, 2)]);
  assert.equal(nachRang.A, 1);
  assert.ok(Math.abs(nachRang.B - 2 / 3) < 1e-9);
});

test("Bogenschichten: Hersteller immer Streifen, Linie nur mit Wert; Geister nie eine Linie", () => {
  const ohne = { imBlick: true, imFokus: false };
  assert.deepEqual(bogenSchicht({ ebene: "hersteller", wert: 0, ...ohne }), { streifen: false, linie: false, geist: "blass" });
  assert.deepEqual(bogenSchicht({ ebene: "hersteller", wert: 2, ...ohne }), { streifen: false, linie: true, geist: null });
  // Andere Achse gewählt: die Linie tritt zurück, kein Herstellerstreifen (Nutzer 2026-09-30).
  assert.deepEqual(bogenSchicht({ ebene: "hersteller", wert: 2, imBlick: false, imFokus: false }), {
    streifen: false,
    linie: false,
    geist: "blass",
  });
  // Das Terpen selbst überfahren: seine Linien zeigen sich auf jeder Achse mit Wert.
  assert.equal(bogenSchicht({ ebene: "hersteller", wert: 2, imBlick: false, imFokus: true }).linie, true);
  assert.deepEqual(bogenSchicht({ ebene: "ergaenzt", wert: 2, ...ohne }), { streifen: false, linie: true, geist: null });
  assert.deepEqual(bogenSchicht({ ebene: "ergaenzt", wert: 0, ...ohne }), { streifen: false, linie: false, geist: "blass" });
  assert.deepEqual(bogenSchicht({ ebene: "geist", wert: 5, ...ohne }), { streifen: false, linie: false, geist: "blass" });
  assert.equal(bogenSchicht({ ebene: "geist", wert: 5, imBlick: true, imFokus: true }).geist, "fokus");
});

test("Gezählte Terpene: Herstellerterpen auf 0 zählt, ein ergänztes auf 0 ist nicht ergänzt", () => {
  assert.deepEqual(gezaehlteTerpene({ Myrcen: 0, Ocimen: 4, Terpinolen: 0 }, ["Myrcen"]), { Myrcen: 0, Ocimen: 4 });
  assert.deepEqual(gezaehlteTerpene({}, ["Myrcen"]), {});
});

// ---------------------------------------------------------------------------
//  Karte, Maske und Anzeige
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AromaErkundung } from "@/components/review/AromaErkundung";
import { AromaKarte, type AromaSerie, KarteSofortKontext } from "@/components/review/AromaKarte";

/** Karte sofort zeichnen: im Server-HTML steht sonst nur der Platzhalter (CPU-Limit, Fehler 1102). */
function mitKarte(element: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(createElement(KarteSofortKontext.Provider, { value: true }, element));
}
import { vorbelegungAus } from "@/lib/bewertung-vorbelegung";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";
import { leereGeschmacksMatrix, type GeschmacksMatrix } from "@/lib/query/bewertung";

const texte = aromaTexte(de, "de");
const LIMONEN: KartenTerpen = { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: null, rang: 1 };
const matrix = (werte: Partial<GeschmacksMatrix>): GeschmacksMatrix => ({ ...leereGeschmacksMatrix(), ...werte });
const gruen = (werte: Partial<GeschmacksMatrix>): AromaSerie => ({ name: "Laut Hersteller", ton: "gruen", matrix: matrix(werte) });
const lila = (werte: Partial<GeschmacksMatrix>): AromaSerie => ({ name: "Diese Bewertung", ton: "lila", matrix: matrix(werte) });

/** Alle Tags einer Schicht der Karte (data-schicht), in Reihenfolge. */
function schicht(html: string, name: string): string[] {
  return [...html.matchAll(new RegExp(`<[a-z]+[^>]*data-schicht="${name}"[^>]*>`, "g"))].map(([tag]) => tag);
}
/** Sichtbare Balken: Deckkraft über 0. */
const sichtbareBalken = (html: string) => schicht(html, "balken").filter((tag) => !/opacity="0"/.test(tag));

const karte = (serien: AromaSerie[]) =>
  mitKarte(createElement(AromaKarte, { terpene: [LIMONEN], serien, texte }));

test("Anzeige: keine Herstellerstreifen (Nutzer 2026-09-30), kein Puls, kein Filter; ohne lila Serie keine Linie", () => {
  const html = karte([gruen({ zitrus: 5 })]);
  assert.equal(schicht(html, "streifen").length, 0);
  assert.doesNotMatch(html, /bogen-puls/);
  assert.doesNotMatch(html, /filter:saturate/);
  assert.equal(schicht(html, "linie").length, 0);
  assert.doesNotMatch(html, /class="bogen-fluss"/);
  assert.doesNotMatch(html, /delta-puls/);
});

test("Anzeige: die lila Serie bekommt Linie und Fluss, im Sweet Spot dick, schnell und durchgehend", () => {
  const html = karte([gruen({ zitrus: 3 }), lila({ zitrus: 2.5 })]);
  const linie = schicht(html, "linie").find((tag) => /stroke="#f2d129"/.test(tag));
  assert.ok(linie, "gelbe Linie über dem Zitrus-Streifen");
  // Hauptnote von Limonen (75 % Zitrus) genau im Sweet Spot: so dick wie früher bei 5.
  assert.match(linie, new RegExp(`stroke-width:${linienBreite(5, 0.75)}[;"]`));
  // Im Sweet Spot läuft die Linie durchgehend und pulsiert, im schnellsten Tempo (Nutzer 2026-09-30).
  assert.match(html, /class="bogen-voll"[^>]*--fluss-dauer:1\.2s/);
  assert.doesNotMatch(html, /class="bogen-fluss"/);
});

test("Anzeige: „zu viel“ (5) wie „zu wenig“ dünn, langsam und mit kurzem Lichtstrich", () => {
  const html = karte([gruen({ zitrus: 3 }), lila({ zitrus: 5 })]);
  const linie = schicht(html, "linie").find((tag) => /stroke="#f2d129"/.test(tag));
  assert.ok(linie, "die Linie erscheint weiter, sobald ein Wert da ist");
  assert.match(linie, new RegExp(`stroke-width:${linienBreite(0.5, 0.75)}[;"]`));
  assert.match(html, /class="bogen-fluss"[^>]*--fluss-dauer:6s/);
  assert.doesNotMatch(html, /class="bogen-voll"/);
  // Zu wenig im gleichen Abstand zur Mitte zeichnet genauso wie zu viel.
  const wenig = karte([gruen({ zitrus: 3 }), lila({ zitrus: 1 })]);
  const viel = karte([gruen({ zitrus: 3 }), lila({ zitrus: 4 })]);
  const breiteVon = (html: string) => /stroke-width:([\d.]+)/.exec(schicht(html, "linie")[0] ?? "")?.[1];
  assert.equal(breiteVon(wenig), breiteVon(viel));
  assert.equal(/--fluss-dauer:([\d.]+s)/.exec(wenig)?.[1], /--fluss-dauer:([\d.]+s)/.exec(viel)?.[1]);
});

const REGLER_AUS = { aendern: () => {} };
const mitRegler = (werte: Partial<GeschmacksMatrix>, vergleich?: Partial<GeschmacksMatrix>) =>
  mitKarte(
    createElement(AromaKarte, {
      terpene: [LIMONEN],
      serien: [lila(werte)],
      texte,
      regler: { ...REGLER_AUS, werte: matrix(werte), vergleich: vergleich ? matrix(vergleich) : undefined },
    }),
  );
/** Die Funken der Karte (Kreise mit class="delta-funke"). */
const funken = (html: string) => [...html.matchAll(/<circle[^>]*class="delta-funke"[^>]*>/g)].map(([tag]) => tag);

test("Funken nur genau im Sweet Spot: Regler auf 2,5 sprüht grün am Griff, auf 3 nicht", () => {
  const mitte = funken(mitRegler({ zitrus: 2.5 }));
  assert.equal(mitte.length, 6);
  for (const tag of mitte) {
    assert.match(tag, /fill="var\(--color-accent\)"/);
    assert.match(tag, /r="1.75"/);
  }
  // Versetzt, damit die Funken nicht im Gleichschritt steigen.
  assert.equal(new Set(mitte.map((tag) => /animation-delay:([^;"]+)/.exec(tag)?.[1])).size > 1, true);
  assert.equal(funken(mitRegler({ zitrus: 3 })).length, 0);
  assert.equal(funken(mitRegler({ zitrus: 2.4 })).length, 0);
  // Zwei Achsen im Sweet Spot: je Achse sechs Funken.
  assert.equal(funken(mitRegler({ zitrus: 2.5, erdig: 2.5 })).length, 12);
});

test("Kein Funke mehr auf dem Überstand über dem Median, der pulsierende Überstand bleibt", () => {
  const html = mitRegler({ zitrus: 4 }, { zitrus: 2 });
  assert.match(html, /class="delta-puls"[^>]*data-delta="ueber"/);
  assert.equal(funken(html).length, 0);
  // Im Sweet Spot über dem Median: der Überstand pulsiert und die Funken sprühen.
  const beides = mitRegler({ zitrus: 2.5 }, { zitrus: 1 });
  assert.match(beides, /data-delta="ueber"/);
  assert.equal(funken(beides).length, 6);
  // Ohne Regler (Anzeige) keine Funken, auch im Sweet Spot.
  assert.equal(funken(karte([gruen({ zitrus: 3 }), lila({ zitrus: 2.5 })])).length, 0);
});

test("Skala: „zu viel“ links, „Sweet Spot“ in der Mitte, „zu wenig“ rechts statt der Zahlen 0 bis 5", () => {
  const html = karte([gruen({ zitrus: 3 }), lila({ zitrus: 2 })]);
  const wort = (text: string) => new RegExp(`<text[^>]*>${text}</text>`).exec(html)?.[0];
  const viel = wort(de.aroma.karte.sweetSkala.viel);
  const mitte = wort(de.aroma.karte.sweetSkala.mitte);
  const wenig = wort(de.aroma.karte.sweetSkala.wenig);
  assert.ok(viel && mitte && wenig, "drei Wörter über den Balken");
  // Die Balken wachsen nach links: 5 steht links. Anker so, dass nichts überlappt.
  assert.match(viel, /text-anchor="start"/);
  assert.match(mitte, /text-anchor="middle"/);
  assert.match(wenig, /text-anchor="end"/);
  const x = (tag: string) => Number(/ x="([\d.]+)"/.exec(tag)?.[1]);
  assert.ok(x(viel) < x(mitte) && x(mitte) < x(wenig), "zu viel links, zu wenig rechts");
  // Sweet Spot betont: halbfett und volle Deckkraft.
  assert.match(mitte, /font-weight="500"/);
  assert.doesNotMatch(mitte, /fill-opacity/);
  // Keine Zahlen mehr über den Balken; die gestrichelten Linien bei 0 bis 5 bleiben.
  assert.doesNotMatch(html, /<text[^>]*>[0-5]<\/text>/);
  assert.equal(html.match(/stroke-dasharray="2 4"/g)?.length, 6);
  // Die Linie bei 2,5 kommt dazu: durchgezogen in Blattgrün, halbe Deckkraft, genau unter dem Wort.
  const linie = /<line[^>]*data-skala="mitte"[^>]*>/.exec(html)?.[0];
  assert.ok(linie, "Linie bei 2,5");
  assert.match(linie, /stroke="var\(--color-accent\)"/);
  assert.match(linie, /stroke-opacity="0.5"/);
  assert.doesNotMatch(linie, /stroke-dasharray/);
  assert.equal(Number(/x1="([\d.]+)"/.exec(linie)?.[1]), x(mitte));
});

test("Regler: Titel der Skala, Spur im Sweet-Spot-Stil und Vorlesetext mit Zone", () => {
  const html = mitRegler({ zitrus: 1, fruchtig: 2.25, suess: 2.5, blumig: 2.75, kraeutrig: 3 });
  assert.match(html, new RegExp(`>${de.aroma.karte.sweetSkala.titel}<`));
  assert.doesNotMatch(html, /Terpen-Intensität/);
  // Spur symmetrisch: Rand grau, Mitte Blattgrün.
  const spur = /<linearGradient id="spur-[^"]*" x1="1" x2="0"[^>]*>([\s\S]*?)<\/linearGradient>/.exec(html)?.[1] ?? "";
  const stopps = [...spur.matchAll(/<stop offset="([^"]+)" stop-color="([^"]+)"/g)].map(([, offset, farbe]) => `${offset} ${farbe}`);
  assert.deepEqual(stopps, ["0% var(--color-border)", "50% var(--color-accent)", "100% var(--color-border)"]);
  const vorgelesen = [...html.matchAll(/aria-valuetext="([^"]*)"/g)].map(([, text]) => text);
  // Zone aus dem genauen Wert (2,25 und 2,75 zählen zur Mitte), die Zahl wie bisher auf eine Stelle.
  assert.equal(vorgelesen[0], "zu wenig, 1,0 von 5");
  assert.equal(vorgelesen[1], "Sweet Spot, 2,3 von 5");
  assert.equal(vorgelesen[2], "Sweet Spot, 2,5 von 5");
  assert.equal(vorgelesen[3], "Sweet Spot, 2,8 von 5");
  assert.equal(vorgelesen[4], "zu viel, 3,0 von 5");
});

test("Balken über dem Community-Median pulsiert im Überstand, darunter grün mit Fehlstück", () => {
  // Bezug ist seit 2026-10-03 immer der Community-Median (Nutzer): die Herstellerangabe ist
  // keine Serie der Karte mehr und zeichnet keinen Soll-Strich.
  const ueber = mitRegler({ zitrus: 4 }, { zitrus: 2 });
  const [balken] = sichtbareBalken(ueber);
  assert.match(balken, /stroke="var\(--color-kopierstift\)"/);
  assert.match(ueber, /class="delta-puls"[^>]*data-delta="ueber"/);
  assert.equal(sichtbareBalken(ueber).length, 1);

  const unter = mitRegler({ zitrus: 1 }, { zitrus: 4 });
  assert.match(sichtbareBalken(unter)[0], /stroke="var\(--color-accent\)"/);
  assert.match(unter, /data-delta="fehlt"/);

  const gleich = mitRegler({ zitrus: 3 }, { zitrus: 3 });
  assert.match(sichtbareBalken(gleich)[0], /stroke="var\(--color-accent\)"/);
  assert.doesNotMatch(gleich, /delta-puls/);
});

test("Ohne Community-Median färbt kein Balken ein und es gibt keinen Soll-Strich (Nutzer 2026-10-03)", () => {
  // Eine Sorte, die noch niemand bewertet hat: ohne Median gibt es keinen Bezug. Der Balken
  // bleibt dann ganz lila statt als "zu wenig" grün einzufärben.
  const ohne = karte([gruen({ zitrus: 2 }), lila({ zitrus: 4 })]);
  assert.equal(schicht(ohne, "soll").length, 0);
  assert.match(sichtbareBalken(ohne)[0], /stroke="var\(--color-kopierstift\)"/);
  assert.doesNotMatch(ohne, /data-delta="fehlt"/);
});

const TERPENE: KartenTerpen[] = [
  { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.8, rang: 1 },
  { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: 0.4, rang: 2 },
];
const MEDIAN = { geschmack: matrix({ erdig: 5, zitrus: 2 }), terpene: { Myrcen: 3 }, anzahl: 3 };
const COMMUNITY: AromaSerie = { name: de.aroma.serien.community, ton: "lila", matrix: matrix({ erdig: 5, zitrus: 2 }) };
const HERSTELLER: AromaSerie = { name: de.aroma.serien.hersteller, ton: "gruen", matrix: matrix({ erdig: 5, zitrus: 2.5 }) };

const VORBELEGUNG = vorbelegungAus({
  aussehen: 4,
  geruch: 4,
  geschmack: 4,
  wirkung: 3,
  konsistenz: 4,
  gesamtnote: 4,
  feuchtigkeitProzent: null,
  geschmacksMatrix: JSON.stringify(matrix({ zitrus: 3, erdig: 4 })),
  terpenIntensitaet: JSON.stringify({ Myrcen: 3 }),
  beschaffenheit: null,
  notiz: null,
  instagramReelUrl: null,
  charge: null,
  aktualisiertAm: new Date("2026-09-29T10:00:00.000Z"),
});

const maske = (props: Partial<Parameters<typeof AromaErkundung>[0]>) =>
  mitKarte(
    createElement(AromaErkundung, {
      titel: "Nebelharz 22 (fiktiv)",
      terpene: TERPENE,
      serien: [HERSTELLER, COMMUNITY],
      zeilen: [{ terpen: "Myrcen", wert: 3, anzahl: 3 }],
      median: MEDIAN,
      modus: "maske",
      texte,
      ...props,
    }),
  );

/** Die versteckten Geschmacksfelder der Maske. */
function geschmacksFelder(html: string): Record<string, string> {
  return Object.fromEntries(
    [...html.matchAll(/<input[^>]*name="geschmack-([a-z]+)"[^>]*value="([^"]*)"/g)].map(([, key, wert]) => [key, wert]),
  );
}

test("Maske ohne eigene Bewertung: alle Geschmacksregler auf 0, die Karte zeigt keine Linie", () => {
  const html = maske({});
  const felder = geschmacksFelder(html);
  assert.equal(Object.keys(felder).length, 10);
  for (const [key, wert] of Object.entries(felder)) assert.equal(wert, "0", key);
  assert.equal(schicht(html, "streifen").length, 0);
  assert.equal(schicht(html, "linie").length, 0);
  assert.doesNotMatch(html, /class="bogen-fluss"/);
  assert.doesNotMatch(html, /delta-puls/);
  assert.equal(sichtbareBalken(html).length, 0);
  // Kein grüner Herstellerbalken und keine Soll-Marke in der Maske: der Bezug ist der Ring.
  assert.equal(schicht(html, "soll").length, 0);
  assert.match(html, /<circle[^>]*r="11.5"[^>]*stroke="var\(--color-accent\)"/);
  // Kein „Dein Fazit“, solange nichts bewegt wurde.
  assert.doesNotMatch(html, new RegExp(`>${de.aroma.erkundung.deinFazit}<`));
});

test("Maske mit eigener Bewertung: gespeicherte Werte, Balken grün unter und lila über dem Median", () => {
  const html = maske({ vorbelegung: VORBELEGUNG });
  const felder = geschmacksFelder(html);
  assert.equal(felder.zitrus, "3");
  assert.equal(felder.erdig, "4");
  // Zitrus 3 über dem Median 2: lila, Überstand pulsiert. Erdig 4 unter 5: grün, Fehlstück pulsiert.
  const balken = sichtbareBalken(html);
  assert.equal(balken.length, 2);
  assert.ok(balken.some((tag) => /stroke="var\(--color-kopierstift\)"/.test(tag)));
  assert.ok(balken.some((tag) => /stroke="var\(--color-accent\)"/.test(tag)));
  assert.equal(html.match(/data-delta="ueber"/g)?.length, 1);
  assert.equal(html.match(/data-delta="fehlt"/g)?.length, 1);
  assert.ok(schicht(html, "linie").length > 0);
});

test("Maske ohne Community-Median: Balken lila, kein Vergleich, kein Puls, Hinweis statt Ring", () => {
  const html = maske({ vorbelegung: VORBELEGUNG, median: null, serien: [HERSTELLER] });
  assert.ok(sichtbareBalken(html).length > 0);
  for (const tag of sichtbareBalken(html)) assert.match(tag, /stroke="var\(--color-kopierstift\)"/);
  assert.doesNotMatch(html, /delta-puls/);
  assert.doesNotMatch(html, /r="11.5"/);
  assert.match(html, new RegExp(de.aroma.karte.keinMedian));
  assert.doesNotMatch(html, /NaN/);
});

test("Legende der Maske: Deine Bewertung und Community-Median, kein Herstellerstreifen", () => {
  const html = maske({});
  assert.match(html, new RegExp(`>${de.aroma.serien.bewertung}<`));
  assert.match(html, new RegExp(de.aroma.karte.median));
  assert.doesNotMatch(html, new RegExp(`>${de.aroma.karte.streifen}<`));
  // Die Community steht in der Maske als Ring, nicht als eigene Reihe.
  assert.doesNotMatch(html, new RegExp(de.aroma.serien.community));
});

test("Anzeige ohne Maske: keine Formularfelder, keine Herstellerserie, kein Soll-Strich", () => {
  const html = maske({ modus: "anzeige" });
  assert.equal(Object.keys(geschmacksFelder(html)).length, 0);
  assert.ok(schicht(html, "linie").length > 0);
  // Seit 2026-10-03 (Nutzer): die Herstellerangabe ist keine Serie der Karte mehr, weil der
  // Betreiber ihre Geschmacksintensität nicht kennt. Nur der Community-Median bleibt.
  assert.equal(schicht(html, "soll").length, 0);
  assert.doesNotMatch(html, new RegExp(`>${de.aroma.serien.hersteller}<`));
});

test("CSS: Fluss-Tempo per Variable, kein Puls der Bögen mehr, Sparmodus und reduzierte Bewegung stehen still", () => {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  assert.doesNotMatch(css, /bogen-puls/);
  assert.match(css, /animation:\s*bogen-fluss\s+var\(--fluss-dauer/);
  // Der Fluss läuft nur ohne reduzierte Bewegung; im Sparmodus verschwindet er ganz.
  const erlaubt = [...css.matchAll(/@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/g)].map(([, block]) => block);
  assert.ok(erlaubt.some((block) => /\.bogen-fluss\s*\{[^}]*animation:\s*bogen-fluss/.test(block)));
  assert.match(css, /:root\[data-sparmodus\] :is\(\.bogen-fluss, \.bogen-voll, \.delta-funke\)\s*\{[^}]*visibility:\s*hidden/);
  assert.ok(erlaubt.some((block) => /\.bogen-voll\s*\{[^}]*animation:\s*bogen-voll/.test(block)));
  assert.ok(erlaubt.some((block) => /\.delta-funke\s*\{[^}]*animation:\s*delta-funke/.test(block)));
  // Das Fehlstück steht ohne Bewegung blass, damit es nicht wie ein Balken aussieht.
  assert.match(css, /\.delta-puls\[data-delta="fehlt"\]\s*\{[^}]*--delta-ruhe/);
});
