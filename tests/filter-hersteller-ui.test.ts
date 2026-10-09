import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AktiveFilter } from "@/components/produkt/AktiveFilter";
import { de } from "@/lib/i18n/de";
import { leererFilter } from "@/lib/query/filter";

const id = "4a5761be-5783-43ea-8223-a9e58cc75af8";

test("Chip Hersteller mit Namen, Entfernen-Link ohne hersteller", () => {
  const html = renderToStaticMarkup(
    createElement(AktiveFilter, { filter: { ...leererFilter(), hersteller: [id] }, herstellerNamen: new Map([[id, "Aurora"]]), w: de, sprache: "de" }),
  );
  assert.match(html, /Hersteller: Aurora/);
  assert.doesNotMatch(html, /hersteller=/);
});

test("Filterleiste: Abschnitt Hersteller mit Suche", () => {
  const q = readFileSync("components/produkt/FilterLeiste.tsx", "utf8");
  assert.match(q, /facetten\.hersteller/);
  assert.match(q, /type="search"/);
  assert.match(q, /texte\.herstellerSuche/);
});
