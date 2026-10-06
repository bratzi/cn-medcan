import { test } from "node:test";
import assert from "node:assert/strict";

import { aromaSerien, terpenWahlStaerken } from "@/components/review/aroma-serien";
import type { KartenTerpen } from "@/lib/aromakarte";
import { de } from "@/lib/i18n/de";
import { eintrag } from "./hilfen/eintrag";

const TERPENE: KartenTerpen[] = [
  { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.6, rang: 1 },
  { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: 0.4, rang: 2 },
];

test("Terpenwahl: ohne gespeicherte Wahl bleibt es beim bisherigen Bild", () => {
  assert.equal(terpenWahlStaerken(TERPENE, {}), undefined);
});

test("Terpenwahl: gewählte Terpene voll, die übrigen aus", () => {
  assert.deepEqual(terpenWahlStaerken(TERPENE, { Myrcen: 1, Limonen: 0 }), { Myrcen: 1, Limonen: 0 });
});

test("Terpenwahl: alte Stufen über 0 zählen als an, ein fehlendes Terpen als aus", () => {
  assert.deepEqual(terpenWahlStaerken(TERPENE, { Myrcen: 3 }), { Myrcen: 1, Limonen: 0 });
  assert.deepEqual(terpenWahlStaerken(TERPENE, { Myrcen: 5, Limonen: 1 }), { Myrcen: 1, Limonen: 1 });
});

test("Terpenwahl: eine Wahl ohne Treffer in der Sorte blendet alle Terpene der Sorte aus", () => {
  assert.deepEqual(terpenWahlStaerken(TERPENE, { Pinen: 1 }), { Myrcen: 0, Limonen: 0 });
});

test("aromaSerien: Herstellerserie nur mit Terpenangaben, die Bewertung immer in lila", () => {
  const mit = aromaSerien(eintrag({ terpene: TERPENE }), de);
  assert.deepEqual(mit.map((serie) => [serie.name, serie.ton]), [["Laut Hersteller", "gruen"], ["Diese Bewertung", "lila"]]);
  const ohne = aromaSerien(eintrag({ terpene: [] }), de);
  assert.deepEqual(ohne.map((serie) => [serie.name, serie.ton]), [["Diese Bewertung", "lila"]]);
});
