import { test } from "node:test";
import assert from "node:assert/strict";

import { chargenFazit, sortenFazit } from "@/lib/fazit";

test("Sortenfazit: Mittel aus Overall (1..5), Terpen-Treue (0..1) und Gesamtnote (0,5..5)", () => {
  // Overall 5/5 -> 1, Treue 0.5, Gesamtnote 2,75 (Mitte der Skala) -> 0.5 => (1 + 0.5 + 0.5) / 3
  const wert = sortenFazit({ eindruck: { aussehen: 5, geruch: 5 }, treue: 0.5, gesamtnote: 2.75 });
  assert.equal(wert, 2 / 3);
});

test("Sortenfazit: Ränder der Skalen sind 0 % bzw. 100 %, fehlende Stufen fallen heraus", () => {
  assert.equal(sortenFazit({ eindruck: { aussehen: 1 }, treue: null, gesamtnote: null }), 0);
  assert.equal(sortenFazit({ eindruck: {}, treue: 0.8, gesamtnote: null }), 0.8);
  assert.equal(sortenFazit({ eindruck: {}, treue: null, gesamtnote: 0.5 }), 0);
  assert.equal(sortenFazit({ eindruck: {}, treue: null, gesamtnote: 5 }), 1);
});

test("Sortenfazit: ohne jede Stufe null, nie 0 oder NaN vortäuschen", () => {
  assert.equal(sortenFazit({ eindruck: {}, treue: null, gesamtnote: null }), null);
});

test("Sortenfazit: nimmt keinen Beschaffenheits-Parameter an, die Charge fließt nie ein", () => {
  const wert = sortenFazit({ eindruck: { aussehen: 5 }, treue: 1, gesamtnote: 5 });
  assert.equal(wert, 1);
});

test("Chargenfazit: Sweet Spot in der Mitte der Skala, nicht „mehr ist besser“", () => {
  assert.equal(chargenFazit({ chlorophyll: 2.5 }), 1);
  assert.equal(chargenFazit({ chlorophyll: 0 }), 0);
  assert.equal(chargenFazit({ chlorophyll: 5 }), 0);
  // Zwei Achsen, je ihr eigener Sweet-Spot-Wert, gleich gewichtet gemittelt.
  assert.equal(chargenFazit({ chlorophyll: 2.5, budDichte: 0 }), 0.5);
});

test("Chargenfazit: ohne Werte null, nie 0 oder NaN vortäuschen", () => {
  assert.equal(chargenFazit({}), null);
});
