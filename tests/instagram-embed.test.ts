import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { InstagramEmbed, baueEmbedUrl } from "@/components/produkt/InstagramEmbed";
import { ReelRahmen } from "@/components/produkt/ReelNachKlick";
import { de } from "@/lib/i18n/de";

const GUELTIG = "https://www.instagram.com/reel/ABCdef12345/";

test("baueEmbedUrl baut die Embed-URL neu und lehnt Fremdes ab", () => {
  assert.equal(baueEmbedUrl(GUELTIG), "https://www.instagram.com/reel/ABCdef12345/embed");
  assert.equal(baueEmbedUrl("https://www.instagram.com/p/ABCdef12345/?x=1"), "https://www.instagram.com/p/ABCdef12345/embed");
  for (const roh of [null, "", "kaputt", "http://www.instagram.com/reel/ABCdef12345/", "https://evil.com/reel/ABCdef12345/", "https://www.instagram.com/stories/ABCdef12345/", "https://www.instagram.com/reel/a/"]) {
    assert.equal(baueEmbedUrl(roh), null, String(roh));
  }
});

test("vor dem Klick lädt nichts von Instagram", () => {
  const html = renderToStaticMarkup(createElement(InstagramEmbed, { url: GUELTIG, bezeichnung: "Nebelharz 22", texte: de.reel }));
  assert.doesNotMatch(html, /<iframe|instagram\.com/);
  assert.match(html, /<button type="button"[^>]*>Reel von Instagram laden<\/button>/);
  assert.match(html, /Meta/);
  assert.match(html, /href="\/datenschutz#ds-instagram"/);
  // Gleiche Fläche wie der iframe, damit beim Laden nichts springt.
  assert.match(html, /aspect-\[9\/16\]/);
});

test("nach dem Klick: iframe mit geprüfter URL und ohne Referrer", () => {
  const html = renderToStaticMarkup(
    createElement(ReelRahmen, { embedUrl: "https://www.instagram.com/reel/ABCdef12345/embed", titel: "Instagram-Reel zu Nebelharz 22" }),
  );
  assert.match(html, /<iframe[^>]*src="https:\/\/www\.instagram\.com\/reel\/ABCdef12345\/embed"/);
  assert.match(html, /referrerPolicy="no-referrer"/i);
  assert.match(html, /title="Instagram-Reel zu Nebelharz 22"/);
  assert.match(html, /aspect-\[9\/16\]/);
});

test("ohne gültige URL bleibt der bisherige Platzhalter ohne Lade-Button", () => {
  const html = renderToStaticMarkup(createElement(InstagramEmbed, { url: "https://example.com/reel/x", texte: de.reel }));
  assert.match(html, /Kein Video hinterlegt/);
  assert.doesNotMatch(html, /<iframe|Reel von Instagram laden/);
});
