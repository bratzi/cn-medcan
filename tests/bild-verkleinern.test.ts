import { test } from "node:test";
import assert from "node:assert/strict";

import { EINGABE_MAX_BYTES, eingabeDateiPruefen, qualitaetsStufen, zuschnitt } from "@/lib/bild-verkleinern";

test("zuschnitt nimmt aus einem Querformat die mittlere Quadratflaeche", () => {
  assert.deepEqual(zuschnitt(400, 200), { x: 100, y: 0, seite: 200 });
});

test("zuschnitt nimmt aus einem Hochformat die mittlere Quadratflaeche", () => {
  assert.deepEqual(zuschnitt(200, 500), { x: 0, y: 150, seite: 200 });
});

test("qualitaetsStufen faellt schrittweise und bleibt im Bereich", () => {
  const stufen = qualitaetsStufen();
  assert.ok(stufen.length >= 4);
  assert.equal(stufen[0] <= 0.9, true);
  for (let i = 1; i < stufen.length; i++) assert.ok(stufen[i] < stufen[i - 1]);
  assert.ok(stufen.every((s) => s > 0 && s <= 1));
});

test("eingabeDateiPruefen lehnt Nicht-Bilder, SVG und HEIC ab, bevor etwas dekodiert wird", () => {
  assert.equal(eingabeDateiPruefen({ type: "application/pdf", size: 1000 })?.schluessel, "bild.keinBild");
  assert.equal(eingabeDateiPruefen({ type: "image/svg+xml", size: 1000 })?.schluessel, "bild.keinBild");
  assert.equal(eingabeDateiPruefen({ type: "image/heic", size: 1000 })?.schluessel, "bild.format");
  assert.equal(eingabeDateiPruefen({ type: "image/heif", size: 1000 })?.schluessel, "bild.format");
  assert.equal(eingabeDateiPruefen({ type: "image/jpeg", size: EINGABE_MAX_BYTES + 1 })?.schluessel, "bild.eingabeGross");
  assert.equal(eingabeDateiPruefen({ type: "image/jpeg", size: 1000 }), null);
});
