import { test } from "node:test";
import assert from "node:assert/strict";

import { terpenTaste, terpenZeiger, TERPEN_STUFEN_MAX } from "@/lib/regler-raster";

// Die echte Kette: Regler rechnet, AromaErkundung rundet auf ganze Stufen (Server Action).
const gespeichert = (wert: number) => Math.round(wert);

test("Pfeil rechts von 0 geht auf 1, Pfeil links von 1 auf 0", () => {
  assert.equal(gespeichert(terpenTaste("ArrowRight", 0)!), 1);
  assert.equal(gespeichert(terpenTaste("ArrowLeft", 1)!), 0);
  assert.equal(gespeichert(terpenTaste("ArrowUp", 2)!), 3);
  assert.equal(gespeichert(terpenTaste("ArrowDown", 2)!), 1);
});

test("Pfeile laufen durch alle Stufen 0 bis 5, Grenzen bleiben", () => {
  let wert = 0;
  for (let i = 1; i <= 5; i++) {
    wert = gespeichert(terpenTaste("ArrowRight", wert)!);
    assert.equal(wert, i);
  }
  assert.equal(terpenTaste("ArrowRight", 5), 5);
  assert.equal(terpenTaste("ArrowLeft", 0), 0);
});

test("Pos1 ist 0, Ende ist 5, PageUp/PageDown bewegen, andere Tasten null", () => {
  assert.equal(terpenTaste("Home", 3), 0);
  assert.equal(terpenTaste("End", 3), TERPEN_STUFEN_MAX);
  assert.equal(terpenTaste("PageUp", 1), 2);
  assert.equal(terpenTaste("PageDown", 1), 0);
  assert.equal(terpenTaste("Tab", 1), null);
});

test("Median 2,37 erzeugt keinen festen Punkt", () => {
  // Der Ring bleibt Anzeige; Tasten und Zeiger gehen nur über ganze Stufen.
  assert.equal(gespeichert(terpenTaste("ArrowRight", 2)!), 3);
  assert.equal(gespeichert(terpenTaste("ArrowLeft", 3)!), 2);
  assert.equal(gespeichert(terpenTaste("ArrowRight", 1)!), 2);
  for (const roh of [2.2, 2.3, 2.37, 2.45]) assert.equal(terpenZeiger(roh), 2);
});

test("Zeiger: ganze Stufen in den Grenzen", () => {
  assert.equal(terpenZeiger(0.4), 0);
  assert.equal(terpenZeiger(0.6), 1);
  assert.equal(terpenZeiger(-2), 0);
  assert.equal(terpenZeiger(9), 5);
});
