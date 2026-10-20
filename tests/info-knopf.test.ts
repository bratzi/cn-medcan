import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { InfoKnopf, infoKnopfSchritt } from "@/components/ui/InfoKnopf";

test("InfoKnopf: Knopf mit Namen, aria-expanded und aria-describedby auf den Hinweis", () => {
  const html = renderToStaticMarkup(createElement(InfoKnopf, { sprache: "de", text: "Kurzer Hinweis." }));
  const knopf = /<button[^>]*>/.exec(html)?.[0] ?? "";
  assert.match(knopf, /type="button"/);
  assert.match(knopf, /aria-label="Hinweis"/);
  assert.match(knopf, /aria-expanded="false"/);
  const id = /aria-describedby="([^"]+)"/.exec(knopf)?.[1];
  assert.ok(id);
  assert.match(html, new RegExp(`<span[^>]*id="${id}"[^>]*role="tooltip"[^>]*>Kurzer Hinweis.</span>`));
});

test("InfoKnopf: englischer Name", () => {
  const html = renderToStaticMarkup(createElement(InfoKnopf, { sprache: "en", text: "Hint." }));
  assert.match(html, /aria-label="Hint"/);
});

test("InfoKnopf: Hover, Fokus und Tippen öffnen, Escape und Verlassen schließen", () => {
  assert.equal(infoKnopfSchritt(false, "zeigerRein"), true);
  assert.equal(infoKnopfSchritt(true, "zeigerRaus"), false);
  assert.equal(infoKnopfSchritt(false, "fokus"), true);
  assert.equal(infoKnopfSchritt(true, "blur"), false);
  assert.equal(infoKnopfSchritt(false, "tippen"), true);
  assert.equal(infoKnopfSchritt(true, "tippen"), false);
  assert.equal(infoKnopfSchritt(true, "escape"), false);
});

test("InfoKnopf: 24 px sichtbar, Trefferfläche 44 px, keine Glas- oder Transparenz-Effekte", () => {
  const quelle = readFileSync(join(process.cwd(), "components/ui/InfoKnopf.tsx"), "utf8");
  assert.match(quelle, /size-6/);
  assert.match(quelle, /before:size-11/);
  assert.doesNotMatch(quelle, /backdrop-blur|bg-[a-z-]+\/\d|opacity-\d/);
});
