import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { kennwerteDaten } from "@/lib/kennwerte";

test("kennwerteDaten: Aroma und Qualität aus denselben Zeilen", () => {
  const d = kennwerteDaten([
    { gesamtnote: 4, terpenIntensitaet: '{"Myrcen":3}', geschmacksMatrix: '{"ERDIG":4}', beschaffenheit: '{"chlorophyll":2.5}', feuchtigkeitProzent: 11 },
    { gesamtnote: 2, terpenIntensitaet: null, geschmacksMatrix: "{}", beschaffenheit: null, feuchtigkeitProzent: null },
  ]);
  assert.equal(d.aroma.anzahl, 2);
  assert.equal(d.aroma.gesamtnoteMittel, 3);
  assert.equal(d.qualitaet.qualitaetMittel, 5);
  assert.equal(d.qualitaet.anzahl, 1);
});

test("kennwerteFortschreiben schreibt Kultivar und Vertreiber, überspringt fehlenden Vertreiber", () => {
  const q = readFileSync("lib/kennwerte.ts", "utf8");
  assert.match(q, /kultivarKennwerte\.upsert/);
  assert.match(q, /vertreiberKennwerte\.upsert/);
  assert.match(q, /if \(strain\.vertreiberId\)/);
});
