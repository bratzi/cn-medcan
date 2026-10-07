import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { NetzVerlauf } from "@/components/profil/NetzVerlauf";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { de } from "@/lib/i18n/de";
import type { Geschmack, ProfilWerte, VerlaufSchritt } from "@/lib/profil-typen";

const g = (teil: Partial<Geschmack> = {}): Geschmack =>
  ({ ...Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])), ...teil }) as Geschmack;
const werte = (geschmack: Geschmack): ProfilWerte => ({ geschmack, terpene: [], anzahl: 4, gewichtet: 4 });
const netz = (p: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(ProfilNetz, { werte: werte(g({ FRUCHTIG: 1 })), texte: de.profil, achsen: de.label.geschmack, sprache: "de", ...p }));

test("ProfilNetz: Kontur vorher mit Legende und Änderungszeile", () => {
  const html = netz({ vorher: g({ FRUCHTIG: 0.5 }), aenderung: "Mit deiner Bewertung vom 02.10.2026: Fruchtig stärker." });
  assert.match(html, /data-netz="vorher"/);
  assert.match(html, /vor der letzten Bewertung/);
  assert.match(html, /Fruchtig stärker\./);
});

test("ProfilNetz: ohne vorher keine Kontur und keine Legende dafür (öffentliches Profil, erste Bewertung)", () => {
  const html = netz({});
  assert.doesNotMatch(html, /data-netz="vorher"/);
  assert.doesNotMatch(html, /vor der letzten Bewertung/);
});

const schritt = (anzahl: number, teil: Partial<Geschmack>): VerlaufSchritt => ({
  anzahl,
  datum: new Date(Date.UTC(2026, 8, anzahl)).toISOString(),
  geschmack: g(teil),
});
const verlauf = (schritte: VerlaufSchritt[]) =>
  renderToStaticMarkup(createElement(NetzVerlauf, { schritte, texte: de.profil, achsen: de.label.geschmack, sprache: "de" }));

test("NetzVerlauf: unter zwei Schritten nur der Hinweis", () => {
  assert.match(verlauf([schritt(1, { FRUCHTIG: 1 })]), /Ab zwei Bewertungen/);
  assert.match(verlauf([]), /Ab zwei Bewertungen/);
});

test("NetzVerlauf: Regler über alle Schritte, Start beim neuesten, Beschriftung mit Datum", () => {
  const html = verlauf([schritt(1, { FRUCHTIG: 1 }), schritt(2, { FRUCHTIG: 1, ERDIG: -0.5 }), schritt(3, { ZITRUS: 1 })]);
  assert.match(html, /type="range"/);
  assert.match(html, /min="0"/);
  assert.match(html, /max="2"/);
  assert.match(html, /value="2"/);
  assert.match(html, /Nach 3 von 3 Bewertungen · 03\.09\.2026/);
  assert.match(html, /aria-valuetext="Nach 3 von 3 Bewertungen · 03\.09\.2026\. Mit deiner/);
});

test("NetzVerlauf: Änderung zum vorigen Schritt steht als Text und im aria-valuetext", () => {
  const html = verlauf([schritt(1, { FRUCHTIG: 0.4 }), schritt(2, { FRUCHTIG: 1, ERDIG: -0.5 })]);
  assert.match(html, /aria-valuetext="Nach 2 von 2 Bewertungen · 02\.09\.2026\. Mit deiner Bewertung vom 02\.09\.2026: Fruchtig stärker, Erdig schwächer./);
  assert.match(html, /<p[^>]*>Mit deiner Bewertung vom 02\.09\.2026: /);
});

test("NetzVerlauf: bleibt das Netz gleich, sagt der Text das; der erste Schritt hat keine Änderung", () => {
  const html = verlauf([schritt(1, { FRUCHTIG: 1 }), schritt(2, { FRUCHTIG: 1 })]);
  assert.match(html, /Mit deiner Bewertung vom 02\.09\.2026 blieb dein Netz gleich\./);
  const erster = renderToStaticMarkup(
    createElement(NetzVerlauf, { schritte: [schritt(1, { FRUCHTIG: 1 }), schritt(2, { ZITRUS: 1 })], texte: de.profil, achsen: de.label.geschmack, sprache: "de" }),
  );
  assert.doesNotMatch(erster, /blieb dein Netz gleich/);
});

test("NetzVerlauf: Legende mit Form für Fläche, Strich und dünne Kontur", () => {
  const html = verlauf([schritt(1, { FRUCHTIG: 1 }), schritt(2, { FRUCHTIG: 1, ERDIG: -0.5 })]);
  assert.match(html, />mag ich</);
  assert.match(html, />mag ich nicht</);
  assert.match(html, />vor der letzten Bewertung</);
  assert.match(html, /stroke-dasharray="4 4"/);
});
