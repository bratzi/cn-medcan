import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { BuchDoppelseite } from "@/components/review/BuchDoppelseite";
import { de } from "@/lib/i18n/de";
import { eintrag } from "./hilfen/eintrag";

const seite = readFileSync("app/[lang]/reviews/page.tsx", "utf8");
const band = readFileSync("app/[lang]/reviews/band/[band]/page.tsx", "utf8");
const gross = readFileSync("components/review/GrossesBuch.tsx", "utf8");
const buch = readFileSync("components/review/Buch.tsx", "utf8");

test("/reviews und Bandseiten statisch, 300 s", () => {
  for (const q of [seite, band]) {
    assert.match(q, /export const dynamic = "force-static";/);
    assert.match(q, /export const revalidate = 300;/);
  }
});

test("/reviews: Ranglisten unter dem Buch, Anker für das Anmelden", () => {
  const inhalt = readFileSync("app/[lang]/reviews/seite.tsx", "utf8");
  assert.ok(inhalt.indexOf("<GrossesBuch") < inhalt.indexOf("<Ranglisten"));
  assert.match(inhalt, /id="ranglisten"/);
});

test("/reviews ohne alte Doppelseite und ohne Inhaltsverzeichnis", () => {
  assert.doesNotMatch(seite, /Doppelseite|Inhaltsverzeichnis/);
});

test("Bandseite: Band 1 und Unsinn sind 404", () => {
  assert.match(band, /if \(!\/\^\\d\+\$\/\.test\(band\) \|\| nummer < 2 \|\| String\(nummer\) !== band\) notFound\(\);/);
});

test("Großes Buch: BuchDoppelseite mit Sorte, Seitenleiste mit Basis", () => {
  assert.match(gross, /<BuchDoppelseite[^>]*sorte/);
  assert.match(gross, /leiste=\{\{ basis: band\.basis, gesamt: band\.gesamt/);
});

test("Buch: Sprung #nr- nur mit Seitenleiste", () => {
  assert.match(buch, /nummerSeite\(/);
});

const zeige = (sorte?: boolean) =>
  renderToStaticMarkup(
    createElement(
      KarteSofortKontext.Provider,
      { value: true },
      createElement(BuchDoppelseite, { eintrag: eintrag({}), ueberschrift: "h3", w: de, sprache: "de" as const, sorte }),
    ),
  );

test("BuchDoppelseite mit sorte: Handelsname als Link auf die Bewertung", () => {
  const html = zeige(true);
  assert.match(html, /<a [^>]*href="\/blueten\/nebelharz-22#eintrag-r1"[^>]*>Nebelharz 22 \(fiktiv\)<\/a>/);
});

test("BuchDoppelseite ohne sorte: kein Link auf die Sorte", () => {
  assert.doesNotMatch(zeige(), /href="\/blueten\/nebelharz-22#eintrag-r1"/);
});
