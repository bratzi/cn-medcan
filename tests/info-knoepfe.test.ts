import "./server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AromaErkundung } from "@/components/review/AromaErkundung";
import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { BewertungsBilder } from "@/components/review/BewertungsBilder";
import { budpicMeldungen } from "@/lib/budpic-anzeige";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";

/** Spec 2026-10-21, 1: lange Erklärtexte stehen in der Blase eines Info-Knopfs, nicht als Absatz. */
function nurImKnopf(html: string, text: string) {
  const anfang = text.slice(0, 18).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(html, new RegExp(`role="tooltip"[^>]*>[^<]*${anfang}`), `„${anfang}“ fehlt in der Blase`);
  assert.doesNotMatch(html, new RegExp(`<p[^>]*>${anfang}`), `„${anfang}“ steht noch als Absatz`);
}

const erkundung = (modus: "maske" | undefined) =>
  renderToStaticMarkup(
    createElement(
      KarteSofortKontext.Provider,
      { value: true },
      createElement(AromaErkundung, {
        titel: "Nebelharz 22 (fiktiv)",
        terpene: [
          { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.8, rang: 1 },
          { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: 0.4, rang: 2 },
        ],
        serien: [],
        zeilen: [{ terpen: "Myrcen", wert: 3, anzahl: 2 }],
        gesamteindruck: { werte: { aussehen: 2, geruch: 2, geschmack: 2, konsistenz: 2 }, anzahl: 2 },
        gesamtnoteMedian: 3,
        modus,
        texte: aromaTexte(de, "de"),
      }),
    ),
  );

test("Erkundung: Anleitung, Vorbelegung und Score-Erklärung hinter Info-Knöpfen", () => {
  const maske = erkundung("maske");
  nurImKnopf(maske, de.aroma.erkundung.anleitung);
  nurImKnopf(maske, de.aroma.erkundung.voraktiv);
  nurImKnopf(maske, de.aroma.erkundung.fazitErklaerung);
  // Gäste: „Hier wird nichts gespeichert“ bleibt sichtbar, es trägt die Bedienung.
  assert.match(erkundung(undefined), new RegExp(`<p[^>]*>${de.aroma.erkundung.nichtsGespeichert}`));
});

test("Bilder: der lange Verkleinerungs-Hinweis steht im Info-Knopf an der Überschrift", () => {
  const html = renderToStaticMarkup(
    createElement(BewertungsBilder, {
      vorhanden: [],
      vorgemerkt: [],
      setVorgemerkt: () => {},
      onBeschaeftigt: () => {},
      istBetreiber: false,
      gesperrt: false,
      meldungen: budpicMeldungen(de),
      texte: de.bewerten,
      onGeaendert: () => {},
    }),
  );
  nurImKnopf(html, de.bewerten.bilderHinweis);
  assert.match(html, /aria-expanded="false"/);
});
