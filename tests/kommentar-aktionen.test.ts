import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const q = () => readFileSync("app/[lang]/reaktionen/kommentar-aktionen.ts", "utf8");

test("Kommentar-Aktionen: Sitzung aus dem Server, Prüfung, Batch, Abräumen der Zähler", () => {
  const s = q();
  assert.match(s, /^"use server";/);
  assert.match(s, /kommentarPruefen\(/);
  assert.match(s, /darfSchreiben\(/);
  assert.match(s, /zuSchnell\(/);
  assert.match(s, /nachMeldung\(/);
  assert.match(s, /darfLoeschen\(/);
  assert.match(s, /adminErforderlich\(\)/);
  assert.match(s, /\$transaction\(/);
  assert.match(s, /revalidiereSprachen\("\/reviews", "layout"\)/);
  assert.doesNotMatch(s, /formData\.get\("autorId"\)|autorId: (?!ich\.mitgliedId)/);
});
