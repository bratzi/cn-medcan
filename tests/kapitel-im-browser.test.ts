import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const quelle = readFileSync("components/kapitel-start/KapitelImBrowser.tsx", "utf8");

test("KapitelImBrowser: ViewTransition läuft über useDeferredValue (setState löst sie nicht aus)", () => {
  assert.match(quelle, /useDeferredValue\(sitzung \? kapitelAnzeige\(sitzung\.stand\) : null\)/);
});

test("KapitelImBrowser: ViewTransition ist auf default=none mit explizitem enter/exit gestellt", () => {
  assert.match(quelle, /<ViewTransition[^>]*default="none"/);
  assert.match(quelle, /<ViewTransition[^>]*enter="auto"/);
  assert.match(quelle, /<ViewTransition[^>]*exit="auto"/);
});
