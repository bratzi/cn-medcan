import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("app/globals.css", "utf8");

test("Kein Element setzt visibility: visible (Nutzer 2026-10-09: Lichtlinien verdeckter Buchseiten blieben quer im Bild stehen)", () => {
  // Das Buch verdeckt Seiten mit visibility: hidden. Ein Kind mit visibility: visible schlägt da durch,
  // seine Animation ist dort pausiert und bleibt als Standbild über der aktiven Seite.
  assert.doesNotMatch(css, /visibility:\s*visible/);
});
