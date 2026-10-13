import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Lieblingsvertreiber } from "@/components/profil/Lieblingsvertreiber";
import { de } from "@/lib/i18n/de";
import { vertreiberRangliste } from "@/lib/lieblingsvertreiber";

test("Rangliste: bester Qualitäts-Schnitt zuerst, Bewertungen ohne Qualität zählen nicht", () => {
  const r = vertreiberRangliste([
    { vertreiberId: "a", vertreiber: "Aurora", qualitaet: 4 },
    { vertreiberId: "a", vertreiber: "Aurora", qualitaet: null },
    { vertreiberId: "b", vertreiber: "Bedrocan", qualitaet: 4.5 },
    { vertreiberId: null, vertreiber: null, qualitaet: 5 },
  ]);
  assert.deepEqual(r, [
    { id: "b", name: "Bedrocan", mittel: 4.5, anzahl: 1 },
    { id: "a", name: "Aurora", mittel: 4, anzahl: 1 },
  ]);
});

test("Rangliste: Gleichstand mehr Bewertungen zuerst, höchstens 5", () => {
  const z = [
    { vertreiberId: "a", vertreiber: "Aurora", qualitaet: 4 },
    { vertreiberId: "b", vertreiber: "Bedrocan", qualitaet: 4 },
    { vertreiberId: "b", vertreiber: "Bedrocan", qualitaet: 4 },
    { vertreiberId: "c", vertreiber: "Cannamedical", qualitaet: 5 },
  ];
  assert.deepEqual(vertreiberRangliste(z).map((r) => r.id), ["c", "b", "a"]);
  assert.equal(vertreiberRangliste(z)[1].anzahl, 2);
  const viele = Array.from({ length: 8 }, (_, i) => ({ vertreiberId: `h${i}`, vertreiber: `H${i}`, qualitaet: i % 5 }));
  assert.equal(vertreiberRangliste(viele).length, 5);
});

test("Gleicher Name, andere Id bleibt getrennt (Review Focus 5)", () => {
  const z = [
    { vertreiberId: "x", vertreiber: "Gleich", qualitaet: 3 },
    { vertreiberId: "y", vertreiber: "Gleich", qualitaet: 4 },
  ];
  assert.deepEqual(vertreiberRangliste(z).map((r) => r.id), ["y", "x"]);
});

test("Komponente: Name verlinkt auf den gefilterten Katalog, leer zeigt den Leersatz", () => {
  const html = renderToStaticMarkup(
    createElement(Lieblingsvertreiber, { daten: [{ id: "abc-1", name: "Aurora", mittel: 4.5, anzahl: 2 }], texte: de.profil, sprache: "de" }),
  );
  assert.match(html, /href="\/blueten\?vertreiber=abc-1"/);
  assert.match(html, /Aurora/);
  assert.match(html, /Qualität 4,5 von 5/);
  // Die Zahl von Hand ist aria-hidden; Screenreader hören sie als Satz.
  assert.match(html, /class="sr-only">2 Bewertungen</);
  const leer = renderToStaticMarkup(createElement(Lieblingsvertreiber, { daten: [], texte: de.profil, sprache: "de" }));
  assert.match(leer, new RegExp(de.profil.vertreiberLeer.slice(0, 20)));
});
