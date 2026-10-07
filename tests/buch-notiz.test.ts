import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BILD_PLATZ, BuchNotiz, notizZeilen } from "@/components/review/BuchNotiz";

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

test("notizZeilen ohne Bild wie bisher: passt ganz = 0, sonst Zeilen über dem Knopf", () => {
  assert.equal(notizZeilen(300, 200, false), 0);
  assert.equal(notizZeilen(300, 600, false), Math.floor((300 - 44) / 28));
  assert.equal(notizZeilen(40, 600, false), 1);
});

test("notizZeilen mit Bild: 192 px Bild und 16 px Abstand gehen ab, der Text endet früher", () => {
  assert.equal(BILD_PLATZ, 208);
  assert.equal(notizZeilen(500, 200, true), 0);
  assert.equal(notizZeilen(500, 300, true), Math.floor((500 - 208 - 44) / 28));
  assert.equal(notizZeilen(220, 600, true), 1);
});

test("Bewertungstext mit Bild: Bildfeld in derselben Fläche, ab lg absolut, mindestens 192 px", () => {
  const html = renderToStaticMarkup(
    createElement(BuchNotiz, { text: "Kurz.", weiterlesen: "Weiterlesen", schliessen: "Schließen", bild: createElement("figure", { id: "f" }) }),
  );
  assert.match(html, /<div [^>]*class="[^"]*\brelative\b[^"]*\bmt-2\b[^"]*\blg:min-h-48\b[^"]*\blg:flex-1\b[^"]*"><div class="lg:absolute lg:inset-0"><figure id="f">/);
});

test("Bewertungstext: Bild nur ab lg, wenn es ein Ersatzbild ist", () => {
  const html = renderToStaticMarkup(
    createElement(BuchNotiz, { text: "Kurz.", weiterlesen: "W", schliessen: "S", bild: createElement("figure"), bildNurGross: true }),
  );
  assert.match(html, /\bmax-lg:hidden\b/);
});
