import { test } from "node:test";
import assert from "node:assert/strict";

import { farbFlaeche, LINIEN_FARBE, VERLAUF } from "@/lib/aroma-farben";
import { verbindungsKarte } from "@/lib/terpen-register";

/**
 * Register aufgewertet (T17, Nutzer 2026-09-30): Verbindungen Terpen und
 * Geschmack in beide Richtungen, Farben aus derselben Quelle wie die Aroma-Karte.
 */
const TERPENE = [
  { anker: "register-terpen-limonen", noten: [{ anker: "register-note-zitrus" }, { anker: "register-note-fruchtig" }] },
  { anker: "register-terpen-myrcen", noten: [{ anker: "register-note-erdig" }, { anker: "register-note-fruchtig" }] },
];

test("verbindungsKarte: Terpen zeigt auf seine Noten, Note auf ihre Terpene", () => {
  const karte = verbindungsKarte(TERPENE);
  assert.deepEqual(karte["register-terpen-limonen"], ["register-note-zitrus", "register-note-fruchtig"]);
  assert.deepEqual(karte["register-note-fruchtig"], ["register-terpen-limonen", "register-terpen-myrcen"]);
  assert.deepEqual(karte["register-note-erdig"], ["register-terpen-myrcen"]);
});

test("verbindungsKarte: keine doppelten Einträge, leerer Katalog ergibt leere Karte", () => {
  const doppelt = [{ anker: "t", noten: [{ anker: "n" }, { anker: "n" }] }];
  assert.deepEqual(verbindungsKarte(doppelt), { t: ["n"], n: ["t"] });
  assert.deepEqual(verbindungsKarte([]), {});
});

test("farbFlaeche: feste Farbe aus der Aroma-Karte, Verlauf für Fruchtig und Blumig", () => {
  assert.equal(farbFlaeche("ZITRUS"), LINIEN_FARBE.ZITRUS);
  assert.equal(farbFlaeche("FRUCHTIG"), `linear-gradient(90deg, ${VERLAUF.FRUCHTIG.join(", ")})`);
  assert.match(farbFlaeche("BLUMIG"), /^linear-gradient\(90deg, #/);
});
