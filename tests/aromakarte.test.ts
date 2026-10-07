import { test } from "node:test";
import assert from "node:assert/strict";

import {
  abweichungsAnteil,
  achsenImKarte,
  achsenIndex,
  ordneTerpene,
  terpenBoegen,
  balkenLaenge,
  bogen,
  herstellerProfil,
  mische,
  mitteVon,
  netzPunkt,
  sanft,
  terpeneImKarte,
  MITTE,
  RADIUS,
  radiusVon,
} from "@/lib/aromakarte";

test("Herstellerprofil: dominantes Terpen setzt seine Achse auf 5, ohne Terpene null", () => {
  assert.equal(herstellerProfil([]), null);
  const profil = herstellerProfil([
    { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: null, rang: 1 },
    { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: null, rang: 2 },
  ]);
  assert.ok(profil);
  // Anteilig nach lib/terpen-aromen.ts: Limonen (Gewicht 3) 75 % Zitrus, 15 % Fruchtig, 10 % Süß;
  // Myrcen (Gewicht 2) 50 % Erdig, 30 % Fruchtig, 20 % Kräutrig. Höchste Achse Zitrus 2,25 = 5.
  assert.equal(profil.zitrus, 5);
  assert.equal(profil.erdig, 2.2);
  assert.equal(profil.fruchtig, 2.3);
  assert.equal(profil.suess, 0.7);
  assert.equal(profil.blumig, 0);
  assert.equal(profil.diesel, 0);
});

test("Terpenbögen: mehrere Noten je Terpen, unbekannte Terpene nur mit Hauptnote, Diesel nie aus Terpenen", () => {
  const myrcen = terpenBoegen({ name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: null, rang: 1 });
  assert.equal(myrcen.length, 3);
  assert.equal(Math.round(myrcen.reduce((a, b) => a + b.anteil, 0) * 100), 100);
  assert.deepEqual(terpenBoegen({ name: "Unbekannt", geschmack: "HOLZIG", konzentrationProzent: null, rang: 1 }), [
    { achse: achsenIndex("HOLZIG"), anteil: 1 },
  ]);
  for (const name of ["Myrcen", "Limonen", "beta-Caryophyllen", "Linalool", "alpha-Pinen", "Terpinolen", "Humulen", "Ocimen", "Farnesen", "Nerolidol"]) {
    const boegen = terpenBoegen({ name, geschmack: "ERDIG", konzentrationProzent: null, rang: 1 });
    assert.ok(boegen.every((b) => b.achse !== achsenIndex("DIESEL")), name);
  }
});

test("Ordnung der Terpene folgt dem Mittel ihrer Achsen (wenig Kreuzungen)", () => {
  const t = (name: string) => ({ name, geschmack: "ERDIG" as const, konzentrationProzent: null, rang: 1 });
  const namen = ordneTerpene([t("beta-Caryophyllen"), t("Limonen"), t("alpha-Pinen"), t("Linalool")]).map((x) => x.name);
  assert.deepEqual(namen, ["Limonen", "Linalool", "alpha-Pinen", "beta-Caryophyllen"]);
});

test("Konzentration schlägt Rang", () => {
  const profil = herstellerProfil([
    { name: "A", geschmack: "ZITRUS", konzentrationProzent: 0.2, rang: 1 },
    { name: "B", geschmack: "HOLZIG", konzentrationProzent: 0.8, rang: 2 },
  ]);
  assert.equal(profil?.holzig, 5);
  assert.equal(profil?.zitrus, 1.3);
});

