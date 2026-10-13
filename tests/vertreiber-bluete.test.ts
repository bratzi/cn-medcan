import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { VertreiberVergleich } from "@/components/review/VertreiberVergleich";
import { VertreiberWahl } from "@/components/review/VertreiberWahl";
import { AromaErkundung } from "@/components/review/AromaErkundung";
import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { erkundungsDaten } from "@/components/review/erkundung-daten";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";
import { MATRIX } from "./hilfen/eintrag";

const eintraege = [
  { slug: "enua-22-1-bcp-ca", handelsname: "Enua 22/1 BCP CA", vertreiberName: "Enua Pharma GmbH", qualitaet: 4.2, restfeuchte: 11.5, anzahl: 3, aktuell: false },
  { slug: "avaay-22-1-bcp", handelsname: "avaay 22/1 BCP", vertreiberName: "avaay", qualitaet: null, restfeuchte: null, anzahl: 0, aktuell: true },
];

test("VertreiberWahl: alle Vertreiber der Blüte als Links, aktueller markiert, Vorschlag mit Kultivar", () => {
  const html = renderToStaticMarkup(createElement(VertreiberWahl, { eintraege, kultivarId: "k1", texte: de.bluete.vertreiber }));
  assert.match(html, /href="\/blueten\/enua-22-1-bcp-ca#bewerten"/);
  // Seit Fix-Runde 1 steht der Name in einem inneren span (Name und Handelsname).
  assert.match(html, /aria-current="page"[^>]*>(?:<span[^>]*>)*avaay/);
  assert.match(html, /href="\/vorschlagen\?kultivar=k1"/);
});

test("VertreiberWahl: nur ein Vertreiber steht als Text", () => {
  const html = renderToStaticMarkup(createElement(VertreiberWahl, { eintraege: [eintraege[1]], kultivarId: "k1", texte: de.bluete.vertreiber }));
  assert.doesNotMatch(html, /href="\/blueten\//);
  assert.match(html, /avaay/);
});

test("VertreiberVergleich: leer entfällt, ein Eintrag nennt den einen Vertreiber, sonst Zeile je Vertreiber ohne Kauflink", () => {
  const p = { kultivarId: "k1", texte: de.bluete.vertreiber, sprache: "de" as const };
  assert.equal(renderToStaticMarkup(createElement(VertreiberVergleich, { ...p, eintraege: [] })), "");
  const einer = renderToStaticMarkup(createElement(VertreiberVergleich, { ...p, eintraege: [eintraege[1]] }));
  assert.match(einer, /Bisher kennen wir sie nur von avaay\./);
  assert.match(einer, /href="\/vorschlagen\?kultivar=k1"/);
  assert.doesNotMatch(einer, /<ul/);
  const ohneName = renderToStaticMarkup(createElement(VertreiberVergleich, { ...p, eintraege: [{ ...eintraege[1], vertreiberName: null }] }));
  assert.match(ohneName, /dessen Name noch fehlt/);
  assert.doesNotMatch(ohneName, /Vertreiber unbekannt/);
  assert.doesNotMatch(einer, /href="\/blueten\?kultivar=k1"/);
  const html = renderToStaticMarkup(createElement(VertreiberVergleich, { ...p, eintraege }));
  assert.match(html, /Enua Pharma GmbH/);
  assert.match(html, /11,5/);
  assert.match(html, /href="\/vorschlagen\?kultivar=k1"/);
  assert.match(html, /href="\/blueten\?kultivar=k1"/);
  assert.doesNotMatch(html, /apotheke|kaufen/i);
});

test("Blütenseite: Vertreiber-Wahl über der Maske, Vergleich, Angaben Vertreiber und Hersteller", () => {
  const q = readFileSync("app/[lang]/blueten/[slug]/page.tsx", "utf8");
  assert.match(q, /<VertreiberWahl/);
  assert.match(q, /<VertreiberVergleich/);
  assert.match(q, /vertreiberListe\.length > 0 && strain\.kultivar/);
  assert.match(q, /kultivarId=\{strain\.kultivar\.id\}/);
  assert.match(q, /f\.vertreiber/);
  assert.doesNotMatch(q, /f\.importeur/);
  assert.match(q, /zuordnung=\{/);
});

// --- Fix-Runde 1 (Review Task 5) ---

test("VertreiberWahl: Chips zeigen Vertreibername und Handelsname", () => {
  const html = renderToStaticMarkup(createElement(VertreiberWahl, { eintraege, kultivarId: "k1", texte: de.bluete.vertreiber }));
  assert.match(html, /Enua Pharma GmbH/);
  assert.match(html, /Enua 22\/1 BCP CA/);
  assert.match(html, /avaay 22\/1 BCP/);
});

test("VertreiberWahl: leere Liste fällt auf den Vertreiber der Seite zurück", () => {
  const html = renderToStaticMarkup(
    createElement(VertreiberWahl, { eintraege: [], kultivarId: "k1", texte: de.bluete.vertreiber, eigenerVertreiber: "avaay" }),
  );
  assert.match(html, /avaay/);
  assert.doesNotMatch(html, new RegExp(de.bluete.vertreiber.unbekannt));
});

test("VertreiberVergleich: die Zeile der angezeigten Ware trägt „diese Ware“", () => {
  const html = renderToStaticMarkup(createElement(VertreiberVergleich, { eintraege, kultivarId: "k1", texte: de.bluete.vertreiber, sprache: "de" }));
  assert.equal(html.split(de.bluete.vertreiber.dieseWare).length - 1, 1);
  const zeile = html.split("<li").find((teil) => teil.includes("avaay 22/1 BCP")) ?? "";
  assert.ok(zeile.includes(de.bluete.vertreiber.dieseWare));
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
  assert.match(q, /eigenerVertreiber=\{/);
  assert.doesNotMatch(q, /profilMitCommunity, \{ anzahl: geschmack\.anzahlBewertungen \}/);
});
