import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BudpicDiashow } from "@/components/produkt/BudpicDiashow";
import { alsBuchBilder, alsDiashow, budpicMeldungen } from "@/lib/budpic-anzeige";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

const TAG = new Date("2026-09-12T12:00:00Z");
const liste = [
  { id: "3f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc", nutzer: "Kim", erstelltAm: TAG, breite: 1280, hoehe: 960 },
  { id: "4f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc", nutzer: "Lu", erstelltAm: TAG, breite: 800, hoehe: 800 },
];

test("alsDiashow nennt Nutzer und Datum im Tooltip", () => {
  const b = alsDiashow(liste, de, "de");
  assert.equal(b[0].beschriftung, "Von Kim, 12.09.2026");
  assert.equal(b[1].id, liste[1].id);
});

test("Diashow: erstes Bild sichtbar, weitere ausgeblendet, Tooltip, kein Timer im Server-Markup", () => {
  const html = renderToStaticMarkup(createElement(BudpicDiashow, { bilder: alsDiashow(liste, de, "de"), name: "Nebel", texte: de.budpic }));
  assert.match(html, /title="Von Kim, 12\.09\.2026"/);
  assert.match(html, /opacity-100/);
  assert.equal((html.match(/opacity-0/g) ?? []).length, 1);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /Diashow anhalten/);
});

test("Diashow mit einem Bild hat keine Knoepfe", () => {
  const html = renderToStaticMarkup(createElement(BudpicDiashow, { bilder: alsDiashow(liste.slice(0, 1), de, "de"), name: "Nebel", texte: de.budpic }));
  assert.doesNotMatch(html, /<button/);
});

test("Wörterbücher: budpic in de und en gleich aufgebaut, Meldungen vorhanden", () => {
  assert.deepEqual(Object.keys(de.budpic).sort(), Object.keys(en.budpic).sort());
  assert.equal(de.budpic.muster, "Musterbild");
  for (const w of [de, en]) {
    const m = budpicMeldungen(w);
    for (const k of ["bild.keinBild", "bild.format", "budpic.nurFreigeschaltet", "budpic.fehlgeschlagen"]) assert.ok(m[k], k);
  }
});

test("Server-Aktionen: Upload verlangt Freigabe, Admin-Aktionen den Betreiber, beide pruefen serverseitig", () => {
  const up = readFileSync("app/[lang]/blueten/[slug]/budpic-aktionen.ts", "utf8");
  assert.match(up, /freigabeErforderlich\(\)/);
  assert.match(up, /bildPruefen\(/);
  assert.doesNotMatch(up, /\$transaction/);
  const ad = readFileSync("app/[lang]/admin/budpic-aktionen.ts", "utf8");
  assert.match(ad, /adminErforderlich\(\)/);
});

test("Route liefert nur freigegebene Budpics oeffentlich", () => {
  const r = readFileSync("app/api/bild/[id]/route.ts", "utf8");
  assert.match(r, /status: "FREIGEGEBEN"/);
  const o = readFileSync("app/api/bild/offen/[id]/route.ts", "utf8");
  assert.match(o, /ADMIN/);
  assert.match(o, /no-store/);
});

test("Migration 0012 legt budpics mit Statuspruefung an", () => {
  const m = readFileSync("migrations/0012_budpics.sql", "utf8");
  assert.match(m, /CREATE TABLE "budpics"/);
  assert.match(m, /CHECK \("status" IN \('OFFEN', 'FREIGEGEBEN', 'ABGELEHNT'\)\)/);
});

test("Diashow rendert nur aktuelles, naechstes und (zum Ueberblenden) vorheriges Bild", () => {
  const vier = Array.from({ length: 4 }, (_, i) => ({ ...liste[0], id: `${i}f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc` }));
  const html = renderToStaticMarkup(createElement(BudpicDiashow, { bilder: alsDiashow(vier, de, "de"), name: "Nebel", texte: de.budpic }));
  assert.equal((html.match(/<img/g) ?? []).length, 3);
  assert.doesNotMatch(html, /2f2b8c1e/);
});

test("Ablehnen leert den BLOB, Freigegebene lassen sich in /admin zurueckziehen und loeschen", () => {
  const ad = readFileSync("app/[lang]/admin/budpic-aktionen.ts", "utf8");
  assert.match(ad, /status: was, daten: new Uint8Array\(0\)/);
  assert.match(ad, /budpic\.delete/);
  const seite = readFileSync("app/[lang]/admin/page.tsx", "utf8");
  assert.match(seite, /<BudpicListe status="FREIGEGEBEN"/);
  assert.match(readFileSync("components/admin/BudpicFreigabe.tsx", "utf8"), /budpicLoeschen/);
});

test("alsBuchBilder: nur das Datum, der Name steht schon im Kopf der Seite", () => {
  const bilder = alsBuchBilder([{ id: liste[0].id, breite: 1280, hoehe: 960, erstelltAm: TAG }], "de");
  assert.deepEqual(bilder, [{ id: liste[0].id, breite: 1280, hoehe: 960, beschriftung: "12.09.2026" }]);
  assert.deepEqual(alsBuchBilder([], "en"), []);
});
