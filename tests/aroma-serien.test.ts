import { test } from "node:test";
import assert from "node:assert/strict";

import { aromaSerien, buchKarte, terpenWahlStaerken } from "@/components/review/aroma-serien";
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

const KATALOG = [
  { name: "Limonen", geschmack: "ZITRUS" as const },
  { name: "Myrcen", geschmack: "ERDIG" as const },
  { name: "Pinen", geschmack: "HOLZIG" as const },
  { name: "Linalool", geschmack: "BLUMIG" as const },
];

test("Buchkarte: ergänzte Terpene der Bewertung stehen in der Karte, gestrichelt als ergänzt", () => {
  // Live 2026-10-06 (RS11, Betreiber): im Buch fehlten die selbst ergänzten Terpene.
  const karte = buchKarte(TERPENE, KATALOG, { Myrcen: 1, Pinen: 1 });
  assert.deepEqual(karte.terpene.map((terpen) => terpen.name), ["Myrcen", "Limonen", "Pinen"]);
  assert.deepEqual(karte.ebenen, { Myrcen: "hersteller", Limonen: "hersteller", Pinen: "ergaenzt" });
  assert.equal(karte.staerken?.Myrcen, 1);
  assert.equal(karte.staerken?.Limonen, 0);
  assert.ok((karte.staerken?.Pinen ?? 0) > 0);
});

test("Buchkarte: ohne Ergänzung bleibt die Karte wie bisher, ohne Ebenen", () => {
  const karte = buchKarte(TERPENE, KATALOG, { Myrcen: 1 });
  assert.deepEqual(karte.terpene, TERPENE);
  assert.equal(karte.ebenen, undefined);
  assert.deepEqual(karte.staerken, { Myrcen: 1, Limonen: 0 });
});
