import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BewertungsBuch } from "@/components/review/BewertungsBuch";
import type { ReviewEintrag } from "@/lib/query/strains";
import { de } from "@/lib/i18n/de";

const PRODUKT = { handelsname: "Nebelharz 22 (fiktiv)", slug: "nebelharz-22", terpene: [], bildPfad: null };

function bewertung(id: string, istRedaktionell: boolean, tag: number, note = 4, notiz: string | null = null): ReviewEintrag {
  return {
    id,
    istRedaktionell,
    autorName: istRedaktionell ? "Waldi" : `Mitglied ${id}`,
    gesamtnote: 3.5,
    aussehen: note,
    geruch: note,
    geschmack: note,
    wirkung: note,
    konsistenz: note,
    feuchtigkeitProzent: null,
    geschmacksMatrix: null,
    terpenIntensitaet: null,
    beschaffenheit: null,
    notiz,
    instagramReelUrl: null,
    chargenNr: null,
    erstelltAm: new Date(Date.UTC(2026, 8, tag, 12)),
  };
}

const zeige = (reviews: ReviewEintrag[]) =>
  renderToStaticMarkup(createElement(BewertungsBuch, { reviews, produkt: PRODUKT, w: de, sprache: "de" }));

/** Die Artikel-Ids in der Reihenfolge des Dokuments. */
const reihenfolge = (html: string) => [...html.matchAll(/<article id="eintrag-([^"]+)"/g)].map((m) => m[1]);

test("Eine Doppelseite für alle: Betreiber zuerst, dann die Community, je neueste zuerst", () => {
  const html = zeige([bewertung("c-alt", false, 2), bewertung("b", true, 1), bewertung("c-neu", false, 9)]);
  assert.deepEqual(reihenfolge(html), ["b", "c-neu", "c-alt"]);
  // Jede Seite ist eine Doppelseite im vollen Umfang (fünf Noten).
  assert.equal(html.match(/<dt/g)?.length, 15);
});

test("Nur die erste Seite ist aufgeschlagen, die übrigen liegen gestapelt im DOM", () => {
  const html = zeige([bewertung("b", true, 1), bewertung("c1", false, 2), bewertung("c2", false, 3)]);
  const seiten = [...html.matchAll(/<div class="buch-seite"([^>]*)>/g)].map((m) => m[1]);
  assert.equal(seiten.length, 3);
  assert.match(seiten[0], /data-aktiv=""/);
  assert.doesNotMatch(seiten[1] + seiten[2], /data-aktiv/);
});

test("Blättern: Knöpfe mit Namen, Seite x von n als Ansage, am Anfang geht es nicht zurück", () => {
  const html = zeige([bewertung("b", true, 1), bewertung("c1", false, 2), bewertung("c2", false, 3)]);
  assert.match(html, /<button type="button" aria-label="Vorherige Seite" aria-disabled="true"/);
  assert.match(html, /<button type="button" aria-label="Nächste Seite"(?! aria-disabled)/);
  assert.match(html, /aria-live="polite"[^>]*>Seite 1 von 3</);
  // Das Buch nimmt den Fokus für die Pfeiltasten und nennt sich.
  assert.match(html, /role="group" aria-label="Bewertungen zu Nebelharz 22 \(fiktiv\)"[^>]*tabindex="0"/i);
  assert.match(html, /Mit den Pfeiltasten links und rechts blätterst du um\./);
});

test("Knöpfe und Play/Pause haben 44 px Trefferfläche", () => {
  const html = zeige([bewertung("b", true, 1), bewertung("c1", false, 2)]);
  const knoepfe = [...html.matchAll(/<button type="button" aria-label="(Vorherige|Nächste) Seite"[^>]*class="([^"]*)"/g)];
  assert.equal(knoepfe.length, 2);
  for (const [, , klassen] of knoepfe) assert.match(klassen, /\bsize-11\b/);
});

test("Genau eine Bewertung: kein Blättern, kein Play-Knopf, keine Klickziele", () => {
  const html = zeige([bewertung("b", true, 1, 4, "Einzige Seite.")]);
  assert.match(html, /Einzige Seite\./);
  assert.doesNotMatch(html, /buch-steuerung|loop-schalter|Nächste Seite|Vorherige Seite|Seite 1 von 1/);
  // Die Bühne ohne Rolle, Fokus und Klickziel (die Karte darin hat eigene Tabstopps).
  assert.match(html, /<div class="buch-stapel"><div class="buch-seite" data-aktiv="">/);
  assert.doesNotMatch(html, /data-blaettern|role="group"/);
});

test("Community-Mittel über dem Buch, als ganzer Satz in Einzahl und Mehrzahl", () => {
  const eine = zeige([bewertung("b", true, 1, 5), bewertung("c1", false, 2, 3)]);
  assert.match(eine, /Community aus einer Bewertung: <span class="numeric">3,0<\/span> von 5/);
  const zwei = zeige([bewertung("c1", false, 2, 3), bewertung("c2", false, 3, 4)]);
  assert.match(zwei, /Community im Mittel aus 2 Bewertungen: <span class="numeric">3,5<\/span> von 5/);
  assert.match(zwei, /<h2[^>]*id="bewertungen-titel"[^>]*>Bewertungen<\/h2>/);
});

test("Ohne Community-Bewertung: kein Mittel, keine 0 und kein NaN, dafür der Weg zur ersten", () => {
  const html = zeige([bewertung("b", true, 1)]);
  assert.doesNotMatch(html, /im Mittel|aus einer Bewertung|NaN/);
  assert.match(html, /noch keine Bewertung aus der Community/);
  assert.match(html, /href="#bewerten"[^>]*>Erste Bewertung abgeben</);
});

test("Ganz ohne Bewertung: nur Überschrift, Hinweis und Weg zur ersten, kein Buch", () => {
  const html = zeige([]);
  assert.match(html, />Bewertungen<\/h2>/);
  assert.match(html, /href="#bewerten"/);
  assert.doesNotMatch(html, /<article|buch-stapel/);
});

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

test("Ohne JavaScript stehen alle Seiten untereinander und die Knöpfe fehlen; mit Skript liegen sie gestapelt", () => {
  const ohne = /@media \(scripting: none\)\s*\{([\s\S]*?)\n\}/.exec(css);
  assert.ok(ohne, "Block @media (scripting: none) fehlt");
  assert.match(ohne[1], /\.buch-steuerung\s*\{\s*display:\s*none;/);
  const mit = /@media \(scripting: enabled\)\s*\{([\s\S]*?)\n\}/.exec(css);
  assert.ok(mit, "Block @media (scripting: enabled) fehlt");
  assert.match(mit[1], /\.buch-stapel > \.buch-seite\s*\{\s*grid-area:\s*1 \/ 1;/);
  assert.match(mit[1], /\.buch-stapel > \.buch-seite:not\(\[data-aktiv\], \[data-geht\]\)\s*\{\s*visibility:\s*hidden;/);
});

test("CPU-Budget: die teure Aroma-Karte rendert der Server nur für die offene Seite und ihre Nachbarn", () => {
  const html = zeige([1, 2, 3, 4, 5].map((tag) => bewertung(`c${tag}`, false, tag)));
  // Alle fünf Seiten mit Text und Werten, Karten nur auf Seite 1, 2 und 5 (Nachbar über das Ende).
  assert.equal(html.match(/<article /g)?.length, 5);
  assert.equal(html.match(/<dt/g)?.length, 25);
  const seiten = html.split('<div class="buch-seite"').slice(1);
  assert.deepEqual(
    seiten.map((seite) => seite.includes("<figure")),
    [true, true, false, false, true],
  );
});
