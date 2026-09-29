import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BlattNote, blattFuellungen, halbSchritt } from "@/components/review/BlattNote";
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
  const knopf = (html: string) => new RegExp(`<button[^>]*>${de.bewerten.noteEntfernen}</button>`).exec(html)?.[0] ?? "";
  assert.match(knopf(ohne), /\binvisible\b/);
  assert.doesNotMatch(knopf(mit), /\binvisible\b/);
  assert.match(knopf(mit), /type="button"/);
});

// Touch (pointer: coarse, Projektregel Touch-Ziele ≥ 44 px): ein Blatt ist ein Ziel für ganze Werte,
// halbe Schritte gehen über ein 44-px-Paar Minus/Plus. Maus und Tastatur bleiben wie gehabt.

function labels(html: string) {
  return [...html.matchAll(/<label class="([^"]*)"[^>]*><input[^>]*value="([^"]*)"/g)].map(([, klassen, wert]) => ({
    wert: Number(wert),
    klassen: klassen.split(/\s+/),
  }));
}

test("Halber Schritt: Plus und Minus in 0,5, begrenzt auf 0,5 bis 5; ohne Note beginnt Plus bei 0,5", () => {
  assert.equal(halbSchritt(3, 1), 3.5);
  assert.equal(halbSchritt(3, -1), 2.5);
  assert.equal(halbSchritt(5, 1), 5);
  assert.equal(halbSchritt(0.5, -1), 0.5);
  assert.equal(halbSchritt(null, 1), 0.5);
  assert.equal(halbSchritt(null, -1), null);
});

test("BlattNote auf Touch: das ganze Blatt ist ein Ziel, die halbe Hälfte nimmt keine Berührung an", () => {
  const liste = labels(renderToStaticMarkup(createElement(BlattNote, { start: null, texte: de.bewerten, sprache: "de" })));
  assert.equal(liste.length, 10);
  for (const { wert, klassen } of liste) {
    if (Number.isInteger(wert)) {
      assert.ok(klassen.includes("pointer-coarse:left-0") && klassen.includes("pointer-coarse:w-full"), `Blatt ${wert}`);
    } else {
      assert.ok(klassen.includes("pointer-coarse:pointer-events-none"), `Hälfte ${wert}`);
    }
  }
});

test("BlattNote auf Touch: Minus und Plus als 44-px-Knöpfe mit Namen, nur bei grobem Zeiger sichtbar", () => {
  const html = renderToStaticMarkup(createElement(BlattNote, { start: 3, texte: de.bewerten, sprache: "de" }));
  for (const name of [de.bewerten.halbWeniger, de.bewerten.halbMehr]) {
    const knopf = new RegExp(`<button[^>]*aria-label="${name}"[^>]*>`).exec(html)?.[0] ?? "";
    assert.match(knopf, /type="button"/, name);
    assert.match(knopf, /\bsize-11\b/, name);
    assert.match(knopf, /\bhidden\b/, name);
    assert.match(knopf, /\bpointer-coarse:inline-flex\b/, name);
  }
  // Der neue Wert nach Minus/Plus wird angesagt: eine stabile, anfangs leere Statuszeile.
  assert.match(html, /<span role="status" class="sr-only"><\/span>/);
});

test("BlattNote auf Touch: an den Grenzen sind Minus bzw. Plus als nicht verfügbar markiert", () => {
  const knopf = (start: number | null, name: string) =>
    new RegExp(`<button[^>]*aria-label="${name}"[^>]*>`).exec(
      renderToStaticMarkup(createElement(BlattNote, { start, texte: de.bewerten, sprache: "de" })),
    )?.[0] ?? "";
  assert.match(knopf(0.5, de.bewerten.halbWeniger), /aria-disabled="true"/);
  assert.match(knopf(null, de.bewerten.halbWeniger), /aria-disabled="true"/);
  assert.doesNotMatch(knopf(null, de.bewerten.halbMehr), /aria-disabled="true"/);
  assert.match(knopf(5, de.bewerten.halbMehr), /aria-disabled="true"/);
  assert.doesNotMatch(knopf(3, de.bewerten.halbWeniger), /aria-disabled="true"/);
});

test("BlattNote: der Hinweis nennt je Zeiger die passende Bedienung", () => {
  const html = renderToStaticMarkup(createElement(BlattNote, { start: null, texte: de.bewerten, sprache: "de" }));
  assert.match(html, new RegExp(`<span class="pointer-coarse:hidden">${de.bewerten.gesamtnoteHinweis}</span>`));
  assert.match(html, new RegExp(`<span class="hidden pointer-coarse:inline">${de.bewerten.gesamtnoteHinweisTouch}</span>`));
});
