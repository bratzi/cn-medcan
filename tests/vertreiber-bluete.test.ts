import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AromaErkundung } from "@/components/review/AromaErkundung";
import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { erkundungsDaten } from "@/components/review/erkundung-daten";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";
import { MATRIX } from "./hilfen/eintrag";

test("Sortenseite: Ware-Leiste statt Vertreiber-Wahl und Vergleich, Formular mit WareWahlFeld", () => {
  const q = readFileSync("app/[lang]/blueten/[slug]/page.tsx", "utf8");
  assert.match(q, /<WareLeiste/);
  assert.doesNotMatch(q, /VertreiberWahl|VertreiberVergleich/);
  assert.match(q, /kultivarId=\{sorte\.kultivar\.id\}/);
  assert.match(q, /f\.vertreiber/);
  assert.doesNotMatch(q, /f\.importeur/);
  assert.match(q, /zuordnung=\{/);
  const formular = readFileSync("components/review/BewertungsFormular.tsx", "utf8");
  assert.match(formular, /<WareWahlFeld/);
  assert.doesNotMatch(formular, /name="vertreiberId"/);
});

test("ladeVertreiberDerBluete: feste Reihenfolge und die aktuelle Ware immer dabei", () => {
  const q = readFileSync("lib/query/vertreiber.ts", "utf8");
  assert.match(q, /orderBy:\s*\{\s*handelsname:\s*"asc"\s*\}/);
  assert.match(q, /OR:\s*\[\{\s*aktiv:\s*true\s*\},\s*\{\s*id:\s*aktuelleId\s*\}\]/);
});

const NAMEN = { hersteller: "Laut Hersteller", community: "Laut Community" };
const KULTIVAR = { terpenMedian: '{"Myrcen":1}', geschmackMedian: JSON.stringify(MATRIX), gesamtnoteMedian: 4, anzahl: 7 };

test("Erkundung: Handelsname ohne eigene Bewertungen zeigt das Aroma des Kultivars, Anzahl des Kultivars", () => {
  const daten = erkundungsDaten([], [], NAMEN, KULTIVAR);
  assert.equal(daten.serien.length, 1);
  assert.equal(daten.median?.anzahl, 7);
  const html = renderToStaticMarkup(
    createElement(
      KarteSofortKontext.Provider,
      { value: true },
      createElement(AromaErkundung, { titel: "avaay 22/1 BCP", terpene: [], texte: aromaTexte(de, "de"), ...daten }),
    ),
  );
  assert.match(html, /aus 7 Bewertungen/);
});

test("Erkundung: Charge-Fazit vergleicht mit dem Vertreiber-Schnitt, ohne Vertreiber-Kennwerte mit der Ware", () => {
  const review = {
    aussehen: 4, geruch: 4, geschmack: 4, konsistenz: 4, feuchtigkeitProzent: 10,
    geschmacksMatrix: null, terpenIntensitaet: null, beschaffenheit: { chlorophyll: 1 },
  };
  const ohne = erkundungsDaten([], [review], NAMEN, null, null);
  assert.deepEqual(ohne.beschaffenheit, { werte: { chlorophyll: 1 }, feuchte: 10, anzahl: 1 });
  const leer = erkundungsDaten([], [review], NAMEN, null, { achsenMittel: "{}", restfeuchteMedian: null, anzahl: 0 });
  assert.deepEqual(leer.beschaffenheit, ohne.beschaffenheit);
  const mit = erkundungsDaten([], [review], NAMEN, null, {
    achsenMittel: '{"chlorophyll":2.25,"frische":4.1,"unbekannt":3,"kaputt":"x"}',
    restfeuchteMedian: 11.5,
    anzahl: 12,
  });
  assert.deepEqual(mit.beschaffenheit, { werte: { chlorophyll: 2.3, frische: 4.1 }, feuchte: 11.5, anzahl: 12 });
});

test("Blütenseite: Vertreiber-Schnitt geht in die Erkundung, Anzahl aus dem Kultivar", () => {
  const q = readFileSync("app/[lang]/blueten/[slug]/page.tsx", "utf8");
  assert.match(q, /strain\.vertreiberQualitaet/);
  assert.doesNotMatch(q, /profilMitCommunity, \{ anzahl: geschmack\.anzahlBewertungen \}/);
});
