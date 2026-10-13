import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { VertreiberVergleich } from "@/components/review/VertreiberVergleich";
import { VertreiberWahl } from "@/components/review/VertreiberWahl";
import { de } from "@/lib/i18n/de";

const eintraege = [
  { slug: "enua-22-1-bcp-ca", handelsname: "Enua 22/1 BCP CA", vertreiberName: "Enua Pharma GmbH", qualitaet: 4.2, restfeuchte: 11.5, anzahl: 3, aktuell: false },
  { slug: "avaay-22-1-bcp", handelsname: "avaay 22/1 BCP", vertreiberName: "avaay", qualitaet: null, restfeuchte: null, anzahl: 0, aktuell: true },
];

test("VertreiberWahl: alle Vertreiber der Blüte als Links, aktueller markiert, Vorschlag mit Kultivar", () => {
  const html = renderToStaticMarkup(createElement(VertreiberWahl, { eintraege, kultivarId: "k1", texte: de.bluete.vertreiber }));
  assert.match(html, /href="\/blueten\/enua-22-1-bcp-ca#bewerten"/);
  assert.match(html, /aria-current="page"[^>]*>[^<]*avaay/);
  assert.match(html, /href="\/vorschlagen\?kultivar=k1"/);
});

test("VertreiberWahl: nur ein Vertreiber steht als Text", () => {
  const html = renderToStaticMarkup(createElement(VertreiberWahl, { eintraege: [eintraege[1]], kultivarId: "k1", texte: de.bluete.vertreiber }));
  assert.doesNotMatch(html, /href="\/blueten\//);
  assert.match(html, /avaay/);
});

test("VertreiberVergleich: entfällt bei nur einem Handelsnamen, sonst Zeile je Vertreiber ohne Kauflink", () => {
  assert.equal(renderToStaticMarkup(createElement(VertreiberVergleich, { eintraege: [eintraege[1]], texte: de.bluete.vertreiber, sprache: "de" })), "");
  const html = renderToStaticMarkup(createElement(VertreiberVergleich, { eintraege, texte: de.bluete.vertreiber, sprache: "de" }));
  assert.match(html, /Enua Pharma GmbH/);
  assert.match(html, /11,5/);
  assert.doesNotMatch(html, /apotheke|kaufen/i);
});

test("Blütenseite: Vertreiber-Wahl über der Maske, Vergleich, Angaben Vertreiber und Hersteller", () => {
  const q = readFileSync("app/[lang]/blueten/[slug]/page.tsx", "utf8");
  assert.match(q, /<VertreiberWahl/);
  assert.match(q, /<VertreiberVergleich/);
  assert.match(q, /f\.vertreiber/);
  assert.doesNotMatch(q, /f\.importeur/);
  assert.match(q, /zuordnung=\{/);
});
