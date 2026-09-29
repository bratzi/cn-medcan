import { test } from "node:test";
import assert from "node:assert/strict";

import {
  abweichungZurCommunity,
  gesamtnoteGueltig,
  median,
  qualitaetsScore,
  sortenKennwerte,
} from "@/lib/bewertung-v2";

test("median: ungerade, gerade, leer", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([]), null);
});

test("gesamtnote: 0,5 bis 5 in halben Schritten", () => {
  assert.equal(gesamtnoteGueltig(0.5), true);
  assert.equal(gesamtnoteGueltig(4.5), true);
  assert.equal(gesamtnoteGueltig(0), false);
  assert.equal(gesamtnoteGueltig(5.5), false);
  assert.equal(gesamtnoteGueltig(3.3), false);
});

test("qualitaetsScore: Sweet Spot in der Mitte der Skala 0-5", () => {
  assert.equal(qualitaetsScore(2.5), 1);
  assert.equal(qualitaetsScore(0), 0);
  assert.equal(qualitaetsScore(5), 0);
  assert.equal(qualitaetsScore(3.75), 0.5);
});

test("abweichung: mittlere |Δ| nur über gemeinsame Terpene, ergänzte extra", () => {
  const ergebnis = abweichungZurCommunity(
    { Myrcen: 4, Limonen: 2, Linalool: 3 },
    { Myrcen: 3, Limonen: 3 },
    ["Myrcen", "Limonen"],
  );
  assert.equal(ergebnis.mittlereAbweichung, 1);
  assert.deepEqual(ergebnis.ergaenzt, ["Linalool"]);
});

test("abweichung: ohne gemeinsame Terpene null", () => {
  const ergebnis = abweichungZurCommunity({ Linalool: 3 }, {}, []);
  assert.equal(ergebnis.mittlereAbweichung, null);
  assert.deepEqual(ergebnis.ergaenzt, ["Linalool"]);
});

test("sortenKennwerte: Mediane, Gesamtnote-Mittel ohne NULL, Anzahl", () => {
  const k = sortenKennwerte([
    { gesamtnote: 4, terpene: { Myrcen: 3 }, geschmack: { erdig: 2 } },
    { gesamtnote: null, terpene: { Myrcen: 5, Limonen: 1 }, geschmack: { erdig: 4 } },
    { gesamtnote: 3, terpene: {}, geschmack: { erdig: 3 } },
  ]);
  assert.deepEqual(k.terpenMedian, { Myrcen: 4, Limonen: 1 });
  assert.deepEqual(k.geschmackMedian, { erdig: 3 });
  assert.equal(k.gesamtnoteMedian, 3.5);
  assert.equal(k.gesamtnoteMittel, 3.5);
  assert.equal(k.anzahl, 3);
});
