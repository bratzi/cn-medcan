import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ChipFenster } from "@/components/katalog/ChipFenster";

const fenster = (teil: Partial<Omit<ComponentProps<typeof ChipFenster>, "children">> = {}) =>
  renderToStaticMarkup(
    createElement(ChipFenster, {
      titel: "Terpene",
      zahl: 0,
      offen: false,
      oeffne: () => undefined,
      schliesse: () => undefined,
      fussText: "12 Treffer zeigen",
      ...teil,
    }, createElement("p", null, "Inhalt")),
  );

const knopf = (html: string) => html.match(/<button[^>]*aria-haspopup="dialog"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? "";

test("ChipFenster: Chip ist ein Knopf mit aria-expanded und aria-haspopup", () => {
  const k = knopf(fenster());
  assert.match(k, /aria-expanded="false"/);
  assert.match(k, />Terpene</);
  assert.match(k, /\bh-11\b/);
  assert.match(k, /\brounded-full\b/);
});

test("ChipFenster: aria-controls zeigt auf das dialog", () => {
  const html = fenster();
  const ziel = knopf(html).match(/aria-controls="([^"]+)"/)?.[1];
  assert.ok(ziel);
  assert.match(html, new RegExp(`<dialog[^>]*id="${ziel}"`));
});

test("ChipFenster: Zähler nur bei zahl > 0", () => {
  assert.match(knopf(fenster({ zahl: 2 })), />2</);
  assert.doesNotMatch(knopf(fenster({ zahl: 0 })), /bg-accent/);
});

test("ChipFenster: Inhalt und Ergebnisknopf im Fenster", () => {
  const html = fenster();
  assert.match(html, /<dialog[\s\S]*Inhalt[\s\S]*12 Treffer zeigen[\s\S]*<\/dialog>/);
});

test("ChipFenster: Popover scrollt selbst und bleibt im Viewport (Review Focus 1)", () => {
  const html = fenster();
  assert.match(html, /max-h-\[min\(70dvh,32rem\)\]/);
  assert.match(html, /overflow-y-auto/);
});

test("ChipFenster: Esc, Klick außen, Fokus zurück, Breite per matchMedia", () => {
  const s = readFileSync("components/katalog/ChipFenster.tsx", "utf8");
  assert.match(s, /onCancel=/);
  assert.match(s, /"Escape"/);
  assert.match(s, /pointerdown/);
  assert.match(s, /BREIT = "\(width >= 64rem\)"/);
  assert.match(s, /matchMedia\(BREIT\)/);
  assert.match(s, /showModal\(\)/);
  assert.match(s, /\.show\(\)/);
  assert.match(s, /knopfRef\.current\?\.focus\(\)/);
});

test("ChipFenster: gedrückter Zustand und eigenes Label für das Sortier-Menü", () => {
  const k = knopf(fenster({ gedrueckt: true, knopfText: "Name" }));
  assert.match(k, /aria-pressed="true"/);
  assert.match(k, />Name</);
});
