import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AktiveFilter } from "@/components/produkt/AktiveFilter";
import { AnsichtUmschalter } from "@/components/produkt/AnsichtUmschalter";
import { KultivarKarte } from "@/components/produkt/KultivarKarte";
import { de } from "@/lib/i18n/de";
import { parseStrainFilter } from "@/lib/query/filter";

const ID = "ed9c2468f2c9b661441986de9d72f496";
const kultivar = {
  id: ID, name: "Black Cherry Punch", typ: "INDICA" as const, thcMin: 20, thcMax: 30, cbdMin: 0.5, cbdMax: 1,
  terpene: [{ name: "Myrcen", geschmack: null, rang: 1 }, { name: "Limonen", geschmack: null, rang: 2 }],
  vertreiber: ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta"], handelsnamen: 7, overall: 3.8, bewertungen: 4,
  bildSlug: null, herstellerBildPfad: null,
};

test("AnsichtUmschalter: zwei Links, aktuelle Ansicht mit aria-current, Wechsel auf Seite 1 mit übrigen Filtern", () => {
  const filter = parseStrainFilter({ typ: "INDICA", seite: "3", ansicht: "ware" });
  const html = renderToStaticMarkup(createElement(AnsichtUmschalter, { filter, texte: de.katalog.ansicht }));
  assert.match(html, /aria-current="page"[^>]*>Handelsnamen/);
  assert.match(html, /href="\/blueten\?typ=INDICA"/);
  assert.doesNotMatch(html, /seite=3/);
});

test("KultivarKarte: Name, Typ, Spanne, fünf Vertreiber plus Rest, Overall, Link mit Filter", () => {
  const filter = parseStrainFilter({ typ: "INDICA", ansicht: "bluete" });
  const html = renderToStaticMarkup(createElement(KultivarKarte, { kultivar, filter, w: de, sprache: "de" }));
  assert.match(html, /Black Cherry Punch/);
  assert.match(html, /Indica/i);
  assert.match(html, /20 bis 30 % THC/);
  assert.match(html, /0,5 bis 1,0 % CBD/);
  assert.match(html, /Myrcen/);
  assert.match(html, /Limonen/);
  assert.match(html, /Epsilon/);
  assert.doesNotMatch(html, /Zeta/);
  assert.match(html, /\+2/);
  assert.match(html, /Overall 3,8 von 5/);
  assert.match(html, new RegExp(`href="/blueten\\?typ=INDICA&amp;kultivar=${ID}"`));
  assert.match(html, /7 Handelsnamen ansehen/);
  assert.match(html, /wrap-break-word/);
  assert.doesNotMatch(html, /href="\/blueten\/[^"?]/);
  const mitSlug = renderToStaticMarkup(createElement(KultivarKarte, { kultivar: { ...kultivar, slug: "black-cherry-punch" }, filter, w: de, sprache: "de" }));
  assert.match(mitSlug, /href="\/blueten\/black-cherry-punch"[^>]*>Black Cherry Punch/);
});

test("KultivarKarte: ohne Bewertung kein Overall, ohne Vertreiber der Ersatztext", () => {
  const html = renderToStaticMarkup(
    createElement(KultivarKarte, { kultivar: { ...kultivar, vertreiber: [], overall: null, bewertungen: 0 }, filter: parseStrainFilter({}), w: de, sprache: "de" }),
  );
  assert.doesNotMatch(html, /Overall/);
  assert.match(html, /Vertreiber unbekannt/);
});

test("AktiveFilter: Chip Blüte mit Namen, unbekannte Id als unbekannt, Entfernen behält Ansicht", () => {
  const filter = parseStrainFilter({ kultivar: ID, ansicht: "bluete" });
  const mit = renderToStaticMarkup(createElement(AktiveFilter, { filter, kultivarName: "Black Cherry Punch", w: de, sprache: "de" }));
  assert.match(mit, /Blüte: Black Cherry Punch/);
  assert.match(mit, /href="\/blueten\??"/);
  const ohne = renderToStaticMarkup(createElement(AktiveFilter, { filter, kultivarName: null, w: de, sprache: "de" }));
  assert.match(ohne, /Blüte: unbekannt/);
});

test("ProduktCard: Link auf die anderen Vertreiber nur mit Zahl größer null", () => {
  const q = readFileSync("components/produkt/ProduktCard.tsx", "utf8");
  assert.match(q, /weitereVertreiber/);
  assert.match(q, /\/blueten\?kultivar=\$\{strain\.kultivarId\}/);
});

test("Katalogseite: Ansicht schaltet die Abfrage, Startseite reicht weitereVertreiber durch", () => {
  const seite = readFileSync("app/[lang]/blueten/page.tsx", "utf8");
  assert.match(seite, /filter\.ansicht === "bluete"/);
  assert.match(seite, /ladeKultivarListe\(/);
  assert.match(seite, /ladeVertreiberJeKultivar\(/);
  assert.match(seite, /<AnsichtUmschalter/);
  const start = readFileSync("components/story/Katalog.tsx", "utf8");
  assert.match(start, /weitereVertreiber=/);
});

test("FilterLeiste: Sortierwahl nicht in der Blüten-Ansicht, Zurücksetzen behält die Ansicht", () => {
  const q = readFileSync("components/produkt/FilterLeiste.tsx", "utf8");
  assert.match(q, /filter\.ansicht === "bluete" \? null :/);
  assert.match(q, /ansicht: filter\.ansicht/);
});

test("KultivarKarte: CBD-Zeile fehlt bei 0 oder ohne Werte", () => {
  for (const k of [{ ...kultivar, cbdMin: 0, cbdMax: 0 }, { ...kultivar, cbdMin: null, cbdMax: null }]) {
    const html = renderToStaticMarkup(createElement(KultivarKarte, { kultivar: k, filter: parseStrainFilter({}), w: de, sprache: "de" }));
    assert.doesNotMatch(html, /CBD/);
  }
});

test("KultivarKarte: ohne Vertreiber keine Zählzeile „bei 0“", () => {
  const html = renderToStaticMarkup(
    createElement(KultivarKarte, { kultivar: { ...kultivar, vertreiber: [] }, filter: parseStrainFilter({}), w: de, sprache: "de" }),
  );
  assert.doesNotMatch(html, /bei 0/);
});

test("Katalogseite: Zurücksetzen im Leerzustand behält die Blüten-Ansicht", () => {
  const seite = readFileSync("app/[lang]/blueten/page.tsx", "utf8");
  assert.match(seite, /bluetenAnsicht \? "\/blueten" : "\/blueten\?ansicht=ware"/);
});

test("Trefferzeile der Handelsnamen-Ansicht zählt Handelsnamen", () => {
  assert.match(de.katalog.anzahl.other, /Handelsnamen/);
});