test("Geometrie: zehn Achsen links, Netz beginnt oben, Morph interpoliert", () => {
  assert.equal(achsenImKarte().length, 10);
  assert.deepEqual(netzPunkt(0, 5), { x: MITTE.x, y: MITTE.y - RADIUS });
  assert.deepEqual(netzPunkt(0, 0), MITTE);
  assert.deepEqual(mische({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5), { x: 5, y: 10 });
  assert.equal(sanft(0), 0);
  assert.equal(sanft(1), 1);
  assert.match(bogen({ x: 0, y: 0 }, { x: 100, y: 50 }), /^M0,0 C50,0 50,50 100,50$/);
});

test("Geometrie: Achse wandert mit halber Mehrbreite (Skala links, Terpenlinien rechts), Terpene am rechten Rand", () => {
  // Standardaufrufe (ohne breite) bleiben wie vorher: Maßstab bei 640.
  assert.equal(achsenImKarte()[0].x, 260);
  assert.equal(terpeneImKarte(3)[0].x, 490);

  // Balken ab dem linken Rand: bei 640 Achse 260 (Balken 230), bei 1200 bei 260 + 280 = 540 (Balken 510).
  assert.equal(balkenLaenge(), 230);
  assert.equal(balkenLaenge(1200), 510);
  const achsenBreit = achsenImKarte(1200);
  assert.equal(achsenBreit[0].x, 540);
  const terpeneBreit = terpeneImKarte(3, 1200);
  assert.equal(terpeneBreit[0].x, 1050);
});

test("Das Netz bleibt bei jeder Breite gleich groß (RADIUS) und zentriert (mitteVon)", () => {
  assert.deepEqual(mitteVon(), MITTE);
  const mitteBreit = mitteVon(1200);
  assert.deepEqual(mitteBreit, { x: 600, y: 240 });
  // Radius bleibt 180, egal wie breit die Karte ist; nur der Mittelpunkt wandert.
  assert.deepEqual(netzPunkt(0, 5, RADIUS, mitteBreit), { x: mitteBreit.x, y: mitteBreit.y - RADIUS });
  assert.deepEqual(netzPunkt(0, 0, RADIUS, mitteBreit), mitteBreit);
  // Ohne mitte-Argument unverändert (Standard bleibt 640).
  assert.deepEqual(netzPunkt(0, 5), { x: MITTE.x, y: MITTE.y - RADIUS });
});

import { mittleTerpenIntensitaet, parseTerpenIntensitaet } from "@/lib/query/bewertung";

test("Terpen-Intensität: kaputt oder leer wird {}, Werte außerhalb 1-5 fallen durch, Anteil je Terpen", () => {
  assert.deepEqual(parseTerpenIntensitaet(null), {});
  assert.deepEqual(parseTerpenIntensitaet("kaputt"), {});
  assert.deepEqual(parseTerpenIntensitaet('{"Myrcen":7}'), {});
  assert.deepEqual(parseTerpenIntensitaet('{"Myrcen":3}'), { Myrcen: 3 });
  // Terpene sind seit 2026-10-03 an oder aus (Nutzer): das Mittel ist der Anteil der
  // Bewertenden, die das Terpen aktiviert haben. Alte Stufen zählen dabei als an.
  assert.deepEqual(mittleTerpenIntensitaet([{ Myrcen: 3 }, { Myrcen: 4, Limonen: 0 }]), {
    Myrcen: { mittel: 1, anzahl: 2 },
    Limonen: { mittel: 0, anzahl: 1 },
  });
});

test("Abweichungsfarbe: lila hoeher wird violetter, Hersteller hoeher gruener, ohne Werte oder gleich null", () => {
  assert.equal(abweichungsAnteil(undefined, 3), null);
  assert.equal(abweichungsAnteil(3, undefined), null);
  assert.equal(abweichungsAnteil(2.5, 2.5), null);
  // Anteil Violett in Prozent, 50 = Mitte; Stärke |Differenz| / 5, um die Hälfte verstärkt, gedeckelt.
  assert.equal(abweichungsAnteil(4, 2), 80);
  assert.equal(abweichungsAnteil(2, 4), 20);
  assert.equal(abweichungsAnteil(5, 0), 100);
  assert.equal(abweichungsAnteil(0, 5), 0);
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AromaKarte, naechsteAnsicht, KarteSofortKontext } from "@/components/review/AromaKarte";

/** Karte sofort zeichnen: im Server-HTML steht sonst nur der Platzhalter (CPU-Limit, Fehler 1102). */
function mitKarte(element: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(createElement(KarteSofortKontext.Provider, { value: true }, element));
}
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";
import { leereGeschmacksMatrix } from "@/lib/query/bewertung";

const LIMONEN = { name: "Limonen", geschmack: "ZITRUS" as const, konzentrationProzent: null, rang: 1 };
const karte = () =>
  mitKarte(
    createElement(AromaKarte, {
      terpene: [LIMONEN],
      serien: [{ name: "Laut Hersteller", ton: "gruen", matrix: { ...leereGeschmacksMatrix(), zitrus: 5 } }],
      texte: aromaTexte(de, "de"),
    }),
  );

test("Server-HTML: Karte nur als Platzhalter fester Höhe, Tabelle für Screenreader bleibt (CPU-Limit, Fehler 1102)", () => {
  const html = renderToStaticMarkup(
    createElement(AromaKarte, {
      terpene: [LIMONEN],
      serien: [{ name: "Laut Hersteller", ton: "gruen", matrix: { ...leereGeschmacksMatrix(), zitrus: 5 } }],
      texte: aromaTexte(de, "de"),
    }),
  );
  // Leeres SVG mit viewBox hält die Höhe, ohne Bögen, Balken und Beschriftungen.
  assert.match(html, /<svg viewBox="0 0 \d+ \d+" aria-hidden="true" class="[^"]*w-full[^"]*"><\/svg>/);
  assert.doesNotMatch(html, /<path|<circle|<text/);
  assert.match(html, /<div class="sr-only"><table>/);
  // Mit sofort gezeichneter Karte steht das volle SVG da.
  assert.match(karte(), /<svg viewBox[^>]*>.*<path/s);
});

test("Ansichts-Schalter ist eine Radiogroup mit einem Tabstopp und Druck-Rückmeldung", () => {
  const html = karte();
  assert.match(html, /role="radiogroup" aria-label="Ansicht"/);
  assert.doesNotMatch(html, /aria-pressed/);
  assert.match(html, /role="radio" aria-checked="true" tabindex="0"[^>]*>Karte</);
  assert.match(html, /role="radio" aria-checked="false" tabindex="-1"[^>]*>Netz</);
  // Druck nur ohne reduzierte Bewegung (Tailwind v4: scale ist eine eigene Eigenschaft).
  assert.match(html, /motion-safe:active:scale-\[0\.97\]/);
  assert.match(html, /transition-\[color,background-color,scale\]/);
});

test("Pfeiltasten im Ansichts-Schalter laufen um, Pos1/Ende springen an den Rand", () => {
  assert.equal(naechsteAnsicht("ArrowRight", 0), 1);
  assert.equal(naechsteAnsicht("ArrowDown", 1), 0);
  assert.equal(naechsteAnsicht("ArrowLeft", 0), 1);
  assert.equal(naechsteAnsicht("ArrowUp", 1), 0);
  assert.equal(naechsteAnsicht("Home", 1), 0);
  assert.equal(naechsteAnsicht("End", 0), 1);
  assert.equal(naechsteAnsicht("Enter", 0), null);
  assert.equal(naechsteAnsicht("Tab", 1), null);
});

test("T5b: Herstellerangabe allein bleibt still, ohne Filter, Puls und Lichtpunkt", () => {
  const html = karte();
  assert.doesNotMatch(html, /filter:saturate/);
  assert.doesNotMatch(html, /bogen-puls/);
  assert.doesNotMatch(html, /class="bogen-fluss"/);
});

test("Regler: Tastaturfokus zeichnet einen eigenen Ring im Fokus-Token, nur bei :focus-visible", () => {
  const quelle = readFileSync(join(process.cwd(), "components/review/AromaKarte.tsx"), "utf8");
  assert.match(quelle, /setTastatur\(e\.currentTarget\.matches\(":focus-visible"\) \? index : null\)/);
  assert.match(quelle, /r=\{16\}\s+fill="none"\s+stroke="var\(--color-focus-ring\)"\s+strokeWidth=\{2\}/);
  assert.match(quelle, /vectorEffect="non-scaling-stroke"/);
});

test("Schmale Karte (Handy): Achse bei 42 %, Terpene 124 vor dem Rand, Netz kleiner; ab 640 unverändert", () => {
  assert.equal(achsenImKarte(358)[0].x, 150.4);
  assert.equal(balkenLaenge(358), 120.4);
  assert.equal(terpeneImKarte(3, 358)[0].x, 234);
  assert.equal(radiusVon(358), 99);
  assert.equal(radiusVon(640), RADIUS);
  assert.equal(radiusVon(1200), RADIUS);
  assert.equal(achsenImKarte(640)[0].x, 260);
});

// ---------------------------------------------------------------------------
//  Masterplan Bewertung v2, T5: drei Ebenen, Community-Median, Abweichung
// ---------------------------------------------------------------------------

import {
  communityMedian,
  ebenenStaerken,
  leuchtendeTerpene,
  nasenAbweichung,
  terpenEbenen,
  type KartenTerpen,
} from "@/lib/aromakarte";

const T = (name: string, geschmack: KartenTerpen["geschmack"], konzentrationProzent: number | null, rang: number): KartenTerpen => ({
  name,
  geschmack,
  konzentrationProzent,
  rang,
});
const MYRCEN = T("Myrcen", "ERDIG", 0.8, 1);
const LIMO = T("Limonen", "ZITRUS", 0.4, 2);
// Aus dem Katalog, laut Hersteller nicht enthalten (hinterster Rang wie ergaenztesTerpen).
const TERPINOLEN = T("Terpinolen", "KRAEUTRIG", null, 99);
const OCIMEN = T("Ocimen", "SUESS", null, 99);

test("Ebenen: Herstellerangabe, vom Nutzer im Sweet Spot gesetzt (Stufe > 0), sonst Geist", () => {
  const ebenen = terpenEbenen(["Myrcen", "Limonen", "Terpinolen", "Ocimen", "Linalool"], ["Myrcen", "Limonen"], {
    Myrcen: 0,
    Terpinolen: 3,
    Ocimen: 0,
  });
  assert.deepEqual(ebenen, {
    Myrcen: "hersteller",
    Limonen: "hersteller",
    Terpinolen: "ergaenzt",
    Ocimen: "geist",
    Linalool: "geist",
  });
});

test("Stärken: ein Geschmack allein zündet kein Terpen, Katalogterpene verwässern die Angabe nicht", () => {
  const ebenen = terpenEbenen(["Myrcen", "Limonen", "Terpinolen", "Ocimen"], ["Myrcen", "Limonen"], { Terpinolen: 5 });
  const staerken = ebenenStaerken([MYRCEN, LIMO, TERPINOLEN, OCIMEN], ebenen, { Terpinolen: 5 });
  // Hersteller wie terpenStaerken, nur über die Herstellerterpene: 0,8 / (0,8 · 5/3) = 0,6.
  assert.equal(staerken.Myrcen, 0.6);
  assert.equal(staerken.Limonen, 0.3);
  // Ergänzt nach der eigenen Stufe, höchstens 0,6: Stufe 5 ergibt 0,6.
  assert.equal(staerken.Terpinolen, 0.6);
  assert.equal(staerken.Ocimen, 0);
  const sweetSpot = ebenenStaerken([MYRCEN, TERPINOLEN], terpenEbenen(["Myrcen", "Terpinolen"], ["Myrcen"], { Terpinolen: 3 }), {
    Terpinolen: 3,
  });
  assert.ok(Math.abs(sweetSpot.Terpinolen - 0.36) < 1e-9);
});

test("Gewählte Geschmacksrichtung: nur die Schnittmenge mit Ebene 1 und 2 leuchtet", () => {
  const zitrus = achsenIndex("ZITRUS");
  const terpene = [MYRCEN, LIMO, TERPINOLEN];
  // Terpinolen trägt Zitrus (20 %), ist laut Hersteller aber nicht enthalten: Geist.
  assert.deepEqual(leuchtendeTerpene(zitrus, terpene, terpenEbenen(["Myrcen", "Limonen", "Terpinolen"], ["Myrcen", "Limonen"], {})), [
    "Limonen",
  ]);
  // Setzt der Nutzer es selbst im Sweet Spot, gehört es dazu.
  assert.deepEqual(
    leuchtendeTerpene(zitrus, terpene, terpenEbenen(["Myrcen", "Limonen", "Terpinolen"], ["Myrcen", "Limonen"], { Terpinolen: 2 })),
    ["Limonen", "Terpinolen"],
  );
});

const MATRIX = { zitrus: 2.5, fruchtig: 1, suess: 0, blumig: 0, kraeutrig: 1.5, minzig: 0, holzig: 0, wuerzig: 0.5, erdig: 4, diesel: 0 };

test("Community-Median aus sorten_kennwerte: ohne Zeile oder ohne Bewertung null, kaputte Werte fallen weg", () => {
  assert.equal(communityMedian(null), null);
  assert.equal(communityMedian(undefined), null);
  assert.equal(communityMedian({ terpenMedian: "{}", geschmackMedian: "{}", anzahl: 0 }), null);
  // Terpene sind seit 2026-10-03 an oder aus (Nutzer): ein vorberechneter Median aus der Zeit
  // der Stärkeregler trägt noch Stufen bis 5, jede Stufe über 0 heißt "an".
  assert.deepEqual(
    communityMedian({ terpenMedian: '{"Myrcen":2.5,"Limonen":4}', geschmackMedian: JSON.stringify(MATRIX), anzahl: 3 }),
    { geschmack: MATRIX, terpene: { Myrcen: 1, Limonen: 1 }, anzahl: 3 },
  );
  assert.deepEqual(
    communityMedian({ terpenMedian: '{"Myrcen":7,"Limonen":"x","Linalool":3}', geschmackMedian: "kaputt", anzahl: 2 }),
    { geschmack: null, terpene: { Linalool: 1 }, anzahl: 2 },
  );
  // Nichts Brauchbares: wie kein Median (Review Focus 1, nie 0 oder NaN).
  assert.equal(communityMedian({ terpenMedian: "{}", geschmackMedian: "{}", anzahl: 2 }), null);
});

test("Deine Nase vs. Community: mittlere |Δ| zum Median und ergänzte Terpene mit Stufe > 0", () => {
  const median = { Myrcen: 3, Limonen: 3, Linalool: 2 };
  assert.equal(nasenAbweichung({ Myrcen: 4 }, null, ["Myrcen"]), null);
  assert.equal(nasenAbweichung({}, median, ["Myrcen"]), null);
  // Keine Überschneidung mit dem Median: nichts zu vergleichen.
  assert.equal(nasenAbweichung({ Ocimen: 3 }, median, ["Myrcen"]), null);
  assert.deepEqual(nasenAbweichung({ Myrcen: 4, Limonen: 2, Linalool: 3, Ocimen: 0 }, median, ["Myrcen", "Limonen"]), {
    delta: 1,
    ergaenzt: 1,
  });
  // Genau getroffen ist ein echter Wert, kein fehlender.
  assert.deepEqual(nasenAbweichung({ Myrcen: 3 }, median, ["Myrcen"]), { delta: 0, ergaenzt: 0 });
});

import { erkundungsDaten } from "@/components/review/erkundung-daten";

const BEWERTUNG = (geschmack: Record<string, number>, terpene: Record<string, number>) => ({
  aussehen: 3,
  geruch: 3,
  geschmack: 3,
  konsistenz: 3,
  feuchtigkeitProzent: null,
  geschmacksMatrix: JSON.stringify(geschmack),
  terpenIntensitaet: JSON.stringify(terpene),
  beschaffenheit: null,
});
const NAMEN = { hersteller: "Laut Hersteller", community: "Laut Community" };

test("Erkundungsdaten: der Community-Median aus sorten_kennwerte trägt Reihe, Sweet-Spot-Zeilen und grünen Regler", () => {
  const reviews = [
    BEWERTUNG({ ...MATRIX, erdig: 1 }, { Myrcen: 1 }),
    BEWERTUNG({ ...MATRIX, erdig: 2 }, { Myrcen: 2 }),
    BEWERTUNG({ ...MATRIX, erdig: 5 }, { Myrcen: 5 }),
  ];
  const kennwerte = {
    terpenMedian: '{"Myrcen":2}',
    geschmackMedian: JSON.stringify({ ...MATRIX, erdig: 2 }),
    gesamtnoteMedian: 4,
    anzahl: 3,
  };
  const daten = erkundungsDaten([MYRCEN], reviews, NAMEN, kennwerte);
  // Terpene sind seit 2026-10-03 an oder aus (Nutzer): der gespeicherte Median 2 heißt "an".
  assert.deepEqual(daten.median, { geschmack: { ...MATRIX, erdig: 2 }, terpene: { Myrcen: 1 }, anzahl: 3 });
  // Eine Community-Stimme auf der Karte: die lila Reihe steht auf dem Median, nicht auf dem Mittel (2,7).
  assert.equal(daten.serien.find((serie) => serie.ton === "lila")?.matrix.erdig, 2);
  assert.deepEqual(daten.zeilen, [{ terpen: "Myrcen", wert: 1, anzahl: 3 }]);
  // Median der Gesamtnote reicht bis in die Erkundung (T6, Sortenfazit).
  assert.equal(daten.gesamtnoteMedian, 4);
});

test("Erkundungsdaten: ohne Kennwerte kein Median (kein grüner Regler), die Reihe bleibt das Mittel", () => {
  const daten = erkundungsDaten([MYRCEN], [BEWERTUNG({ ...MATRIX, erdig: 1 }, {}), BEWERTUNG({ ...MATRIX, erdig: 4 }, {})], NAMEN, null);
  assert.equal(daten.median, null);
  assert.equal(daten.serien.find((serie) => serie.ton === "lila")?.matrix.erdig, 2.5);
  assert.equal(daten.gesamtnoteMedian, null);
  assert.equal(erkundungsDaten([MYRCEN], [], NAMEN).median, null);
});

test("Geometrie mit eigener Höhe (Buch, T7b): Spalten und Netz passen in die Höhe, Standard bleibt 480", () => {
  // Standard unverändert.
  assert.equal(radiusVon(640), RADIUS);
  assert.deepEqual(mitteVon(640), { x: 320, y: 240 });
  // 360 hoch: erste Achse oben bei 48, letzte bei 360 - 48; Terpene ebenso.
  const achsen = achsenImKarte(640, 360);
  assert.equal(achsen[0].y, 48);
  assert.equal(achsen[achsen.length - 1].y, 312);
  const terpene = terpeneImKarte(3, 640, 360);
  assert.equal(terpene[0].y, 48);
  assert.equal(terpene[2].y, 312);
  assert.deepEqual(mitteVon(640, 360), { x: 320, y: 180 });
  // Netz samt Beschriftung (radius + 34) bleibt mit Rand in der Höhe.
  const r = radiusVon(640, 360);
  assert.equal(r, 120);
  assert.ok(r + 34 + 20 <= 180);
});

test("Versteckte Regler-Gruppe macht die Seite nicht breiter (fieldset min-content hebelt sr-only aus)", () => {
  const html = mitKarte(
    createElement(AromaKarte, {
      terpene: [LIMONEN],
      serien: [],
      texte: aromaTexte(de, "de"),
      regler: { werte: leereGeschmacksMatrix(), aendern: () => {} },
    }),
  );
  // Die Legende entkommt dem Clip eines sr-only-Fieldsets (live: Seite 750 statt 478 px breit);
  // deshalb steckt das Fieldset in einer sr-only-Hülle.
  assert.match(html, /<div class="sr-only"><fieldset class="min-w-0"/);
  assert.doesNotMatch(html, /<fieldset class="sr-only/);
});
