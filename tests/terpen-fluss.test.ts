import { test } from "node:test";
import assert from "node:assert/strict";

import { flussStrich, funkenPunkte, reglerTerpene, terpenEbenen, weitereOffen } from "@/lib/aromakarte";

/**
 * T5d (Nutzer 2026-09-30): ergänzte Terpene folgen allein dem Regler, die
 * animierte Linie wächst mit dem Wert, der Überstand über dem Median sprüht Funken.
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

test("Funken: nur über dem Median, verteilt zwischen Median und Wert, ohne Median keine", () => {
  assert.deepEqual(funkenPunkte(4, null), []);
  assert.deepEqual(funkenPunkte(2, 3), []);
  assert.deepEqual(funkenPunkte(3.05, 3), []);
  const punkte = funkenPunkte(4, 2);
  assert.ok(punkte.length >= 2);
  for (const p of punkte) assert.ok(p > 2 && p < 4);
  // Mehr Überstand, mehr Funken, höchstens sechs.
  assert.ok(funkenPunkte(5, 0.5).length > funkenPunkte(3, 2.5).length);
  assert.ok(funkenPunkte(5, 0).length <= 6);
});

test("Weitere Terpene: öffnen sich mit einer Ergänzung und bleiben offen, wenn der Wert auf 0 zurückgeht", () => {
  assert.equal(weitereOffen(false, 0, 2), false);
  assert.equal(weitereOffen(false, 1, 2), true);
  // Zurück auf 0 bei geöffnetem Abschnitt: kein Zuklappen mitten im Ziehen.
  assert.equal(weitereOffen(true, 0, 2), true);
  // Ohne Herstellerterpene gibt es nur diese Regler: immer offen.
  assert.equal(weitereOffen(false, 0, 0), true);
});
