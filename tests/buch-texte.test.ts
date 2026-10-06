import { test } from "node:test";
import assert from "node:assert/strict";

import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

const NEU = ["bewertungVon", "vonEuch", "datum", "chargeLabel", "nichtAngegeben", "bewertungenInsgesamt", "keinText", "blaetter"] as const;

test("Buch-Texte: neue Schlüssel in de und en, ohne Geviert- und Gedankenstrich", () => {
  for (const woerterbuch of [de, en]) {
    for (const schluessel of NEU) {
      const text = woerterbuch.buch[schluessel];
      assert.ok(text.length > 0, schluessel);
      assert.doesNotMatch(text, /[\u2013\u2014]/, schluessel);
    }
  }
  assert.equal(de.buch.bewertungVon, "Bewertung von {name}");
  assert.equal(en.buch.bewertungVon, "Review by {name}");
});

test("Der Reiter der Karte heißt Terpenbewertung", () => {
  assert.equal(de.buch.reiterKarte, "Terpenbewertung");
  assert.equal(en.buch.reiterKarte, "Terpene rating");
});
