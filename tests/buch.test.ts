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

const zeige = (reviews: ReviewEintrag[], kennwerte: { gesamtnoteMedian: number | null; anzahl: number } | null = null) =>
  renderToStaticMarkup(createElement(BewertungsBuch, { reviews, kennwerte, produkt: PRODUKT, w: de, sprache: "de" }));

/** Die Artikel-Ids in der Reihenfolge des Dokuments. */
const reihenfolge = (html: string) => [...html.matchAll(/<article id="eintrag-([^"]+)"/g)].map((m) => m[1]);

test("Eine Doppelseite für alle: Betreiber zuerst, dann die Community, je neueste zuerst", () => {
  const html = zeige([bewertung("c-alt", false, 2), bewertung("b", true, 1), bewertung("c-neu", false, 9)]);
  assert.deepEqual(reihenfolge(html), ["b", "c-neu", "c-alt"]);
  // Jede Seite ist eine Doppelseite im vollen Umfang: fünf Noten (einmal, rechts) plus Datum und Charge im Kolophon.
  assert.equal(html.match(/<dt/g)?.length, 21);
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

test("Über dem Buch der gespeicherte Median aller Bewertungen, nicht ein Mittel der Achsen", () => {
  // Achsen 5 und 3, Gesamtnote je 3,5: das Buch zeigt den Kennwert, keinen eigenen Durchschnitt.
  const eine = zeige([bewertung("c1", false, 2, 5)], { gesamtnoteMedian: 3.5, anzahl: 1 });
  assert.match(eine, /Median aus einer Bewertung: <span class="numeric">3,5<\/span> von 5/);
  const zwei = zeige([bewertung("b", true, 1, 5), bewertung("c1", false, 2, 3)], { gesamtnoteMedian: 4, anzahl: 2 });
  assert.match(zwei, /Median aller 2 Bewertungen: <span class="numeric">4,0<\/span> von 5/);
  assert.match(zwei, /<h2[^>]*id="bewertungen-titel"[^>]*>Bewertungen<\/h2>/);
});

test("Ohne Kennwert steht kein Wert über dem Buch (nie 0 oder NaN)", () => {
  const html = zeige([bewertung("c1", false, 2, 3)], { gesamtnoteMedian: null, anzahl: 1 });
  assert.doesNotMatch(html, /Median|NaN|numeric">0/);
  assert.doesNotMatch(zeige([bewertung("c1", false, 2, 3)]), /Median|NaN/);
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

test("CPU-Budget: die rechte Hälfte rendert der Server nur für die offene Seite und ihre Nachbarn", () => {
  const html = zeige([1, 2, 3, 4, 5].map((tag) => bewertung(`c${tag}`, false, tag, 4, `Text ${tag}.`)));
  // Alle fünf Seiten mit linker Hälfte (Kopf, Name, Text), Werte und Karte nur auf Seite 1, 2 und 5 (Nachbar über das Ende).
  assert.equal(html.match(/<article /g)?.length, 5);
  const seiten = html.split('<div class="buch-seite"').slice(1);
  for (const [i, seite] of seiten.entries()) assert.match(seite, new RegExp(`Text ${5 - i}\.`));
  // Noten (rechts oben) und Kolophon (links) sind billig und stehen immer im Server-HTML; die Einlage mit der Karte nur nah.
  assert.deepEqual(
    seiten.map((seite) => [seite.includes("<dt"), seite.includes("<figure")]),
    [[true, true], [true, true], [true, false], [true, false], [true, true]],
  );
  // Die leere rechte Hälfte bleibt als Fläche stehen, das Buch dreht sie beim Blättern.
  assert.equal(html.match(/data-buchseite="rechts"/g)?.length, 5);
});

test("Abfrage: Bewertungen des Betreibers zuerst, damit er bei mehr als 20 nicht aus dem Buch fällt", () => {
  const quelle = readFileSync(join(process.cwd(), "lib/query/strains.ts"), "utf8");
  const reviews = /reviews: \{\s*where: \{ freigegeben: true \},\s*(?:\/\/[^\n]*\s*)?orderBy: ([^\n]*),\s*take: 20/.exec(quelle);
  assert.ok(reviews, "Abfrage der Bewertungen nicht gefunden");
  assert.equal(reviews[1], '[{ istRedaktionell: "desc" }, { erstelltAm: "desc" }]');
});
test("Höhe: der Rahmen wächst mit dem Inhalt, Untergrenze 51rem, Obergrenze 54rem", () => {
  assert.match(css, /--buch-h:\s*clamp\(51rem,\s*calc\(100svh - var\(--kopf-h, 4rem\) - 5rem\),\s*54rem\);/);
});

test("Einzug: nur mit Bewegung und ohne Sparmodus, nach data-im-bild, an der aufgeschlagenen Seite", () => {
  const block = /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*:root:not\(\[data-sparmodus\]\) \.buch-stapel\[data-im-bild\] > \.buch-seite\[data-aktiv\] \[data-eintritt\][\s\S]*?\n\}/.exec(css);
  assert.ok(block, "Block für den Einzug fehlt");
  for (const name of ["buch-auf", "buch-blatt", "buch-strich", "buch-einlage", "schreiben"]) {
    assert.match(block[0], new RegExp(`animation-name:\\s*${name};`), name);
  }
  assert.match(block[0], /animation-fill-mode:\s*backwards;/);
  assert.match(block[0], /animation-delay:\s*calc\(280ms \+ var\(--i, 0\) \* 70ms\);/);
});

test("Einzug: nur transform, opacity und clip-path, nie Layout", () => {
  for (const name of ["buch-auf", "buch-blatt", "buch-strich", "buch-einlage"]) {
    const keyframes = new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`).exec(css);
    assert.ok(keyframes, name);
    assert.doesNotMatch(keyframes[1], /\b(width|height|top|left|margin|padding)\b/, name);
  }
});

test("Einzug: ohne Skript, mit reduzierter Bewegung oder im Sparmodus bleibt alles sichtbar", () => {
  // Der Ausgangszustand ist nie versteckt: die Animationen hängen nur an der Bedingung oben,
  // `from` ohne `to`, der Endzustand ist der Stil des Elements selbst.
  const block = /@keyframes buch-auf \{([\s\S]*?)\n\}/.exec(css);
  assert.ok(block);
  assert.doesNotMatch(block[1], /\bto\b/);
  assert.doesNotMatch(css, /\[data-eintritt\][^{]*\{[^}]*\b(opacity: 0|visibility: hidden|display: none)/);
});

test("Einzug: das Buch meldet sich im Bild, auch mit nur einer Seite", () => {
  const quelle = readFileSync(join(process.cwd(), "components/review/Buch.tsx"), "utf8");
  assert.match(quelle, /data-im-bild=\{imBild \? "" : undefined\}/);
  assert.match(quelle, /const element = huelle\.current;\s*if \(!element\) return;/);
});
