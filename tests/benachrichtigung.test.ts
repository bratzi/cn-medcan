import { test } from "node:test";
import assert from "node:assert/strict";

import { nachrichtenFuer, textAbgelehnt, textFreigegeben } from "@/lib/benachrichtigung";

test("Texte ohne Gedankenstrich, Handelsname unveraendert", () => {
  assert.equal(textFreigegeben("Apples & Bananas"), "Deine vorgeschlagene Blüte Apples & Bananas steht jetzt im Katalog.");
  assert.equal(textAbgelehnt("X", null), "Deine vorgeschlagene Blüte X nehmen wir nicht in den Katalog auf.");
  assert.equal(
    textAbgelehnt("X", "Keine Quelle gefunden"),
    "Deine vorgeschlagene Blüte X nehmen wir nicht in den Katalog auf. Grund: Keine Quelle gefunden",
  );
  for (const t of [textFreigegeben("A"), textAbgelehnt("A", "b")]) assert.doesNotMatch(t, /[–—]/);
});

test("nachrichtenFuer: eine Nachricht je Mitglied", () => {
  const liste = nachrichtenFuer(["a", "b", "a"], { art: "VORSCHLAG_FREIGEGEBEN", text: "t", link: "/produkte/x" });
  assert.deepEqual(liste.map((n) => n.mitgliedId), ["a", "b"]);
  assert.equal(liste[0].link, "/produkte/x");
});
