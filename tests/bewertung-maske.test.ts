import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AromaErkundung } from "@/components/review/AromaErkundung";
import { bewertungPruefen } from "@/lib/bewertung-eingabe";
import { vorbelegungAus } from "@/lib/bewertung-vorbelegung";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";
import type { KartenTerpen } from "@/lib/aromakarte";

const TERPENE: KartenTerpen[] = [
  { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.8, rang: 1 },
  { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: 0.4, rang: 2 },
];

const VORBELEGUNG = vorbelegungAus({
  aussehen: 4,
  geruch: 5,
  geschmack: 3,
  wirkung: 2,
  konsistenz: 1,
  gesamtnote: 4.5,
  feuchtigkeitProzent: 11.2,
  geschmacksMatrix: JSON.stringify({ zitrus: 3, fruchtig: 1.5, suess: 0, blumig: 0, kraeutrig: 2, minzig: 0.5, holzig: 0, wuerzig: 1, erdig: 4, diesel: 0 }),
  terpenIntensitaet: JSON.stringify({ Myrcen: 2, Limonen: 5 }),
  beschaffenheit: JSON.stringify({ chlorophyll: 2.5, trichomFarbe: 4 }),
  notiz: null,
  instagramReelUrl: null,
  charge: null,
  aktualisiertAm: new Date("2026-09-29T10:00:00.000Z"),
});

function maske(vorbelegung = VORBELEGUNG) {
  return renderToStaticMarkup(
    createElement(AromaErkundung, {
      titel: "Nebelharz 22 (fiktiv)",
      terpene: TERPENE,
      // Community-Mittel weichen bewusst von der eigenen Bewertung ab.
      serien: [],
      zeilen: [{ terpen: "Myrcen", wert: 3, anzahl: 2 }],
      gesamteindruck: { werte: { aussehen: 2, geruch: 2, geschmack: 2, konsistenz: 2 }, anzahl: 2 },
      beschaffenheit: { werte: { chlorophyll: 1, trichomFarbe: 1 }, feuchte: 9, anzahl: 2 },
      eingabe: true,
      vorbelegung,
      texte: aromaTexte(de, "de"),
    }),
  );
}

/** Die versteckten Felder der Maske, so wie das Formular sie abschickt. */
function felder(html: string): Map<string, string> {
  const aus = new Map<string, string>();
  for (const [tag] of html.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = /name="([^"]*)"/.exec(tag)?.[1];
    const wert = /value="([^"]*)"/.exec(tag)?.[1];
    if (name && wert !== undefined) aus.set(name, wert);
  }
  return aus;
}

test("Maske: die gespeicherte Bewertung kommt unverändert wieder beim Server an (upsert überschreibt sie)", () => {
  const formular = felder(maske());
  formular.set("strainId", "sorte-1");
  const geprueft = bewertungPruefen(formular, ["Myrcen", "Limonen"]);
  assert.ok(geprueft.ok, JSON.stringify(geprueft));
  assert.deepEqual(geprueft.wert.noten, VORBELEGUNG.noten);
  assert.deepEqual(geprueft.wert.geschmacksMatrix, VORBELEGUNG.geschmack);
  assert.deepEqual(geprueft.wert.terpenIntensitaet, VORBELEGUNG.intensitaet);
  assert.deepEqual(geprueft.wert.beschaffenheit, { chlorophyll: 2.5, trichomFarbe: 4 });
  assert.equal(geprueft.wert.feuchtigkeitProzent, 11.2);
});

test("Maske: mit Vorbelegung steht „Dein Fazit“ sofort, Zurücksetzen erst nach einer Änderung", () => {
  const html = maske();
  assert.match(html, new RegExp(de.aroma.erkundung.deinFazit));
  assert.doesNotMatch(html, new RegExp(`>${de.aroma.erkundung.zuruecksetzen}<`));
});

test("Maske: der Qualitätsschritt heißt „Diese Charge“ und zeigt den Sweet Spot in der Mitte", () => {
  const html = maske();
  assert.match(html, /aria-label="Schritt 3: Diese Charge"/);
  assert.match(html, new RegExp(de.aroma.erkundung.chargeSatz));
  // Je Beschaffenheitsachse eine Mittenmarke „Sweet Spot“ unter der Skala (nur Schritt 3 zählt,
  // Schritt 2 trägt den Sweet Spot der Terpene in der Überschrift).
  const schritt3 = html.slice(html.indexOf('aria-label="Schritt 3'));
  assert.equal(schritt3.match(/>Sweet Spot</g)?.length, 4);
});

test("Anzeige ohne Eingabe bleibt „Qualität“ ohne Chargen-Satz", () => {
  const html = renderToStaticMarkup(
    createElement(AromaErkundung, {
      titel: "Nebelharz 22 (fiktiv)",
      terpene: TERPENE,
      serien: [],
      zeilen: [],
      beschaffenheit: { werte: { chlorophyll: 1 }, feuchte: null, anzahl: 1 },
      texte: aromaTexte(de, "de"),
    }),
  );
  assert.match(html, /aria-label="Schritt 3: Qualität"/);
  assert.doesNotMatch(html, new RegExp(de.aroma.erkundung.chargeSatz));
});
