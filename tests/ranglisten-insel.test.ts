import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RanglistenKarte } from "@/components/rangliste/RanglistenKarte";
import { Ranglisten } from "@/components/rangliste/Ranglisten";
import { de } from "@/lib/i18n/de";

const karte = {
  rang: 1, slug: "remexian", handelsname: "Remexian 30/1 PGF CIS", hersteller: "Purplefarm", bildId: "bluete-02",
  schnitt: 4.5, anzahl: 3, betreiber: 4.5, zuletzt: "2026-10-08T00:00:00.000Z", abstand: null,
};

test("Karte: Link zur Blüte, Schnitt de-DE, Anzahl in Mehrzahl", () => {
  const html = renderToStaticMarkup(createElement(RanglistenKarte, { karte, nach: "hoechste", texte: de.rangliste, sprache: "de" }));
  assert.match(html, /href="\/blueten\/remexian"/);
  assert.match(html, /4,5/);
  assert.match(html, /3 Bewertungen/);
  assert.doesNotMatch(html, /Abstand/);
});

test("Insel: ohne JavaScript steht der Anmelde-Hinweis", () => {
  const html = renderToStaticMarkup(createElement(Ranglisten, { texte: de.rangliste, sprache: "de" }));
  assert.match(html, /angemeldete Mitglieder/);
  assert.match(html, /\/anmelden\?weiter=/);
});

test("Wörter sachlich: kein Top, kein Beste", () => {
  const alles = JSON.stringify(de.rangliste);
  assert.doesNotMatch(alles, /\bTop\b|[Bb]este/);
});
