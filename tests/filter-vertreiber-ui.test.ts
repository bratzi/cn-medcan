import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AktiveFilter } from "@/components/produkt/AktiveFilter";
import { de } from "@/lib/i18n/de";
import { leererFilter } from "@/lib/query/filter";

const id = "4a5761be-5783-43ea-8223-a9e58cc75af8";

test("Chip Vertreiber mit Namen, Entfernen-Link ohne hersteller", () => {
  const html = renderToStaticMarkup(
    createElement(AktiveFilter, { filter: { ...leererFilter(), vertreiber: [id] }, vertreiberNamen: new Map([[id, "Aurora"]]), w: de, sprache: "de" }),
  );
  assert.match(html, /Vertreiber: Aurora/);
  assert.doesNotMatch(html, /vertreiber=/);
});

test("Chip Vertreiber ohne bekannten Namen zeigt keine rohe Id", () => {
  const html = renderToStaticMarkup(
    createElement(AktiveFilter, { filter: { ...leererFilter(), vertreiber: [id] }, vertreiberNamen: new Map(), w: de, sprache: "de" }),
  );
  assert.match(html, /Vertreiber: unbekannt/);
  assert.doesNotMatch(html, new RegExp(`>[^<]*${id}`));
});

test("Katalogseite lädt Namen gefilterter Vertreiber ohne aktive Sorten nach", () => {
  const q = readFileSync("app/[lang]/blueten/page.tsx", "utf8");
  assert.match(q, /ladeUnternehmenNamen\(/);
});

test("Filterleiste: Abschnitt Vertreiber mit Suche", () => {
  const q = readFileSync("components/produkt/FilterLeiste.tsx", "utf8");
  assert.match(q, /facetten.vertreiber/);
  assert.match(q, /type="search"/);
  assert.match(q, /texte.vertreiberSuche/);
});
