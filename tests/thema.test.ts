import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { THEMA_SCHLUESSEL, THEMA_SKRIPT, anderesThema } from "@/lib/thema";

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");

/** Führt das Kopf-Skript wie im Browser aus und liefert das gesetzte data-theme. */
function skriptMit(getItem: (schluessel: string) => string | null): string | undefined {
  const gesetzt: Record<string, string> = {};
  runInNewContext(THEMA_SKRIPT, {
    localStorage: { getItem },
    document: { documentElement: { setAttribute: (name: string, wert: string) => (gesetzt[name] = wert) } },
  });
  return gesetzt["data-theme"];
}

test("Kopf-Skript: gespeichertes Dunkel wird vor dem Zeichnen gesetzt", () => {
  assert.equal(skriptMit((s) => (s === THEMA_SCHLUESSEL ? "dark" : null)), "dark");
});

test("Kopf-Skript: ohne Wahl bleibt es hell, ohne Speicher wirft es nicht", () => {
  assert.equal(skriptMit(() => null), undefined);
  assert.equal(skriptMit(() => "unsinn"), undefined);
  assert.equal(
    skriptMit(() => {
      throw new Error("kein Speicher");
    }),
    undefined,
  );
});

test("Umschalten wechselt zwischen hell und dunkel", () => {
  assert.equal(anderesThema("light"), "dark");
  assert.equal(anderesThema("dark"), "light");
});

test("Layout: startet hell, Skript im head, DOM gewinnt beim Hydrieren", () => {
  const layout = lies("app/layout.tsx");
  assert.match(layout, /data-theme=\{THEMA_STANDARD\}/);
  assert.match(layout, /suppressHydrationWarning/);
  assert.match(layout, /<head>\s*<script dangerouslySetInnerHTML=\{\{ __html: THEMA_SKRIPT \}\} \/>\s*<\/head>/);
});

test("Schalter: ein Knopf, das Wort nennt das Ziel, per CSS ohne Aufblitzen", async () => {
  const { ThemaSchalter } = await import("@/components/layout/ThemaSchalter");
  const html = renderToStaticMarkup(createElement(ThemaSchalter));
  assert.match(html, /^<button type="button"/);
  assert.match(html, /class="thema-ziel-dunkel">Dunkel<span class="sr-only"> darstellen<\/span>/);
  assert.match(html, /class="thema-ziel-hell">Hell<span class="sr-only"> darstellen<\/span>/);
  const css = lies("app/globals.css");
  assert.match(css, /:root\[data-theme="dark"\] \.thema-ziel-dunkel,\s*:root:not\(\[data-theme="dark"\]\) \.thema-ziel-hell \{\s*display: none;/);
});

test("Kopf trägt den Schalter", () => {
  assert.match(lies("components/layout/Kopf.tsx"), /<ThemaSchalter /);
});
