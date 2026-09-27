import { test } from "node:test";
import assert from "node:assert/strict";

import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { mehrzahl } from "@/lib/i18n/text";
import { stimmeEingabePruefen, vorschlagEingabePruefen } from "@/lib/umfrage-eingabe";

test("Vorschlag und Stimme melden Schluessel, die beide Woerterbuecher kennen", () => {
  const faelle = [
    vorschlagEingabePruefen("", "s", ""),
    vorschlagEingabePruefen("u", "", ""),
    vorschlagEingabePruefen("u", "s", "x".repeat(600)),
    stimmeEingabePruefen("", "o"),
    stimmeEingabePruefen("u", ""),
  ];
  for (const e of faelle) {
    assert.equal(e.ok, false);
    if (e.ok) continue;
    assert.ok(e.fehler.schluessel in de.meldung, e.fehler.schluessel);
    assert.ok(e.fehler.schluessel in en.meldung, e.fehler.schluessel);
  }
});

test("Stimmenzaehler bildet die Mehrzahl je Sprache", () => {
  assert.equal(mehrzahl("de", de.umfrage.karte.abgegeben, 0), "0 abgegebene Stimmen");
  assert.equal(mehrzahl("de", de.umfrage.karte.abgegeben, 1), "1 abgegebene Stimme");
  assert.equal(mehrzahl("en", en.umfrage.karte.abgegeben, 1), "1 vote cast");
  assert.equal(mehrzahl("en", en.umfrage.karte.abgegeben, 2), "2 votes cast");
});
