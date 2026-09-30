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
  assert.deepEqual(bogenSchicht({ ebene: "hersteller", wert: 0, ...ohne }), { streifen: true, linie: false, geist: null });
  assert.deepEqual(bogenSchicht({ ebene: "hersteller", wert: 2, ...ohne }), { streifen: true, linie: true, geist: null });
  // Andere Achse gewählt: die Linie tritt zurück, der Streifen bleibt.
  assert.deepEqual(bogenSchicht({ ebene: "hersteller", wert: 2, imBlick: false, imFokus: false }), {
    streifen: true,
    linie: false,
    geist: null,
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
import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
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
  renderToStaticMarkup(createElement(AromaKarte, { terpene: [LIMONEN], serien, texte }));

test("Anzeige: Herstellerangabe als stiller Streifen, kein Puls, kein Filter; ohne lila Serie keine Linie", () => {
  const html = karte([gruen({ zitrus: 5 })]);
  const streifenTags = schicht(html, "streifen");
  assert.ok(streifenTags.length > 0, "Streifen je Bogen");
  // Geschmacksfarbe (Zitrus gelb), blass: Deckkraft höchstens 0,3.
  assert.ok(streifenTags.some((tag) => /stroke="#f2d129"/.test(tag)));
  for (const tag of streifenTags) assert.ok(Number(/opacity="([\d.]+)"/.exec(tag)?.[1]) <= 0.3, tag);
  assert.doesNotMatch(html, /bogen-puls/);
  assert.doesNotMatch(html, /filter:saturate/);
  assert.equal(schicht(html, "linie").length, 0);
  assert.doesNotMatch(html, /class="bogen-fluss"/);
  assert.doesNotMatch(html, /delta-puls/);
});

test("Anzeige: die lila Serie bekommt Linie und Fluss, viel Wert dick und schnell", () => {
  const html = karte([gruen({ zitrus: 3 }), lila({ zitrus: 5 })]);
  const linie = schicht(html, "linie").find((tag) => /stroke="#f2d129"/.test(tag));
  assert.ok(linie, "gelbe Linie über dem Zitrus-Streifen");
  // Hauptnote von Limonen (75 % Zitrus) bei 5.
  assert.match(linie, new RegExp(`stroke-width:${linienBreite(5, 0.75)}[;"]`));
  // Am Maximum läuft die Linie durchgehend und pulsiert (T5d), im Tempo des höchsten Werts.
  assert.match(html, /class="bogen-voll"[^>]*--fluss-dauer:1\.2s/);
});

test("Anzeige: Balken lila über der grünen Serie mit pulsierendem Überstand, darunter grün mit Fehlstück", () => {
  const ueber = karte([gruen({ zitrus: 2 }), lila({ zitrus: 4 })]);
  const [balken] = sichtbareBalken(ueber);
  assert.match(balken, /stroke="var\(--color-kopierstift\)"/);
  assert.match(ueber, /class="delta-puls"[^>]*data-delta="ueber"/);
  // Die grüne Serie ist der Bezug: eine grüne Soll-Marke statt eines eigenen Balkens.
  assert.equal(sichtbareBalken(ueber).length, 1);
  assert.ok(schicht(ueber, "soll").some((tag) => /stroke="var\(--color-accent\)"/.test(tag)));

  const unter = karte([gruen({ zitrus: 4 }), lila({ zitrus: 1 })]);
  assert.match(sichtbareBalken(unter)[0], /stroke="var\(--color-accent\)"/);
  assert.match(unter, /data-delta="fehlt"/);

  const gleich = karte([gruen({ zitrus: 3 }), lila({ zitrus: 3 })]);
  assert.match(sichtbareBalken(gleich)[0], /stroke="var\(--color-accent\)"/);
  assert.doesNotMatch(gleich, /delta-puls/);
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
  renderToStaticMarkup(
    createElement(AromaErkundung, {
      titel: "Nebelharz 22 (fiktiv)",
      terpene: TERPENE,
      serien: [HERSTELLER, COMMUNITY],
      zeilen: [{ terpen: "Myrcen", wert: 3, anzahl: 3 }],
      median: MEDIAN,
      eingabe: true,
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

test("Maske ohne eigene Bewertung: alle Geschmacksregler auf 0, die Karte zeigt nur Streifen", () => {
  const html = maske({});
  const felder = geschmacksFelder(html);
  assert.equal(Object.keys(felder).length, 10);
  for (const [key, wert] of Object.entries(felder)) assert.equal(wert, "0", key);
  assert.ok(schicht(html, "streifen").length > 0);
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

test("Legende der Maske: Deine Bewertung, Community-Median und der Streifen der Herstellerangabe", () => {
  const html = maske({});
  assert.match(html, new RegExp(`>${de.aroma.serien.bewertung}<`));
  assert.match(html, new RegExp(de.aroma.karte.median));
  assert.match(html, new RegExp(`>${de.aroma.karte.streifen}<`));
  // Die Community steht in der Maske als Ring, nicht als eigene Reihe.
  assert.doesNotMatch(html, new RegExp(de.aroma.serien.community));
});

test("Anzeige ohne Maske: Regler starten beim Community-Wert, Bezug ist die grüne Serie", () => {
  const html = maske({ eingabe: false });
  assert.equal(Object.keys(geschmacksFelder(html)).length, 0);
  assert.ok(schicht(html, "soll").length > 0);
  assert.ok(schicht(html, "linie").length > 0);
  assert.match(html, new RegExp(`>${de.aroma.serien.hersteller}<`));
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
