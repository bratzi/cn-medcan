import { test } from "node:test";
import assert from "node:assert/strict";

import { avatarFarbe, initialen } from "@/lib/avatar";

test("initialen: zwei Woerter ergeben zwei Grossbuchstaben", () => {
  assert.equal(initialen("Waldemar Helwich"), "WH");
  assert.equal(initialen("  anna   maria  lang "), "AM");
});

test("initialen: ein Wort ergibt einen Buchstaben, Emoji und Umlaute bleiben ganz", () => {
  assert.equal(initialen("Zoe"), "Z");
  assert.equal(initialen("özcan"), "Ö");
  assert.equal(initialen("😀 Kim"), "😀K");
});

test("initialen: leerer Name ergibt ein Fragezeichen", () => {
  assert.equal(initialen("   "), "?");
});

test("avatarFarbe ist deterministisch und nutzt nur semantische Tokens", () => {
  assert.equal(avatarFarbe("Kim"), avatarFarbe("Kim"));
  const alle = new Set(["A", "Bea", "Chris", "Dora", "Emil", "Fritz", "Gudrun", "Hans"].map(avatarFarbe));
  assert.ok(alle.size > 1);
  for (const k of alle) assert.doesNotMatch(k, /#|oklch|dark:|-\d{2,3}\b/);
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Avatar } from "@/components/ui/Avatar";

test("Avatar ohne Bild zeigt gedruckte Initialen, stumm fuer Screenreader", () => {
  const html = renderToStaticMarkup(createElement(Avatar, { name: "Waldemar Helwich" }));
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, />WH</);
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /font-hand/);
});

test("Avatar mit Bild laedt /api/bild/<id> mit leerem Alt-Text", () => {
  const html = renderToStaticMarkup(createElement(Avatar, { name: "Kim", bildId: "abc" }));
  assert.match(html, /<img[^>]+src="\/api\/bild\/abc"/);
  assert.match(html, /alt=""/);
});
