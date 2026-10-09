import { test } from "node:test";
import assert from "node:assert/strict";

import { lesungsLage, netzAusVektor, vektorAenderung, zwischenVektor } from "@/lib/netz-vektor";

test("zwischenVektor: Anfang, Ende, Mitte", () => {
  assert.deepEqual(zwischenVektor([0, 1], [1, 0], 0), [0, 1]);
  assert.deepEqual(zwischenVektor([0, 1], [1, 0], 1), [1, 0]);
  assert.deepEqual(zwischenVektor([0, 1], [1, 0], 0.5), [0.5, 0.5]);
});

test("netzAusVektor: positiv in mag, negativ in magNicht, Skala 5", () => {
  assert.deepEqual(netzAusVektor([1, -0.5, 0]), { mag: [5, 0, 0], magNicht: [0, 2.5, 0] });
});

test("vektorAenderung: größte zuerst, unter 0,05 nicht", () => {
  assert.deepEqual(vektorAenderung([0, 0, 0], [0.5, -0.2, 0.01]), [{ index: 0, differenz: 0.5 }, { index: 1, differenz: -0.2 }]);
});

test("lesungsLage: erste Achse oben, rechte Hälfte rechts, linke links, gegenüber unten (10 Achsen)", () => {
  assert.equal(lesungsLage(0, 10).seite, "oben");
  assert.equal(lesungsLage(2, 10).seite, "rechts");
  assert.equal(lesungsLage(5, 10).seite, "unten");
  assert.equal(lesungsLage(8, 10).seite, "links");
});

test("lesungsLage: zu wenig Platz außen spiegelt nach innen (Review Focus 3)", () => {
  assert.equal(lesungsLage(2, 10, { links: 400, rechts: 40 }).seite, "links");
  assert.equal(lesungsLage(8, 10, { links: 40, rechts: 400 }).seite, "rechts");
});
