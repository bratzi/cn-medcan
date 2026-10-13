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
  const start = css.indexOf(".kopf {");
  const block = css.slice(start, css.indexOf("\n}", start));
  assert.match(block, /background:\s*var\(--color-surface-raised\)/);
  assert.match(block, /border-bottom:\s*1px solid var\(--color-border\)/);
  assert.match(css, /\.kopf\[data-start\]:not\(\[data-gescrollt\]\)/);
});

test("Kopf: Durchsicht über dem Hero braucht kein JS (:has auf die Auftakt-Bühne)", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const oben = css.indexOf(':root:has([data-story="auftakt"]) .kopf:not([data-gescrollt])');
  assert.ok(oben > 0);
  const regel = css.slice(oben, css.indexOf("\n}", oben));
  assert.match(regel, /background:\s*transparent/);
  assert.match(regel, /box-shadow:\s*none/);
  assert.match(css, /:root:has\(\[data-story="auftakt"\]\) \.kopf\[data-gescrollt\]/);
  assert.match(css, /:root\[data-theme="light"\]:has\(\[data-story="auftakt"\]\) \.kopf/);
  assert.match(css, /:root:not\(\[data-theme="dark"\]\):has\(\[data-story="auftakt"\]\) \.kopf/);
});

test("KopfZustand setzt data-start bei jedem Pfadwechsel neu (Review Focus)", () => {
  const q = readFileSync("components/layout/KopfZustand.tsx", "utf8");
  assert.match(q, /toggleAttribute\("data-start", istStartseite\(pfad\)\)/);
});
