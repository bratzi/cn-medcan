import { test } from "node:test";
import assert from "node:assert/strict";

import { rasten, tasteZuWert } from "@/lib/regler-raster";

const halb = { schritt: 0.5, max: 5, ziel: 2.37 };

test("rasten: ohne Ziel auf das Raster, in den Grenzen", () => {
  assert.equal(rasten(2.3, { schritt: 0.5, max: 5 }), 2.5);
  assert.equal(rasten(0.29, { schritt: 0.1, max: 5 }), 0.3);
  assert.equal(rasten(-1, { schritt: 1, max: 5 }), 0);
  assert.equal(rasten(9, { schritt: 1, max: 5 }), 5);
});

test("rasten: Community-Wert neben dem Raster ist mit dem Zeiger wieder erreichbar", () => {
  assert.equal(rasten(2.37, halb), 2.37);
  assert.equal(rasten(2.2, halb), 2.37);
  assert.equal(rasten(2.3, halb), 2.37);
  // Die Rasterstufen daneben bleiben erreichbar: näher am Raster gewinnt das Raster.
  assert.equal(rasten(2.5, halb), 2.5);
  assert.equal(rasten(2.45, halb), 2.5);
  assert.equal(rasten(2.0, halb), 2);
  assert.equal(rasten(1.9, halb), 2);
  // Feines Raster: der Nachbar 0,1 neben dem Ziel bleibt treffbar.
  assert.equal(rasten(2.4, { schritt: 0.1, max: 5, ziel: 2.37 }), 2.4);
  assert.equal(rasten(2.36, { schritt: 0.1, max: 5, ziel: 2.37 }), 2.37);
});

test("tasteZuWert: Pfeile landen auf dem Community-Wert zwischen zwei Stufen", () => {
  assert.equal(tasteZuWert("ArrowRight", 2, halb), 2.37);
  assert.equal(tasteZuWert("ArrowUp", 2.37, halb), 2.5);
  assert.equal(tasteZuWert("ArrowLeft", 2.5, halb), 2.37);
  assert.equal(tasteZuWert("ArrowDown", 2.37, halb), 2);
  assert.equal(tasteZuWert("ArrowRight", 2.5, halb), 3);
  assert.equal(tasteZuWert("ArrowLeft", 0, halb), 0);
  assert.equal(tasteZuWert("ArrowRight", 5, halb), 5);
});

test("tasteZuWert: ohne Ziel Rasterstufen, Pos1/Ende an die Grenzen, sonst null", () => {
  assert.equal(tasteZuWert("ArrowRight", 0.2, { schritt: 0.1, max: 5 }), 0.3);
  assert.equal(tasteZuWert("ArrowLeft", 0.3, { schritt: 0.1, max: 5 }), 0.2);
  assert.equal(tasteZuWert("ArrowRight", 2.37, { schritt: 1, max: 5 }), 3);
  assert.equal(tasteZuWert("Home", 3, { schritt: 1, max: 5 }), 0);
  assert.equal(tasteZuWert("End", 3, { schritt: 1, max: 5 }), 5);
  assert.equal(tasteZuWert("Tab", 3, { schritt: 1, max: 5 }), null);
});
