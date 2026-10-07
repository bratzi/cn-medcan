import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { TerpenRangliste } from "@/components/profil/TerpenRangliste";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { de } from "@/lib/i18n/de";
import type { ProfilWerte } from "@/lib/profil-typen";

// Eigene Hilfe statt leereProfilWerte: lib/profil.ts entsteht parallel in Strang A.
const leer = (): ProfilWerte => ({
  geschmack: Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])) as ProfilWerte["geschmack"],
  terpene: [],
  anzahl: 0,
  gewichtet: 0,
});

const netz = (werte: ProfilWerte) =>
  renderToStaticMarkup(createElement(ProfilNetz, { werte, texte: de.profil, achsen: de.label.geschmack, sprache: "de" }));

test("ProfilNetz: ohne Bewertung leere Skizze und Knopf zur ersten Bewertung", () => {
  const html = netz(leer());
  assert.match(html, /Erste Bewertung abgeben/);
  assert.match(html, /href="\/blueten"/);
  assert.doesNotMatch(html, /data-netz="mag"/);
});

test("ProfilNetz: nur Mittelfeld erklärt, warum das Netz leer ist", () => {
  const html = netz({ ...leer(), anzahl: 2, gewichtet: 0 });
  assert.match(html, /Deine bisherigen liegen dazwischen/);
  assert.doesNotMatch(html, /Erste Bewertung abgeben/);
});

test("ProfilNetz: Fläche für mag ich, gestrichelt für mag ich nicht, vorläufig unter 3", () => {
  const werte = { ...leer(), anzahl: 2, gewichtet: 2 };
  werte.geschmack.ZITRUS = 1;
  werte.geschmack.HOLZIG = -0.6;
  const html = netz(werte);
  assert.match(html, /data-netz="mag"[^>]*fill-opacity="0.12"/);
  assert.match(html, /data-netz="mag-nicht"[^>]*stroke-dasharray="4 4"/);
  assert.match(html, /Vorläufig: 2 von 3 Bewertungen/);
  // Werte für Screenreader, das SVG selbst ist stumm.
  assert.match(html, /Zitrus: mag ich, 5 von 5/);
  assert.match(html, /Holzig: mag ich nicht, 3 von 5/);
  assert.match(html, /<svg[^>]*aria-hidden="true"/);
  // Legende mit Form, nicht nur Farbe.
  assert.match(html, /mag ich nicht/);
});

test("ProfilNetz: ab 3 gewichteten kein Vorläufig-Hinweis, ohne Ablehnung keine Strichlinie", () => {
  const werte = { ...leer(), anzahl: 5, gewichtet: 3 };
  werte.geschmack.SUESS = 0.5;
  const html = netz(werte);
  assert.doesNotMatch(html, /Vorläufig/);
  assert.doesNotMatch(html, /data-netz="mag-nicht"/);
});

test("TerpenRangliste: Balken nach Wert, Ablehnung abgesetzt unter „eher nicht“", () => {
  const html = renderToStaticMarkup(
    createElement(TerpenRangliste, {
      terpene: [
        { name: "Limonen", wert: 1 },
        { name: "Myrcen", wert: 0.5 },
        { name: "Humulen", wert: -0.4 },
      ],
      texte: de.profil,
      sprache: "de",
    }),
  );
  assert.match(html, /Limonen/);
  assert.match(html, /width:100%/);
  assert.match(html, /width:50%/);
  assert.match(html, /eher nicht/);
  assert.match(html, /width:40%/);
  assert.ok(html.indexOf("Myrcen") < html.indexOf("eher nicht"));
  assert.ok(html.indexOf("eher nicht") < html.indexOf("Humulen"));
});

test("TerpenRangliste: leer rendert nichts", () => {
  assert.equal(renderToStaticMarkup(createElement(TerpenRangliste, { terpene: [], texte: de.profil, sprache: "de" })), "");
});
