import { test } from "node:test";
import assert from "node:assert/strict";

import { alsPolygon, istLeereMatrix, netzPunkte } from "@/lib/netz";

test("vier volle Achsen liegen oben, rechts, unten, links", () => {
  assert.deepEqual(netzPunkte([5, 5, 5, 5], 5, 10, 10), [
    { x: 10, y: 0 },
    { x: 20, y: 10 },
    { x: 10, y: 20 },
    { x: 0, y: 10 },
  ]);
});

test("Werte werden auf 0 bis max begrenzt", () => {
  assert.deepEqual(netzPunkte([0, 9, -3, 2.5], 5, 10, 10), [
    { x: 10, y: 10 },
    { x: 20, y: 10 },
    { x: 10, y: 10 },
    { x: 5, y: 10 },
  ]);
});

test("Polygon-Schreibweise für SVG", () => {
  assert.equal(alsPolygon([{ x: 1, y: 2 }, { x: 3.5, y: 4 }]), "1,2 3.5,4");
});

test("eine Matrix aus Nullen gilt als leer", () => {
  assert.equal(istLeereMatrix([0, 0, 0, 0, 0, 0, 0, 0]), true);
  assert.equal(istLeereMatrix([0, 0, 0.5, 0, 0, 0, 0, 0]), false);
});
