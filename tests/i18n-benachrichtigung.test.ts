import { test } from "node:test";
import assert from "node:assert/strict";

import { benachrichtigungSatz, vorlageAbgelehnt, vorlageFreigegeben } from "@/lib/benachrichtigung";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("neue Zeile: Satz entsteht in der Sprache des Lesers", () => {
  const v = vorlageFreigegeben("Apples & Bananas");
  const zeile = { art: v.art, text: v.text, parameter: v.parameter };
  assert.equal(benachrichtigungSatz(de.benachrichtigung, zeile), "Deine vorgeschlagene Blüte Apples & Bananas steht jetzt im Katalog.");
  assert.equal(benachrichtigungSatz(en.benachrichtigung, zeile), "The flower you suggested, Apples & Bananas, is now in the catalogue.");
});

test("Ablehnung mit Begruendung: Begruendung bleibt wie geschrieben", () => {
  const v = vorlageAbgelehnt("X", "Nicht verschreibungsfähig");
  const satz = benachrichtigungSatz(en.benachrichtigung, { art: v.art, text: v.text, parameter: v.parameter });
  assert.ok(satz.includes("Nicht verschreibungsfähig"));
  assert.ok(satz.startsWith("We are not adding"));
});

test("alte Zeile ohne parameter und kaputtes JSON zeigen den gespeicherten Text", () => {
  assert.equal(benachrichtigungSatz(en.benachrichtigung, { art: "VORSCHLAG_FREIGEGEBEN", text: "Alt.", parameter: null }), "Alt.");
  assert.equal(benachrichtigungSatz(en.benachrichtigung, { art: "VORSCHLAG_FREIGEGEBEN", text: "Alt.", parameter: "{kaputt" }), "Alt.");
  assert.equal(benachrichtigungSatz(en.benachrichtigung, { art: "UNBEKANNT", text: "Alt.", parameter: "{\"handelsname\":\"X\"}" }), "Alt.");
});

test("LIKE und FOLGT: Satz aus dem Wörterbuch in de und en", () => {
  const zeile = (art: string) => ({ art, text: "Alt.", parameter: JSON.stringify({ name: "Mia" }) });
  assert.equal(benachrichtigungSatz(de.benachrichtigung, zeile("LIKE")), "Mia gefällt deine Bewertung.");
  assert.equal(benachrichtigungSatz(en.benachrichtigung, zeile("LIKE")), "Mia likes your review.");
  assert.equal(benachrichtigungSatz(de.benachrichtigung, zeile("FOLGT")), "Mia folgt dir jetzt.");
  assert.equal(benachrichtigungSatz(en.benachrichtigung, zeile("FOLGT")), "Mia now follows you.");
});

test("deutscher Rueckfall-Text bleibt wie bisher", () => {
  assert.equal(vorlageFreigegeben("X").text, "Deine vorgeschlagene Blüte X steht jetzt im Katalog.");
  assert.equal(vorlageAbgelehnt("X", "Y").text, "Deine vorgeschlagene Blüte X nehmen wir nicht in den Katalog auf. Grund: Y");
});
