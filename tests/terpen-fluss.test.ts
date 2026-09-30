import { test } from "node:test";
import assert from "node:assert/strict";

import {
  flussStrich,
  imSweetSpot,
  reglerTerpene,
  sweetSpotStaerke,
  sweetSpotZone,
  SWEET_SPOT_FUNKEN,
  terpenEbenen,
  weitereOffen,
} from "@/lib/aromakarte";

/**
 * T5d (Nutzer 2026-09-30): ergänzte Terpene folgen allein dem Regler, die
 * animierte Linie wächst mit dem Wert. Seit der Sweet-Spot-Skala (Nutzer
 * 2026-09-30) sprühen Funken nur noch, wenn ein Geschmacksregler genau in der Mitte steht.
 */

test("Ergänzt folgt dem Regler: über 0 ergänzt, auf 0 zurück ein Geist", () => {
  const namen = ["Myrcen", "Ocimen"];
  assert.equal(terpenEbenen(namen, ["Myrcen"], { Ocimen: 1 }).Ocimen, "ergaenzt");
  assert.equal(terpenEbenen(namen, ["Myrcen"], { Ocimen: 0 }).Ocimen, "geist");
  assert.equal(terpenEbenen(namen, ["Myrcen"], {}).Ocimen, "geist");
});

test("Regler-Ordnung: Herstellerterpene zuerst in ihrer Reihenfolge, dann die übrigen alphabetisch", () => {
  assert.deepEqual(reglerTerpene(["Myrcen", "Limonen"], ["Terpinolen", "Limonen", "Caryophyllen", "Myrcen"]), {
    hersteller: ["Myrcen", "Limonen"],
    weitere: ["Caryophyllen", "Terpinolen"],
  });
});

test("Animierte Linie: kurz bei wenig, lang bei viel, bei Maximum durchgehend", () => {
  assert.deepEqual(flussStrich(0.5), { laenge: 6, durchgehend: false });
  assert.deepEqual(flussStrich(0), { laenge: 6, durchgehend: false });
  const mitte = flussStrich(2.5);
  assert.ok(mitte.laenge > 6 && mitte.laenge < 100);
  assert.ok(flussStrich(4.5).laenge > mitte.laenge);
  assert.deepEqual(flussStrich(5), { laenge: 100, durchgehend: true });
});

test("Sweet-Spot-Stärke: 0 ohne Wert, 5 genau in der Mitte, 0,5 an den Rändern, symmetrisch", () => {
  assert.equal(sweetSpotStaerke(0), 0);
  assert.equal(sweetSpotStaerke(0.05), 0);
  assert.equal(sweetSpotStaerke(2.5), 5);
  assert.equal(sweetSpotStaerke(5), 0.5);
  assert.equal(sweetSpotStaerke(1.25), 2.75);
  assert.equal(sweetSpotStaerke(3.75), 2.75);
  // Zu wenig und zu viel wiegen gleich: gleicher Abstand zur Mitte, gleiche Stärke.
  for (const abstand of [0.5, 1, 1.5, 2]) {
    assert.equal(sweetSpotStaerke(2.5 - abstand), sweetSpotStaerke(2.5 + abstand), `Abstand ${abstand}`);
  }
});

test("Im Sweet Spot: nur genau in der Mitte (Rundungsrauschen zählt mit), 2,4 nicht", () => {
  assert.equal(imSweetSpot(2.5), true);
  assert.equal(imSweetSpot(2.5000001), true);
  assert.equal(imSweetSpot(2.4), false);
  assert.equal(imSweetSpot(3), false);
  assert.equal(imSweetSpot(0), false);
});

test("Funken im Sweet Spot: sechs Stellen rund um den Griff, symmetrisch um 2,5", () => {
  assert.deepEqual(SWEET_SPOT_FUNKEN, [2.1, 2.25, 2.4, 2.6, 2.75, 2.9]);
  const summe = SWEET_SPOT_FUNKEN.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(summe / SWEET_SPOT_FUNKEN.length - 2.5) < 1e-9);
});

test("Zone der Sweet-Spot-Skala: unter 2,25 zu wenig, 2,25 bis 2,75 Sweet Spot, darüber zu viel", () => {
  assert.equal(sweetSpotZone(0), "wenig");
  assert.equal(sweetSpotZone(2.2), "wenig");
  assert.equal(sweetSpotZone(2.25), "mitte");
  assert.equal(sweetSpotZone(2.5), "mitte");
  assert.equal(sweetSpotZone(2.75), "mitte");
  assert.equal(sweetSpotZone(2.8), "viel");
  assert.equal(sweetSpotZone(5), "viel");
});

test("Weitere Terpene: öffnen sich mit einer Ergänzung und bleiben offen, wenn der Wert auf 0 zurückgeht", () => {
  assert.equal(weitereOffen(false, 0, 2), false);
  assert.equal(weitereOffen(false, 1, 2), true);
  // Zurück auf 0 bei geöffnetem Abschnitt: kein Zuklappen mitten im Ziehen.
  assert.equal(weitereOffen(true, 0, 2), true);
  // Ohne Herstellerterpene gibt es nur diese Regler: immer offen.
  assert.equal(weitereOffen(false, 0, 0), true);
});
