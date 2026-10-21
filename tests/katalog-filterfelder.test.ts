import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FilterFeld, SuchFeld } from "@/components/katalog/FilterFelder";
import { de } from "@/lib/i18n/de";
import type { ChipSchluessel } from "@/lib/katalog/chipleiste";
import { leererFilter } from "@/lib/query/filter";

const basis = (fachkreis: boolean): Omit<ComponentProps<typeof SuchFeld>, never> => ({
  filter: leererFilter(),
  zahlen: null,
  daten: {
    vertreiber: [{ i: "v1", n: "Aurora" }],
    terpene: [{ n: "Myrcen", g: "ERDIG" }, { n: "Limonen", g: "ZITRUS" }],
    apotheken: [{ s: "a1", n: "Apotheke Eins" }],
    fachkreis,
  } as ComponentProps<typeof SuchFeld>["daten"],
  setze: () => undefined,
  texte: de.katalog.leiste,
  labels: de.label,
  sprache: "de",
  deaktiviert: false,
});

const feld = (chip: ChipSchluessel, fachkreis = false) =>
  renderToStaticMarkup(createElement(FilterFeld, { ...basis(fachkreis), chip }));
const such = () => renderToStaticMarkup(createElement(SuchFeld, basis(false)));

for (const chip of ["community", "terpene", "geschmack", "typ", "thc", "vertreiber", "form", "verfuegbar"] as const) {
  test(`FilterFeld ${chip} rendert ohne details-Hülle`, () => {
    const html = feld(chip);
    assert.ok(html.length > 0);
    assert.doesNotMatch(html, /<details/);
  });
}

test("FilterFeld mehr ohne Fachkreis leer", () => assert.equal(feld("mehr"), ""));

test("FilterFeld mehr im Fachkreis: Apotheke und Höchstpreis", () => {
  const html = feld("mehr", true);
  assert.match(html, /Apotheke Eins/);
  assert.match(html, /type="range"/);
});

test("FilterFeld terpene zeigt die Terpene als Knöpfe", () => {
  const html = feld("terpene");
  assert.match(html, /aria-pressed="false"[^>]*>[\s\S]*?Myrcen/);
});

test("SuchFeld ist type=search mit Label", () => {
  const html = such();
  assert.match(html, /type="search"/);
  const id = html.match(/<input[^>]*id="([^"]+)"[^>]*type="search"|<input[^>]*type="search"[^>]*id="([^"]+)"/);
  const ziel = id?.[1] ?? id?.[2];
  assert.ok(ziel, "Suchfeld ohne id");
  assert.match(html, new RegExp(`<label[^>]*for="${ziel}"[^>]*>${de.katalog.leiste.suche}<`));
});

test("Klappe und Sammelkomponente FilterFelder sind entfernt", () => {
  const s = readFileSync("components/katalog/FilterFelder.tsx", "utf8");
  assert.doesNotMatch(s, /<details|function Klappe/);
});
