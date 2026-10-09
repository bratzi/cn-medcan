import { test } from "node:test";
import assert from "node:assert/strict";

import {
  TERPEN_ACHSEN, hauptAroma, leeresTerpenNetz, terpenNetzAusListe, terpenNetzAusVektor, terpenNetzLesen, terpenSchluessel,
} from "@/lib/terpen-achsen";

test("zehn feste Achsen in fester Reihenfolge, Namen wie in der Datenbank", () => {
  assert.deepEqual(TERPEN_ACHSEN.map((a) => a.name), [
    "Myrcen", "Limonen", "beta-Caryophyllen", "Linalool", "alpha-Pinen",
    "Terpinolen", "Humulen", "Ocimen", "Farnesen", "Nerolidol",
  ]);
});

test("terpenSchluessel: ohne Groß- und Kleinschreibung, Unbekanntes null", () => {
  assert.equal(terpenSchluessel(" beta-Caryophyllen "), "beta-caryophyllen");
  assert.equal(terpenSchluessel("Ester"), null);
});

test("hauptAroma: stärkster Anteil aus terpen-aromen", () => {
  assert.equal(hauptAroma("limonen"), "ZITRUS");
  assert.equal(hauptAroma("myrcen"), "ERDIG");
});

test("terpenNetzAusVektor: nur t:-Schlüssel der zehn, auf stärkstes |Gewicht| normiert", () => {
  const v = new Map([["t:Myrcen", 2], ["t:Limonen", -1], ["t:Guajol", 9], ["g:ZITRUS", 5]]);
  const n = terpenNetzAusVektor(v);
  assert.equal(n.myrcen, 1);
  assert.equal(n.limonen, -0.5);
  assert.equal(n.linalool, 0);
});

test("terpenNetzAusVektor: leerer Vektor ergibt lauter Nullen", () => {
  assert.deepEqual(terpenNetzAusVektor(new Map()), leeresTerpenNetz());
});

test("terpenNetzAusListe: alte Liste, fehlende Achsen 0, neu normiert", () => {
  const n = terpenNetzAusListe([{ name: "Linalool", wert: 0.5 }, { name: "Ester", wert: 1 }, { name: "Humulen", wert: -0.25 }]);
  assert.equal(n.linalool, 1);
  assert.equal(n.humulen, -0.5);
  assert.equal(n.myrcen, 0);
});

test("terpenNetzLesen: Objekt geprüft und geklemmt, Kaputtes null", () => {
  assert.equal(terpenNetzLesen({ myrcen: 3, quatsch: 1 })?.myrcen, 1);
  assert.equal(terpenNetzLesen("x"), null);
  assert.equal(terpenNetzLesen([1, 2]), null);
});
