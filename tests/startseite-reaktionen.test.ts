import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Startseite zeigt Likes und Kommentare an der neuesten Bewertung", () => {
  const s = readFileSync("components/story/NeuesterEintrag.tsx", "utf8");
  assert.match(s, /reaktionenFuer\("BEWERTUNG", \[review\.id\]\)/);
  assert.match(s, /alsEintrag\(review, produkt, [^)]*likes[^)]*kommentare[^)]*\)/);
  assert.doesNotMatch(s, /likeZahlenFuer/);
});
