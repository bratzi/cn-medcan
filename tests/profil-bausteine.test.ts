import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { CommunityVergleich } from "@/components/profil/CommunityVergleich";
import { NetzGrafik } from "@/components/profil/NetzGrafik";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { Schnitte } from "@/components/profil/Schnitte";
import { TopFlop } from "@/components/profil/TopFlop";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { de } from "@/lib/i18n/de";
import type { ProfilWerte } from "@/lib/profil-typen";
import { leeresTerpenNetz } from "@/lib/terpen-achsen";

// Eigene Hilfe statt leereProfilWerte: lib/profil.ts entsteht parallel in Strang A.
const leer = (): ProfilWerte => ({
  geschmack: Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])) as ProfilWerte["geschmack"],
  terpenNetz: leeresTerpenNetz(),
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

test("TopFlop: Noten mit Komma, Links zur Blüte, ohne Flop der Hinweis", () => {
  const html = renderToStaticMarkup(
    createElement(TopFlop, { top: [{ slug: "a", handelsname: "Alpha", note: 4.5 }], flop: [], texte: de.profil, sprache: "de" }),
  );
  assert.match(html, /href="\/blueten\/a"/);
  assert.match(html, /4,5 von 5/);
  assert.match(html, /Ab vier Bewertungen/);
});

test("CommunityVergleich: strenger bei negativer Differenz, Betrag ohne Minus", () => {
  const html = renderToStaticMarkup(
    createElement(CommunityVergleich, {
      daten: { differenz: -0.4, vergleichbar: 2, abweichungen: [{ slug: "a", handelsname: "Alpha", eigene: 3, community: 4.5 }] },
      texte: de.profil,
      sprache: "de",
    }),
  );
  assert.match(html, /im Schnitt 0,4 strenger/);
  assert.match(html, /du 3,0/);
  assert.match(html, /Community 4,5/);
});

test("CommunityVergleich: milder, gleich und leer", () => {
  const r = (differenz: number | null) =>
    renderToStaticMarkup(createElement(CommunityVergleich, { daten: { differenz, vergleichbar: differenz === null ? 1 : 2, abweichungen: [] }, texte: de.profil, sprache: "de" }));
  assert.match(r(0.3), /0,3 milder/);
  assert.match(r(0), /wie die Community/);
  assert.match(r(null), /Sobald zwei deiner Sorten/);
});

test("Schnitte: sechs Werte mit Beschriftung aus dem Schema, Wirkung privat dabei", () => {
  const html = renderToStaticMarkup(
    createElement(Schnitte, {
      daten: { aussehen: 4, geruch: 3.5, geschmack: 4.2, wirkung: 3.8, konsistenz: 4.1, gesamt: 3.9 },
      texte: de.profil,
      noten: de.schema.noten,
      sprache: "de",
    }),
  );
  for (const wort of ["Aussehen", "Geruch", "Geschmack", "Wirkung", "Konsistenz", "Gesamt", "3,9", "4,2"]) assert.match(html, new RegExp(wort));
});

test("EmpfehlungsListe: Marke als Badge nur, wo gesetzt", () => {
  const html = renderToStaticMarkup(
    createElement(EmpfehlungsListe, {
      eintraege: [
        { slug: "a", handelsname: "Alpha", begruendung: "" },
        { slug: "b", handelsname: "Beta", begruendung: "", marke: "noch nicht bestätigt" },
      ],
    }),
  );
  assert.equal(html.match(/noch nicht bestätigt/g)?.length, 1);
  assert.ok(html.indexOf("Beta") < html.indexOf("noch nicht bestätigt"));
});

test("NetzGrafik: Kontur vorher dünn ohne Fläche, ohne Kontur kein data-netz=vorher", () => {
  const null10 = Array(10).fill(0);
  const eins = [5, ...Array(9).fill(0)];
  const mit = renderToStaticMarkup(createElement(NetzGrafik, { mag: eins, magNicht: null10, kontur: [3, ...Array(9).fill(0)] }));
  assert.match(mit, /data-netz="vorher"[^>]*fill="none"[^>]*stroke-opacity="0.45"/);
  const ohne = renderToStaticMarkup(createElement(NetzGrafik, { mag: eins, magNicht: null10 }));
  assert.doesNotMatch(ohne, /data-netz="vorher"/);
  // Ohne Beschriftung keine Achsennamen (Mini-Netz).
  assert.doesNotMatch(ohne, /<span/);
});

