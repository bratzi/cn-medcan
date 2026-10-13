import { test } from "node:test";
import assert from "node:assert/strict";

import { qualitaetAusBeschaffenheit, qualitaetsKennwerte } from "@/lib/qualitaet";
import { BESCHAFFENHEIT_ACHSEN } from "@/lib/query/bewertung";

test("Qualität: Sweet Spot in der Mitte ergibt 5, Frische zählt linear", () => {
  assert.equal(qualitaetAusBeschaffenheit({ chlorophyll: 2.5, budDichte: 2.5 }), 5);
  assert.equal(qualitaetAusBeschaffenheit({ chlorophyll: 0 }), 0);
  assert.equal(qualitaetAusBeschaffenheit({ frische: 5 }), 5);
  assert.equal(qualitaetAusBeschaffenheit({ frische: 2.5, chlorophyll: 2.5 }), 3.8);
});

test("Qualität: ohne Achse null, nicht 0 (Review Focus)", () => {
  assert.equal(qualitaetAusBeschaffenheit({}), null);
});

test("Kennwerte: Mittel nur über Bewertungen mit Qualität, Restfeuchte als Median", () => {
  const k = qualitaetsKennwerte([
    { beschaffenheit: { chlorophyll: 2.5 }, feuchtigkeitProzent: 10 },
    { beschaffenheit: { chlorophyll: 0 }, feuchtigkeitProzent: 12 },
    { beschaffenheit: {}, feuchtigkeitProzent: null },
  ]);
  assert.deepEqual(k, { qualitaetMittel: 2.5, achsenMittel: { chlorophyll: 1.25 }, restfeuchteMedian: 11, anzahl: 2 });
  assert.deepEqual(qualitaetsKennwerte([]), { qualitaetMittel: null, achsenMittel: {}, restfeuchteMedian: null, anzahl: 0 });
});

test("Achse Frische ohne Sweet Spot, die übrigen mit", () => {
  const frische = BESCHAFFENHEIT_ACHSEN.find((a) => a.key === "frische");
  assert.ok(frische);
  assert.equal(frische.sweetSpot, false);
  for (const a of BESCHAFFENHEIT_ACHSEN.filter((a) => a.key !== "frische")) assert.equal(a.sweetSpot, true, a.key);
});
