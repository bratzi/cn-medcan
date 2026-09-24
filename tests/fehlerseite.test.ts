import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import Fehler from "@/app/error";

test("Fehlerseite: Titel, Ausweg, Knopf und Rückweg", () => {
  const html = renderToStaticMarkup(createElement(Fehler, { error: new Error("x"), retry: () => {} }));
  assert.match(html, /<h1[^>]*>Diese Seite lässt sich gerade nicht laden\.<\/h1>/);
  assert.match(html, /Versuch es gleich noch einmal\. Klappt es nicht, lade die Seite in ein paar Minuten neu\./);
  assert.match(html, />Erneut versuchen</);
  assert.match(html, /href="\/"[^>]*>Zur Startseite</);
});
