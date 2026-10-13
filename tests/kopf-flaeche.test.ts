import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { istStartseite } from "@/components/layout/KopfZustand";

test("istStartseite: nur / und die Sprachwurzel", () => {
  assert.equal(istStartseite("/"), true);
  assert.equal(istStartseite("/en"), true);
  assert.equal(istStartseite("/en/"), true);
  assert.equal(istStartseite("/profil"), false);
  assert.equal(istStartseite("/en/profil"), false);
});

test("Kopf: Fläche und Linie als Grundzustand, Durchsicht nur auf der Startseite oben", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const block = css.slice(css.indexOf(".kopf {"), css.indexOf(".kopf {") + 600);
  assert.match(block, /background:\s*var\(--color-surface-raised\)/);
  assert.match(block, /border-bottom:\s*1px solid var\(--color-border\)/);
  assert.match(css, /\.kopf\[data-start\]:not\(\[data-gescrollt\]\)/);
});

test("KopfZustand setzt data-start bei jedem Pfadwechsel neu (Review Focus)", () => {
  const q = readFileSync("components/layout/KopfZustand.tsx", "utf8");
  assert.match(q, /toggleAttribute\("data-start", istStartseite\(pfad\)\)/);
});
