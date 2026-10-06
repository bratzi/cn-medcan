import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BuchNotiz } from "@/components/review/BuchNotiz";

const zeige = (text: string) => renderToStaticMarkup(createElement(BuchNotiz, { text, weiterlesen: "Weiterlesen", schliessen: "Schließen" }));

test("Bewertungstext: größer gesetzt, im Lesemaß, ab sm in der Schrift der Überschrift ohne Fettung", () => {
  const html = zeige("Sehr dichte Blüten.");
  assert.match(html, /<p [^>]*class="[^"]*\bmax-w-\[52ch\][^"]*\btext-body\b[^"]*\bsm:text-h3\b[^"]*\bsm:font-normal\b/);
});

test("Bewertungstext: nimmt den Rest der Seite, ohne die Höhe der Zeile zu bestimmen", () => {
  const html = zeige("Sehr dichte Blüten.");
  assert.match(html, /<div [^>]*class="[^"]*\blg:min-h-0\b[^"]*\blg:flex-\[1_1_0px\]/);
  assert.doesNotMatch(html, /\blg:flex-1\b/);
});

test("Bewertungstext: wird mit der Seite eingeblendet", () => {
  assert.match(zeige("Text."), /data-eintritt="auf" style="--i:2"/);
});

test("Bewertungstext: ab lg erst sechs Zeilen, gemessen wird mit der Zeilenhöhe von text-h3", () => {
  assert.match(zeige("Sehr dichte Blüten. ".repeat(20)), /\blg:line-clamp-6\b/);
  const quelle = readFileSync(join(process.cwd(), "components/review/BuchNotiz.tsx"), "utf8");
  assert.match(quelle, /const ZEILE = 28;/);
});
