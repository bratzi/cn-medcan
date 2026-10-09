import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Lieblingshersteller } from "@/components/profil/Lieblingshersteller";
import { de } from "@/lib/i18n/de";
import { herstellerRangliste } from "@/lib/lieblingshersteller";

test("Rangliste: Mittel absteigend, Gleichstand mehr Bewertungen zuerst, höchstens 5", () => {
  const z = [
    { herstellerId: "a", hersteller: "Aurora", note: 4 },
    { herstellerId: "b", hersteller: "Bedrocan", note: 4 },
    { herstellerId: "b", hersteller: "Bedrocan", note: 4 },
    { herstellerId: "c", hersteller: "Cannamedical", note: 5 },
  ];
  assert.deepEqual(herstellerRangliste(z).map((r) => r.id), ["c", "b", "a"]);
  assert.equal(herstellerRangliste(z)[1].anzahl, 2);
  const viele = Array.from({ length: 8 }, (_, i) => ({ herstellerId: `h${i}`, hersteller: `H${i}`, note: i % 5 }));
  assert.equal(herstellerRangliste(viele).length, 5);
});

test("Ohne Hersteller fällt weg; gleicher Name, andere Id bleibt getrennt (Review Focus 5)", () => {
  const z = [
    { herstellerId: null, hersteller: null, note: 5 },
    { herstellerId: "x", hersteller: "Gleich", note: 3 },
    { herstellerId: "y", hersteller: "Gleich", note: 4 },
  ];
  assert.deepEqual(herstellerRangliste(z).map((r) => r.id), ["y", "x"]);
});

test("Komponente: Name verlinkt auf den gefilterten Katalog, leer zeigt den Leersatz", () => {
  const html = renderToStaticMarkup(
    createElement(Lieblingshersteller, { daten: [{ id: "abc-1", name: "Aurora", mittel: 4.5, anzahl: 2 }], texte: de.profil, sprache: "de" }),
  );
  assert.match(html, /href="\/blueten\?hersteller=abc-1"/);
  assert.match(html, /Aurora/);
  const leer = renderToStaticMarkup(createElement(Lieblingshersteller, { daten: [], texte: de.profil, sprache: "de" }));
  assert.match(leer, new RegExp(de.profil.herstellerLeer.slice(0, 20)));
});
