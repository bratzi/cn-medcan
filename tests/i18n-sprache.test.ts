import { test } from "node:test";
import assert from "node:assert/strict";

import { bestimmeSprache, istSprache, spracheAusAcceptLanguage } from "@/lib/i18n/sprache-kern";

test("istSprache kennt nur de und en", () => {
  assert.equal(istSprache("de"), true);
  assert.equal(istSprache("en"), true);
  for (const wert of ["EN", "fr", "", undefined, null, 1]) assert.equal(istSprache(wert), false);
});

test("spracheAusAcceptLanguage: erster de/en-Eintrag nach Gewicht", () => {
  assert.equal(spracheAusAcceptLanguage(null), null);
  assert.equal(spracheAusAcceptLanguage(""), null);
  assert.equal(spracheAusAcceptLanguage("en-GB,en;q=0.9,de;q=0.8"), "en");
  assert.equal(spracheAusAcceptLanguage("de-DE,de;q=0.9,en;q=0.8"), "de");
  assert.equal(spracheAusAcceptLanguage("de;q=0.5, en;q=0.9"), "en");
  assert.equal(spracheAusAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.8"), "en");
  assert.equal(spracheAusAcceptLanguage("fr,nl"), null);
  assert.equal(spracheAusAcceptLanguage("en;q=0, de"), "de");
  assert.equal(spracheAusAcceptLanguage("en;q=abc, de;q=0.5"), "de");
  assert.equal(spracheAusAcceptLanguage("*"), null);
});

test("bestimmeSprache: gueltiges Cookie gewinnt immer", () => {
  assert.equal(bestimmeSprache({ cookie: "en", acceptLanguage: "de", erkennungAktiv: true }), "en");
  assert.equal(bestimmeSprache({ cookie: "de", acceptLanguage: "en", erkennungAktiv: true }), "de");
  assert.equal(bestimmeSprache({ cookie: "en", acceptLanguage: null, erkennungAktiv: false }), "en");
});

test("bestimmeSprache: ungueltiges Cookie faellt auf Erkennung bzw. de", () => {
  for (const cookie of ["fr", "", "EN", undefined]) {
    assert.equal(bestimmeSprache({ cookie, acceptLanguage: "en-GB", erkennungAktiv: true }), "en");
    assert.equal(bestimmeSprache({ cookie, acceptLanguage: "en-GB", erkennungAktiv: false }), "de");
    assert.equal(bestimmeSprache({ cookie, acceptLanguage: "fr", erkennungAktiv: true }), "de");
  }
});
