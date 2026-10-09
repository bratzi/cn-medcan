import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { bluetenKreis, vollFarbe } from "@/lib/aroma-farben";
import { de } from "@/lib/i18n/de";
import type { Geschmack, ProfilWerte, VerlaufSchritt } from "@/lib/profil-typen";

const g = (teil: Partial<Geschmack> = {}): Geschmack =>
  ({ ...Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])), ...teil }) as Geschmack;
const werte = (geschmack: Geschmack): ProfilWerte => ({ geschmack, terpene: [], anzahl: 4, gewichtet: 4 });
const schritt = (anzahl: number, teil: Partial<Geschmack>): VerlaufSchritt => ({
  anzahl,
  datum: new Date(Date.UTC(2026, 8, anzahl)).toISOString(),
  geschmack: g(teil),
});
const netz = (verlauf: VerlaufSchritt[], geschmack = g({ FRUCHTIG: 1 })) =>
  renderToStaticMarkup(createElement(ProfilNetz, { werte: werte(geschmack), texte: de.profil, achsen: de.label.geschmack, sprache: "de", verlauf }));

test("Aroma-Netz: ohne Verlauf keine Zeitleiste und keine Kontur (öffentliches Profil, erste Bewertung)", () => {
  const html = netz([]);
  assert.doesNotMatch(html, /type="range"/);
  assert.doesNotMatch(html, /data-netz="vorher"/);
  assert.doesNotMatch(html, /vor der letzten Bewertung/);
  assert.match(html, /data-netz="bluete"/);
});

test("Aroma-Netz: Zeitleiste über alle Schritte im selben Netz, Start beim neuesten, Kontur vom vorigen", () => {
  const html = netz([schritt(1, { FRUCHTIG: 1 }), schritt(2, { FRUCHTIG: 1, ERDIG: -0.5 }), schritt(3, { ZITRUS: 1 })], g({ ZITRUS: 1 }));
  assert.match(html, /type="range"/);
  assert.match(html, /max="2"/);
  assert.match(html, /value="2"/);
  assert.match(html, /Nach 3 von 3 Bewertungen · 03\.09\.2026/);
  assert.match(html, /data-netz="vorher"/);
  assert.match(html, />vor der letzten Bewertung</);
  assert.match(html, /aria-label="Verlauf abspielen"/);
  // Ein Punkt je Bewertung auf der Zeitleiste.
  assert.equal(html.match(/netz-zeitleiste-punkt absolute/g)?.length, 3);
});

test("Aroma-Netz: Änderung zum vorigen Schritt als Text und im aria-valuetext", () => {
  const html = netz([schritt(1, { FRUCHTIG: 0.4 }), schritt(2, { FRUCHTIG: 1, ERDIG: -0.5 })]);
  assert.match(html, /aria-valuetext="Nach 2 von 2 Bewertungen · 02\.09\.2026\. Mit deiner Bewertung vom 02\.09\.2026: Fruchtig stärker, Erdig schwächer./);
  assert.match(html, /<p[^>]*>Mit deiner Bewertung vom 02\.09\.2026: /);
  const gleich = netz([schritt(1, { FRUCHTIG: 1 }), schritt(2, { FRUCHTIG: 1 })]);
  assert.match(gleich, /blieb dein Netz gleich\./);
});

test("Aroma-Netz: Achsen als Icon-Knöpfe mit Satz für Screenreader statt Schrift (Nutzer 2026-10-09)", () => {
  const html = netz([], g({ ZITRUS: 1, HOLZIG: -0.6 }));
  assert.equal(html.match(/<button[^>]*class="netz-marke/g)?.length, 10);
  assert.match(html, /aria-label="Zitrus: mag ich, 5 von 5"/);
  assert.match(html, /aria-label="Holzig: mag ich nicht, 3 von 5"/);
  assert.match(html, /aria-label="Minzig: neutral"/);
  // Keine sichtbaren Achsennamen mehr neben dem Netz.
  assert.doesNotMatch(html, /text-caption whitespace-nowrap/);
});

test("Aroma-Blüte: Farbkreis in Achsenreihenfolge ab oben, Volltonfarbe auch für Verläufe", () => {
  const kreis = bluetenKreis(["ZITRUS", "FRUCHTIG", "SUESS", "BLUMIG"]);
  assert.match(kreis, /^conic-gradient\(from 0deg at 50% 50%, #f2d129 0deg, #ff4d4d 90deg, #ff5fa8 180deg, #c77dff 270deg, #f2d129 360deg\)$/);
  assert.equal(vollFarbe("BLUMIG"), "#c77dff");
  assert.equal(vollFarbe("DIESEL"), "#9aa1a8");
});

test("Aroma-Netz: Morph per Bild-Takt, reduzierte Bewegung springt, Abspielen hält am Ende", () => {
  const quelle = readFileSync("components/profil/AromaNetz.tsx", "utf8");
  assert.match(quelle, /requestAnimationFrame/);
  assert.match(quelle, /prefers-reduced-motion: reduce/);
  assert.match(quelle, /index >= letzter/);
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /\.netz-lesung \{[^]*?@starting-style \{\s*opacity: 0;/);
});

test("Aroma-Netz: Server ruft keine Funktion aus der Client-Datei auf (live 2026-10-09, /profil brach)", () => {
  const client = readFileSync("components/profil/AromaNetz.tsx", "utf8");
  assert.match(client, /^"use client";/);
  assert.doesNotMatch(client, /export function aromaNetzTexte/);
  assert.match(readFileSync("components/profil/ProfilNetz.tsx", "utf8"), /from "@\/lib\/aroma-netz-texte"/);
});
