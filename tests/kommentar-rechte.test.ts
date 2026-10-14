import { test } from "node:test";
import assert from "node:assert/strict";
import { darfLoeschen, darfSchreiben, nachMeldung, zuSchnell } from "@/lib/kommentar-rechte";

const b = { ichId: "x", istAdmin: false, autorId: "a", inhaberId: "i" };
test("Löschen: Autor, Inhaber, Admin ja; Fremder nein", () => {
  assert.equal(darfLoeschen({ ...b, ichId: "a" }), true);
  assert.equal(darfLoeschen({ ...b, ichId: "i" }), true);
  assert.equal(darfLoeschen({ ...b, istAdmin: true }), true);
  assert.equal(darfLoeschen(b), false);
});
test("Schreiben nur an öffentlichem Ziel; privates Profil hat keine Pinnwand", () => {
  assert.equal(darfSchreiben({ ziel: "PROFIL", zielOeffentlich: false }), false);
  assert.equal(darfSchreiben({ ziel: "PROFIL", zielOeffentlich: true }), true);
  assert.equal(darfSchreiben({ ziel: "BEWERTUNG", zielOeffentlich: false }), false);
});
test("Dritte Meldung blendet aus, gelöscht bleibt gelöscht", () => {
  assert.equal(nachMeldung(2, "SICHTBAR"), "SICHTBAR");
  assert.equal(nachMeldung(3, "SICHTBAR"), "GEMELDET");
  assert.equal(nachMeldung(5, "GELOESCHT"), "GELOESCHT");
});
test("Ratenbremse ab dem 11. Kommentar je Stunde", () => {
  assert.equal(zuSchnell(9), false);
  assert.equal(zuSchnell(10), true);
});
