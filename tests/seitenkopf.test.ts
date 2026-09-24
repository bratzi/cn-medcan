import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Seitenkopf, seitenRahmen, ABSCHNITT_TITEL } from "@/components/layout/Seitenkopf";

test("Seitenkopf: genau ein h1 in Newsreader 200, Satz darunter, keine Oberzeile", () => {
  const html = renderToStaticMarkup(createElement(Seitenkopf, { titel: "Bewertungen", satz: "Ein Satz." }));
  assert.equal(html.match(/<h1/g)?.length, 1);
  assert.match(html, /font-buch text-kapitel font-light/);
  assert.match(html, /Ein Satz\./);
  assert.doesNotMatch(html, /uppercase/);
});

test("Seitenkopf: Rückweg als Textlink über dem Titel", () => {
  const html = renderToStaticMarkup(
    createElement(Seitenkopf, { titel: "X", zurueck: { href: "/produkte", text: "Alle Produkte" } }),
  );
  assert.match(html, /href="\/produkte"/);
  assert.ok(html.indexOf("Alle Produkte") < html.indexOf("<h1"));
});

test("Seitenrahmen: breit 1440, schmal 480 px", () => {
  assert.match(seitenRahmen(), /\bmax-w-360\b/);
  assert.match(seitenRahmen(true), /\bmax-w-120\b/);
});

test("Abschnittstitel in Newsreader 500", () => {
  assert.match(ABSCHNITT_TITEL, /font-buch text-h1 font-medium/);
});

test("Seitenkopf: Rückweg ist 44 px hoch", () => {
  const html = renderToStaticMarkup(
    createElement(Seitenkopf, { titel: "X", zurueck: { href: "/produkte", text: "Alle Produkte" } }),
  );
  assert.match(html, /<a[^>]*class="[^"]*min-h-11[^"]*"[^>]*>Alle Produkte</);
});
