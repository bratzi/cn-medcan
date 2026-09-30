import { test } from "node:test";
import assert from "node:assert/strict";

import { fazitDelta, formatiereDelta } from "@/lib/fazit-delta";

test("fazitDelta: Differenz der angezeigten, gerundeten Prozentwerte", () => {
  assert.deepEqual(fazitDelta(0.734, 0.68), { punkte: 5, richtung: "hoch" });
  assert.deepEqual(fazitDelta(0.6, 0.724), { punkte: -12, richtung: "runter" });
  assert.deepEqual(fazitDelta(0.701, 0.699), { punkte: 0, richtung: "gleich" });
});

test("fazitDelta: ohne einen der beiden Werte kein Delta", () => {
  assert.equal(fazitDelta(null, 0.5), null);
  assert.equal(fazitDelta(0.5, null), null);
});

test("formatiereDelta: Vorzeichen immer sichtbar, Minus als Rechenzeichen", () => {
  assert.equal(formatiereDelta(5), "+5");
  assert.equal(formatiereDelta(-12), "−12");
  assert.equal(formatiereDelta(0), "±0");
  assert.equal(formatiereDelta(1234, "en"), "+1,234");
});
