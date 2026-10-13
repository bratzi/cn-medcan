import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { VertreiberBeispielKarte } from "@/components/story/VertreiberBeispielKarte";
import { de } from "@/lib/i18n/de";
import type { VertreiberEintrag } from "@/lib/query/vertreiber";

const maskiere = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const zeile = (teil: Partial<VertreiberEintrag>): VertreiberEintrag => ({
  slug: "s", handelsname: "H", vertreiberName: "V", qualitaet: null, restfeuchte: null, anzahl: 0, aktuell: false, ...teil,
});
const zeige = (zeilen: VertreiberEintrag[]) =>
  renderToStaticMarkup(
    createElement(VertreiberBeispielKarte, { beispiel: { kultivarId: "abc", name: "MAC 1", zeilen }, texte: de.start.vertreiber, sprache: "de" }),
  );

test("Beispielkarte: zwei bewertete Vertreiber, kein Einladungssatz, Links auf Blüte und Katalog", () => {
  const html = zeige([
    zeile({ slug: "a", handelsname: "Enua MAC", vertreiberName: "Enua", qualitaet: 4.2, anzahl: 3 }),
    zeile({ slug: "b", handelsname: "avaay MAC", vertreiberName: "avaay", qualitaet: 3.1, anzahl: 1 }),
  ]);
  assert.match(html, /MAC 1/);
  assert.match(html, /Enua/);
  assert.match(html, /Qualität 4,2 von 5/);
  assert.match(html, /href="\/blueten\/a"/);
  assert.match(html, /href="\/blueten\?kultivar=abc"/);
  assert.doesNotMatch(html, new RegExp(maskiere(de.start.vertreiber.einladung)));
  assert.match(html, new RegExp(de.start.vertreiber.hinweis));
  assert.doesNotMatch(html, /apotheke|kaufen|bester|beste /i);
});

test("Beispielkarte: ein bewerteter Vertreiber lädt zur Charge eines unbewerteten ein", () => {
  const html = zeige([
    zeile({ slug: "a", vertreiberName: "Enua", qualitaet: 4, anzahl: 2 }),
    zeile({ slug: "b", vertreiberName: "avaay" }),
  ]);
  assert.match(html, new RegExp(maskiere(de.start.vertreiber.einladung)));
  assert.match(html, /href="\/blueten\/b#bewerten"/);
  assert.match(html, /Charge von avaay bewerten/);
  assert.match(html, new RegExp(de.start.vertreiber.ohneCharge));
});

test("Beispielkarte: keiner bewertet, alle Zeilen ohne Charge, Einladung auf die erste Ware", () => {
  const html = zeige([zeile({ slug: "a", vertreiberName: "Enua" }), zeile({ slug: "b", vertreiberName: null })]);
  assert.equal(html.split(de.start.vertreiber.ohneCharge).length - 1, 2);
  assert.match(html, /Vertreiber unbekannt/);
  assert.match(html, /href="\/blueten\/a#bewerten"/);
  assert.doesNotMatch(html, /href="\/blueten\/a"/);
});

test("Beispielkarte: höchstens vier Zeilen, Rest als Satz", () => {
  const html = zeige(["a", "b", "c", "d", "e", "f"].map((s) => zeile({ slug: s, vertreiberName: s.toUpperCase() })));
  assert.equal((html.match(/<li/g) ?? []).length, 4);
  assert.match(html, /und 2 weitere Vertreiber/);
  assert.match(html, /Alle 6 Vertreiber im Katalog/);
});

test("Beispielkarte: lange Namen brechen um, Einzellinks sind 44 px hoch", () => {
  const html = zeige([zeile({ handelsname: "X".repeat(120) }), zeile({ slug: "b" })]);
  assert.match(html, /wrap-break-word/);
  assert.match(html, /min-h-11/);
  assert.doesNotMatch(html, /text-h2|text-caption/);
});

test("Startseite: Kapitel direkt nach TransparentMachen", () => {
  const q = readFileSync("app/[lang]/page.tsx", "utf8");
  assert.ok(q.indexOf("<TransparentMachen />") < q.indexOf("<VertreiberKapitel />"));
  assert.ok(q.indexOf("<VertreiberKapitel />") < q.indexOf("<TerpenRegister />"));
});

test("VertreiberKapitel: eigene Suspense-Grenze, Schlagwort, Fehler mit unstable_rethrow", () => {
  const q = readFileSync("components/story/VertreiberKapitel.tsx", "utf8");
  assert.match(q, /<Suspense/);
  assert.match(q, /<Schlagwort/);
  assert.match(q, /unstable_rethrow/);
  assert.match(q, /data-story="vertreiber"/);
});
