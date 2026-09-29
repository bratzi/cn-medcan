import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BlattNote, blattFuellungen } from "@/components/review/BlattNote";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

function radios(html: string) {
  return [...html.matchAll(/<input[^>]*type="radio"[^>]*>/g)].map(([tag]) => ({
    name: /name="([^"]*)"/.exec(tag)?.[1],
    wert: /value="([^"]*)"/.exec(tag)?.[1],
    gewaehlt: /\bchecked=""/.test(tag),
  }));
}

test("Blattfüllung: ganze, halbe und leere Blätter aus der Note", () => {
  assert.deepEqual(blattFuellungen(3.5), ["voll", "voll", "voll", "halb", "leer"]);
  assert.deepEqual(blattFuellungen(0.5), ["halb", "leer", "leer", "leer", "leer"]);
  assert.deepEqual(blattFuellungen(5), ["voll", "voll", "voll", "voll", "voll"]);
  assert.deepEqual(blattFuellungen(null), ["leer", "leer", "leer", "leer", "leer"]);
});

test("BlattNote: zehn Radios 0,5 bis 5 im Feld gesamtnote, Pfeiltasten gehen so nativ in halben Schritten", () => {
  const liste = radios(renderToStaticMarkup(createElement(BlattNote, { start: null, texte: de.bewerten, sprache: "de" })));
  assert.deepEqual(
    liste.map((radio) => radio.wert),
    ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"],
  );
  assert.ok(liste.every((radio) => radio.name === "gesamtnote"));
  assert.ok(liste.every((radio) => !radio.gewaehlt));
});

test("BlattNote: gespeicherte Note ist gewählt, der Wert steht für Screenreader als Text", () => {
  const html = renderToStaticMarkup(createElement(BlattNote, { start: 3.5, texte: de.bewerten, sprache: "de" }));
  assert.deepEqual(
    radios(html).filter((radio) => radio.gewaehlt).map((radio) => radio.wert),
    ["3.5"],
  );
  assert.match(html, /<span class="sr-only">3,5 von 5 Blättern<\/span>/);
  assert.match(renderToStaticMarkup(createElement(BlattNote, { start: 3.5, texte: en.bewerten, sprache: "en" })), /3\.5 of 5 leaves/);
});

test("BlattNote: Note entfernen nur sichtbar, wenn eine Note steht", () => {
  const ohne = renderToStaticMarkup(createElement(BlattNote, { start: null, texte: de.bewerten, sprache: "de" }));
  const mit = renderToStaticMarkup(createElement(BlattNote, { start: 2, texte: de.bewerten, sprache: "de" }));
  const knopf = (html: string) => /<button[^>]*>[^<]*<\/button>/.exec(html)?.[0] ?? "";
  assert.match(knopf(ohne), /\binvisible\b/);
  assert.doesNotMatch(knopf(mit), /\binvisible\b/);
  assert.match(knopf(mit), /type="button"/);
});
