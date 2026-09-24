import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Seitenkopf, seitenRahmen, ABSCHNITT_TITEL } from "@/components/layout/Seitenkopf";
import { TitelblattSkelett } from "@/components/layout/Skelette";

test("Seitenkopf: genau ein h1 in Cormorant 300, Satz darunter, keine Oberzeile", () => {
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

test("Abschnittstitel in Cormorant 500", () => {
  assert.match(ABSCHNITT_TITEL, /font-buch text-h1 font-medium/);
});

test("Titelblatt-Skelett meldet sich als Status", () => {
  const html = renderToStaticMarkup(createElement(TitelblattSkelett));
  assert.match(html, /role="status"/);
  assert.match(html, /Produkt wird geladen/);
});
