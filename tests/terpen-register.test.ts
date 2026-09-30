import { test } from "node:test";
import assert from "node:assert/strict";

import { baueTerpenRegister } from "@/lib/terpen-register";

const KATALOG = [
  { name: "Myrcen", geschmack: "ERDIG" as const, sorten: 12 },
  { name: "Limonen", geschmack: "ZITRUS" as const, sorten: 7 },
  { name: "Guajol", geschmack: "HOLZIG" as const, sorten: 0 },
];

test("baueTerpenRegister: jedes Terpen mit Schlüssel, Anker, Noten aus der Tabelle und Sortenzahl", () => {
  const { terpene } = baueTerpenRegister(KATALOG);
  assert.deepEqual(
    terpene.map((t) => [t.name, t.schluessel, t.anker, t.sorten]),
    [
      ["Guajol", "guajol", "register-terpen-guajol", 0],
      ["Limonen", "limonen", "register-terpen-limonen", 7],
      ["Myrcen", "myrcen", "register-terpen-myrcen", 12],
    ],
  );
  const myrcen = terpene.find((t) => t.name === "Myrcen");
  assert.deepEqual(myrcen?.noten.map((n) => n.geschmack), ["ERDIG", "FRUCHTIG", "KRAEUTRIG"]);
});

test("baueTerpenRegister: Terpen ohne Tabelleneintrag trägt nur seine Hauptnote aus der Datenbank", () => {
  const { terpene } = baueTerpenRegister(KATALOG);
  assert.deepEqual(terpene.find((t) => t.name === "Guajol")?.noten, [{ geschmack: "HOLZIG", anteil: 1 }]);
});

test("baueTerpenRegister: Noten in fester Reihenfolge, je Note die Terpene nach Anteil absteigend", () => {
  const { noten } = baueTerpenRegister(KATALOG);
  const fruchtig = noten.find((n) => n.geschmack === "FRUCHTIG");
  // Myrcen trägt 0,3 Fruchtig, Limonen 0,15; dazu Ester als Begleitstoff.
  assert.deepEqual(fruchtig?.terpene.map((t) => t.name), ["Myrcen", "Limonen"]);
  assert.deepEqual(fruchtig?.terpene.map((t) => t.sorten), [12, 7]);
  assert.deepEqual(fruchtig?.begleitstoffe.map((b) => b.name), ["Ester"]);
  assert.equal(fruchtig?.anker, "register-note-fruchtig");
  // Reihenfolge der Achsen wie GESCHMACKS_KATEGORIEN, leere Noten entfallen.
  assert.deepEqual(
    noten.map((n) => n.geschmack),
    ["DIESEL", "ZITRUS", "ERDIG", "SUESS", "HOLZIG", "KRAEUTRIG", "FRUCHTIG"],
  );
});

test("baueTerpenRegister: Diesel kommt allein über die Thiole, ohne Terpen", () => {
  const { noten } = baueTerpenRegister(KATALOG);
  const diesel = noten.find((n) => n.geschmack === "DIESEL");
  assert.deepEqual(diesel?.terpene, []);
  assert.deepEqual(diesel?.begleitstoffe.map((b) => b.name), ["Thiole"]);
});

test("baueTerpenRegister: ungültige Sortenzahlen werden 0, Anker bleiben ohne Sonderzeichen", () => {
  const { terpene } = baueTerpenRegister([
    { name: "beta-Caryophyllen", geschmack: "WUERZIG", sorten: Number.NaN },
    { name: "Trans Nerolidol", geschmack: "HOLZIG", sorten: -3 },
  ]);
  assert.deepEqual(
    terpene.map((t) => [t.anker, t.sorten]),
    [
      ["register-terpen-beta-caryophyllen", 0],
      ["register-terpen-trans-nerolidol", 0],
    ],
  );
});

test("baueTerpenRegister: leerer Katalog ergibt keine Terpene, nur die Noten der Begleitstoffe", () => {
  const { terpene, noten } = baueTerpenRegister([]);
  assert.deepEqual(terpene, []);
  assert.deepEqual(noten.map((n) => n.geschmack), ["DIESEL", "SUESS", "FRUCHTIG"]);
});
