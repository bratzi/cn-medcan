import { test } from "node:test";
import assert from "node:assert/strict";

import {
  imGamut,
  kontrast,
  linearZuHex,
  oklchZuLinearSrgb,
  parseOklch,
  relativeLuminanz,
} from "../scripts/farben/oklch.mjs";

test("Weiß in OKLCH ergibt sRGB-Weiß", () => {
  for (const kanal of oklchZuLinearSrgb(1, 0, 0)) {
    assert.ok(Math.abs(kanal - 1) < 1e-4, `Kanal ${kanal}`);
  }
});

test("Kontrast Weiß auf Schwarz ist 21", () => {
  const weiss = relativeLuminanz([1, 1, 1]);
  const schwarz = relativeLuminanz([0, 0, 0]);
  assert.equal(Math.round(kontrast(weiss, schwarz) * 100) / 100, 21);
  assert.equal(kontrast(weiss, schwarz), kontrast(schwarz, weiss));
});

test("neutral-100 ergibt den Hexwert aus der Spec", () => {
  assert.equal(linearZuHex(oklchZuLinearSrgb(0.935, 0.006, 165)), "#e6ebe8");
  assert.equal(linearZuHex(oklchZuLinearSrgb(0.52, 0.2, 305)), "#853dc2");
});

test("Text auf Papier (hell) liegt bei 14.95 wie in der Spec gemessen", () => {
  const text = relativeLuminanz(oklchZuLinearSrgb(0.2, 0.009, 165));
  const papier = relativeLuminanz(oklchZuLinearSrgb(0.935, 0.006, 165));
  assert.ok(Math.abs(kontrast(text, papier) - 14.95) < 0.02);
});

test("stark gesättigtes Grün liegt außerhalb von sRGB", () => {
  assert.equal(imGamut(oklchZuLinearSrgb(0.7, 0.4, 150)), false);
  assert.equal(imGamut(oklchZuLinearSrgb(0.6, 0.115, 170)), true);
});

test("parseOklch liest Werte und lehnt anderes ab", () => {
  assert.deepEqual(parseOklch("oklch(0.99 0.003 165)"), [0.99, 0.003, 165]);
  assert.equal(parseOklch("rgb(1 2 3)"), null);
  assert.equal(parseOklch("var(--color-neutral-100)"), null);
});
