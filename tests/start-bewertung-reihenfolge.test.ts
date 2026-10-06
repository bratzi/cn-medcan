import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { NoteUndErkundung } from "@/components/review/NoteUndErkundung";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";

/** Startseiten-Vorführung wie `AromaSektion` sie baut, mit einem Marker statt des Sortenkopfs. */
function start(): string {
  return renderToStaticMarkup(
    createElement(
      KarteSofortKontext.Provider,
      { value: true },
      createElement(NoteUndErkundung, {
        modus: "example",
        blattTexte: de.bewerten,
        sprache: "de",
        titel: "Apples & Bananas (fiktiv)",
        bild: createElement("h3", null, "STRAINNAME-MARKER"),
        terpene: [{ name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.8, rang: 1 }],
        serien: [],
        zeilen: [],
        gesamteindruck: { werte: { aussehen: 2, geruch: 2, geschmack: 2, konsistenz: 2 }, anzahl: 2 },
        beschaffenheit: { werte: { chlorophyll: 1, trichomFarbe: 1 }, feuchte: 9, anzahl: 2 },
        texte: aromaTexte(de, "de"),
      }),
    ),
  );
}

test("Startseite: Strainname, dann Gesamtnote (Blätter), dann Overall, dann Terpz", () => {
  const html = start();
  const name = html.indexOf("STRAINNAME-MARKER");
  const note = html.indexOf('name="gesamtnote"');
  const overall = html.indexOf(`aria-label="Schritt 1: ${de.aroma.erkundung.overall}"`);
  const terpz = html.indexOf(`aria-label="Schritt 2: ${de.aroma.erkundung.terpz}"`);
  assert.ok(name >= 0 && note >= 0 && overall >= 0 && terpz >= 0, JSON.stringify({ name, note, overall, terpz }));
  assert.ok(name < note, "Strainname vor der Gesamtnote");
  assert.ok(note < overall, "Gesamtnote vor Overall");
  assert.ok(overall < terpz, "Overall vor Terpz");
  // Der Sortenkopf steht genau einmal da (nicht zusätzlich in der Erkundung).
  assert.equal(html.split("STRAINNAME-MARKER").length - 1, 1);
});

test("Bl�tenseite (Formular-Modus maske): gleiche Reihenfolge, Note vorbelegt, Sortenkopf einmal", () => {
  const html = renderToStaticMarkup(
    createElement(
      KarteSofortKontext.Provider,
      { value: true },
      createElement(NoteUndErkundung, {
        modus: "maske",
        noteStart: 4,
        blattTexte: de.bewerten,
        sprache: "de",
        titel: "Apples & Bananas",
        bild: createElement("h3", null, "STRAINNAME-MARKER"),
        terpene: [{ name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.8, rang: 1 }],
        serien: [],
        zeilen: [],
        gesamteindruck: { werte: { aussehen: 2, geruch: 2, geschmack: 2, konsistenz: 2 }, anzahl: 2 },
        beschaffenheit: { werte: { chlorophyll: 1, trichomFarbe: 1 }, feuchte: 9, anzahl: 2 },
        texte: aromaTexte(de, "de"),
      }),
    ),
  );
  const name = html.indexOf("STRAINNAME-MARKER");
  const note = html.indexOf('name="gesamtnote"');
  const overall = html.indexOf(`aria-label="Schritt 1: ${de.aroma.erkundung.overall}"`);
  const terpz = html.indexOf(`aria-label="Schritt 2: ${de.aroma.erkundung.terpz}"`);
  assert.ok(name >= 0 && note >= 0 && overall >= 0 && terpz >= 0, JSON.stringify({ name, note, overall, terpz }));
  assert.ok(name < note && note < overall && overall < terpz);
  assert.equal(html.split("STRAINNAME-MARKER").length - 1, 1);
});

test("Bewertungsformular nutzt den gemeinsamen Baustein statt BlattNote und Erkundung getrennt", () => {
  const quelle = readFileSync("components/review/BewertungsFormular.tsx", "utf8");
  assert.match(quelle, /<NoteUndErkundung\b/);
  assert.doesNotMatch(quelle, /<BlattNote\b/);
  assert.doesNotMatch(quelle, /<AromaErkundung\b/);
});
