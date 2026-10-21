import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HerstellerLeiste } from "@/components/sorte/HerstellerLeiste";
import { de } from "@/lib/i18n/de";
import { markenInitialen, sichererLogoPfad } from "@/lib/marken";
import { gruppiereWaren, type WareKarte } from "@/lib/query/sorte";

const p = (id: string) => ({ id, slug: `slug-${id}`, handelsname: `Blüte ${id}`, thcMin: 20, thcMax: 24, cbdMin: 0, cbdMax: 1 });

test("gruppiereWaren: trägt das Logo des Vertreibers mit", () => {
  const zeilen = [
    { ...p("a1"), vertreiberId: "v-a", vertreiberName: "Alpha", vertreiberLogo: "/marken/hersteller/alpha.svg", kultivarTyp: "HYBRID", genetik: null },
    { ...p("b1"), vertreiberId: "v-b", vertreiberName: "Beta", vertreiberLogo: null, kultivarTyp: "HYBRID", genetik: null },
  ];
  const waren = gruppiereWaren(zeilen, new Map());
  assert.equal(waren.find((w) => w.vertreiberId === "v-a")?.vertreiberLogo, "/marken/hersteller/alpha.svg");
  assert.equal(waren.find((w) => w.vertreiberId === "v-b")?.vertreiberLogo, null);
});

test("markenInitialen: zwei Buchstaben, Rechtsform zählt nicht", () => {
  assert.equal(markenInitialen("Aurora Deutschland GmbH"), "AD");
  assert.equal(markenInitialen("Tilray"), "TI");
  assert.equal(markenInitialen("cannamedical Pharma GmbH"), "CP");
  assert.equal(markenInitialen("Four 20 Pharma GmbH"), "F2");
  assert.equal(markenInitialen(""), "?");
  assert.equal(markenInitialen("GmbH"), "GM");
});

test("sichererLogoPfad: nur Dateien unter /marken/, kein Fremdlink, kein ..", () => {
  assert.equal(sichererLogoPfad("/marken/hersteller/aurora.svg"), "/marken/hersteller/aurora.svg");
  assert.equal(sichererLogoPfad("  /marken/hersteller/a-b_1.webp "), "/marken/hersteller/a-b_1.webp");
  assert.equal(sichererLogoPfad("https://boese.example/x.svg"), null);
  assert.equal(sichererLogoPfad("/marken/../geheim.svg"), null);
  assert.equal(sichererLogoPfad("/marken/hersteller/x.exe"), null);
  assert.equal(sichererLogoPfad(""), null);
  assert.equal(sichererLogoPfad(null), null);
});

const waren: WareKarte[] = [
  { vertreiberId: "v-b", vertreiberName: "Beta Pharma GmbH", vertreiberLogo: "/marken/hersteller/beta.svg", produkte: [p("b1"), p("b2")], anzahl: 5, gesamtnoteMittel: 3.8 },
  { vertreiberId: "v-a", vertreiberName: "Alpha GmbH", vertreiberLogo: null, produkte: [p("a1")], anzahl: 0, gesamtnoteMittel: null },
];

test("HerstellerLeiste: Logo-Karten in Reihenfolge, gewählte markiert, Initialen ohne Logo", () => {
  const html = renderToStaticMarkup(
    createElement(HerstellerLeiste, { waren, aktiveVertreiberId: "v-a", slug: "mac-1", texte: de.bluete.vertreiber, sprache: "de" }),
  );
  assert.ok(html.indexOf("Beta Pharma GmbH") < html.indexOf("Alpha GmbH"));
  assert.match(html, /href="\/blueten\/mac-1\?vertreiber=v-b"/);
  assert.match(html, /<img[^>]*src="\/marken\/hersteller\/beta.svg"[^>]*alt=""/);
  assert.equal(html.split('aria-current="true"').length - 1, 1);
  const alpha = html.split("<li").find((teil) => teil.includes("Alpha GmbH")) ?? "";
  assert.match(alpha, /aria-current="true"/);
  assert.match(alpha, />AL</);
  assert.match(html, /overflow-x-auto/);
  assert.match(html, /min-h-11/);
  assert.doesNotMatch(html, /Ware|Stärke/);
});
