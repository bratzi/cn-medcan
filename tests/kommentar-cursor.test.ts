import { test } from "node:test";
import assert from "node:assert/strict";
import { cursorKodieren, cursorLesen } from "@/lib/kommentar-cursor";
import { benachrichtigungSatz } from "@/lib/benachrichtigung";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("Cursor: Rundreise und ungültige Eingaben", () => {
  const c = { erstelltAm: new Date("2026-10-14T10:00:00.123Z"), id: "abc-1" };
  assert.deepEqual(cursorLesen(cursorKodieren(c)), c);
  for (const roh of [undefined, "", "x", "2026-10-14T10:00:00.123Z", "2026-10-14T10:00:00.123Z|", "kaputt|id", "a|b|c", 5]) {
    assert.equal(cursorLesen(roh), null);
  }
});

test("Benachrichtigung: Kommentar in beiden Sprachen, Rückfall auf Text", () => {
  const z = { art: "KOMMENTAR", text: "alt", parameter: JSON.stringify({ name: "Mia" }) };
  assert.equal(benachrichtigungSatz(de.benachrichtigung, z), "Mia hat dich kommentiert.");
  assert.equal(benachrichtigungSatz(en.benachrichtigung, z), "Mia commented on your post.");
  assert.equal(benachrichtigungSatz(en.benachrichtigung, { ...z, parameter: null }), "alt");
  const g = { art: "KOMMENTAR_GEMELDET", text: "alt", parameter: null };
  assert.match(benachrichtigungSatz(en.benachrichtigung, g), /reported/);
  assert.match(benachrichtigungSatz(de.benachrichtigung, g), /gemeldet/);
});
