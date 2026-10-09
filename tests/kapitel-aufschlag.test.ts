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
  const leer = kapitelAus({ ...daten, seit: null, bewertet: 0, schnitt: null, netz: null, zuletzt: null, dritte: { art: "gestimmt", zahl: 2 } });
  const html = zeige("eigen", leer);
  assert.match(html, new RegExp(t.leerNetz));
  assert.match(html, /href="\/blueten"/);
  assert.match(html, new RegExp(t.ersteBewertung));
  assert.doesNotMatch(html, new RegExp(t.zuletzt));
  assert.doesNotMatch(html, new RegExp(t.zumKapitel));
});

test("Bewertet, aber ohne gespeichertes Netz: kein Satz von der ersten Bewertung (Minor Dein Kapitel)", () => {
  const html = zeige("eigen", { ...daten, netz: null });
  assert.doesNotMatch(html, new RegExp(t.leerNetz));
  assert.match(html, new RegExp(t.zumKapitel));
});

test("Zentrierte Säule mit Angaben zum Menschen: Rolle, dabei seit, Vorlieben (Nutzer 2026-10-09)", () => {
  const html = zeige("schaufenster", kapitelAus({ ...daten, seit: new Date("2026-09-23T10:00:00Z"), rolle: "betreiber", zuletzt: null }));
  assert.match(html, /text-center/);
  assert.match(html, new RegExp(t.betreiber));
  assert.match(html, /dabei seit 23\.09\.2026/);
  assert.match(html, /mag Zitrus/);
  // Das Netz steht vor den Zahlen: Blickfang in der Mitte.
  assert.ok(html.indexOf("data-netz-erscheinen") < html.indexOf(t.notizen));
});

test("Name bricht nicht mitten im Wort: Grad text-kapitel statt text-titel (live 2026-10-09, „GrünesBuc / h“ bei 1143 px)", () => {
  const html = zeige("eigen");
  const name = html.slice(html.lastIndexOf("<p", html.indexOf('data-story="kapitel-name"')), html.indexOf("GrünesBuch"));
  assert.match(name, /text-kapitel/);
  assert.doesNotMatch(name, /text-titel/);
});

test("Dein Kapitel steht direkt hinter Terpene und ihre Geschmäcker (Nutzer 2026-10-09: zu weit unten)", async () => {
  const { readFileSync } = await import("node:fs");
  const seite = readFileSync("app/[lang]/page.tsx", "utf8");
  assert.match(seite, /<TerpenRegister \/>\s*(\{\/\*[^]*?\*\/\}\s*)?<DeinKapitel \/>/);
  const start = readFileSync("components/story/bewegung/start.ts", "utf8");
  assert.match(start, /register,\n\s*kapitel,/);
});

test("Schaufenster für ein Mitglied ohne eigenes Kapitel: kein Konto anlegen (Minor Dein Kapitel)", () => {
  const html = renderToStaticMarkup(
    createElement(KapitelAufschlag, { daten, art: "schaufenster", texte: kapitelTexte(de), sprache: "de", mitglied: true }),
  );
  assert.doesNotMatch(html, /href="\/registrieren"/);
  assert.match(html, /href="\/profil"/);
  assert.match(html, new RegExp(t.zumKapitel));
});

test("Insel-Texte: nur was das Netz braucht, nicht das ganze Profil-Wörterbuch (Minor Dein Kapitel)", () => {
  const texte = kapitelTexte(de);
  assert.ok(Object.keys(texte.profil).length < Object.keys(de.profil).length);
  assert.equal(texte.profil.leer, de.profil.leer);
  assert.equal(texte.profilOeffentlich.magIch, de.profilOeffentlich.magIch);
});
