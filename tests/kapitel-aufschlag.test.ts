import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KapitelAufschlag, kapitelTexte } from "@/components/kapitel-start/KapitelAufschlag";
import { de } from "@/lib/i18n/de";
import { kapitelAus } from "@/lib/kapitel-start";
import { leereProfilWerte } from "@/lib/profil";

const t = de.start.kapitel;
const daten = kapitelAus({
  anzeigename: "GrünesBuch",
  avatarId: null,
  bewertet: 5,
  schnitt: 4.4,
  dritte: { art: "vonEuch", zahl: 21 },
  netz: { ...leereProfilWerte(), geschmack: { ...leereProfilWerte().geschmack, ZITRUS: 1 }, anzahl: 5, gewichtet: 4 },
  zuletzt: { slug: "remexian", handelsname: "Remexian 30/1 PGF CIS", gesamtnote: 4.5, erstelltAm: new Date("2026-10-08T10:00:00Z") },
});
const zeige = (art: "schaufenster" | "eigen", d = daten) =>
  renderToStaticMarkup(createElement(KapitelAufschlag, { daten: d, art, texte: kapitelTexte(de), sprache: "de" }));

test("Schaufenster: Vermerk, Konto anlegen, eine Primäraktion", () => {
  const html = zeige("schaufenster");
  assert.match(html, new RegExp(t.vermerk));
  assert.match(html, /href="\/registrieren"/);
  assert.match(html, new RegExp(t.kontoAnlegen));
  assert.doesNotMatch(html, new RegExp(t.zumKapitel));
});

test("Eigenes Kapitel: kein Vermerk, Zu deinem Kapitel", () => {
  const html = zeige("eigen");
  assert.doesNotMatch(html, new RegExp(t.vermerk));
  assert.match(html, /href="\/profil"/);
  assert.match(html, new RegExp(t.zumKapitel));
});

test("Name gedruckt, umbrechend, mit Bewegungsziel", () => {
  const html = zeige("eigen");
  const name = html.slice(html.indexOf('data-story="kapitel-name"') - 200, html.indexOf("GrünesBuch") + 20);
  assert.doesNotMatch(name, /font-hand/);
  assert.match(name, /wrap-break-word/);
  assert.equal((html.match(/data-story="kapitel-wort"/g) ?? []).length, 3);
});

test("Zuletzt: Handelsname als Link, keine Wirkung", () => {
  const html = zeige("eigen");
  assert.match(html, /href="\/blueten\/remexian"/);
  assert.match(html, /Remexian 30\/1 PGF CIS/);
  assert.doesNotMatch(html, /Wirkung/);
});

test("Ohne Bewertung: Leer-Satz und Erste Bewertung statt Netz und Zuletzt", () => {
  const leer = kapitelAus({ ...daten, bewertet: 0, schnitt: null, netz: null, zuletzt: null, dritte: { art: "gestimmt", zahl: 2 } });
  const html = zeige("eigen", leer);
  assert.match(html, new RegExp(t.leerNetz));
  assert.match(html, /href="\/blueten"/);
  assert.match(html, new RegExp(t.ersteBewertung));
  assert.doesNotMatch(html, new RegExp(t.zuletzt));
  assert.doesNotMatch(html, new RegExp(t.zumKapitel));
});
