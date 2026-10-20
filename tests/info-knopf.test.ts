import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { InfoKnopf, blasenLage, infoKnopfSchritt } from "@/components/ui/InfoKnopf";

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
  // Erlaubt ist nur das Einblenden beim Öffnen (starting:opacity-0), keine bleibende Transparenz.
  assert.doesNotMatch(quelle, /backdrop-blur|bg-[a-z-]+\/\d|(?<!starting:)opacity-\d/);
});

test("InfoKnopf: Blase liegt als Popover in der obersten Ebene, nie abgeschnitten", () => {
  const html = renderToStaticMarkup(createElement(InfoKnopf, { sprache: "de", text: "Kurz." }));
  assert.match(html, /role="tooltip"[^>]*popover="manual"|popover="manual"[^>]*role="tooltip"/);
});

test("blasenLage: oben mittig, wenn Platz ist", () => {
  const l = blasenLage({ left: 190, top: 400, bottom: 424, width: 24 }, { width: 200, height: 60 }, { breite: 400, oben: 64 });
  assert.equal(l.unten, false);
  assert.equal(l.x, 102);
  assert.equal(l.y, 332);
  assert.equal(l.pfeil, 100);
});

test("blasenLage: klappt unter den Knopf, wenn oben der Kopf im Weg ist", () => {
  const l = blasenLage({ left: 190, top: 100, bottom: 124, width: 24 }, { width: 200, height: 60 }, { breite: 400, oben: 64 });
  assert.equal(l.unten, true);
  assert.equal(l.y, 132);
});

test("blasenLage: 16 px Rand am Fensterrand, Pfeil bleibt auf dem Knopf", () => {
  const links = blasenLage({ left: 4, top: 400, bottom: 424, width: 24 }, { width: 200, height: 60 }, { breite: 390, oben: 64 });
  assert.equal(links.x, 16);
  assert.equal(links.pfeil, 0);
  const rechts = blasenLage({ left: 362, top: 400, bottom: 424, width: 24 }, { width: 200, height: 60 }, { breite: 390, oben: 64 });
  assert.equal(rechts.x, 174);
  assert.equal(rechts.pfeil, 200);
});
