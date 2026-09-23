import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Badge } from "@/components/ui/Badge";
import { buttonKlassen } from "@/components/ui/Button";

test("Buttons sind Pillen", () => {
  for (const variante of ["primary", "secondary", "ghost"] as const) {
    assert.match(buttonKlassen(variante), /\brounded-full\b/);
  }
});

test("Hover über Farbe statt Deckkraft", () => {
  assert.match(buttonKlassen("primary"), /\bhover:bg-accent-hover\b/);
  for (const variante of ["primary", "secondary", "ghost"] as const) {
    assert.doesNotMatch(buttonKlassen(variante), /hover:opacity/);
  }
});

test("Touch-Ziel md bleibt 44 px hoch", () => {
  assert.match(buttonKlassen("primary", "md"), /\bh-11\b/);
});

test("Sekundärbutton behält seinen sichtbaren Rahmen", () => {
  // border-transparent aus der Basis schlägt im CSS border-border-strong.
  assert.match(buttonKlassen("secondary"), /\bborder-border-strong\b/);
  assert.doesNotMatch(buttonKlassen("secondary"), /\bborder-transparent\b/);
});

test("Badge bricht als Pille nicht um", () => {
  const html = renderToStaticMarkup(createElement(Badge, null, "1 Apotheke"));
  assert.match(html, /\brounded-full\b/);
  assert.match(html, /\bwhitespace-nowrap\b/);
});
