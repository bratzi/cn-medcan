import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const lies = (pfad: string) => readFileSync(join(process.cwd(), pfad), "utf8");
const AKTION = lies("app/[lang]/blueten/[slug]/bewertungsbild-aktionen.ts");
const OFFEN = lies("app/api/bild/offen/[id]/route.ts");

test("Aktion: Server Action, Sitzung zuerst, Mitglied nie aus dem Formular", () => {
  assert.match(AKTION, /^"use server";/);
  assert.ok(AKTION.indexOf("freigabeErforderlich()") < AKTION.indexOf("formData.get(\"bild\")"));
  assert.doesNotMatch(AKTION, /formData\.get\("(mitgliedId|autorId|reviewId|status)"\)/);
});

test("Aktion: Größe vor dem Einlesen, dann bildPruefen, Status aus der Rolle, Grenze aus bilderFrei", () => {
  assert.ok(AKTION.indexOf("BUDPIC_MAX_BYTES)") < AKTION.indexOf("arrayBuffer()"));
  assert.match(AKTION, /bildPruefen\(bytes/);
  assert.match(AKTION, /bildStatusFuer\(mitglied\.rolle\)/);
  assert.match(AKTION, /bilderFrei\(/);
  assert.match(AKTION, /BUDPIC_MAX_OFFEN/);
});

test("Aktion: Entfernen nur eigener Bilder einer Bewertung", () => {
  assert.match(AKTION, /mitgliedId: mitglied\.mitgliedId, reviewId: \{ not: null \}/);
});

test("Offene Vorschau: Betreiber oder Eigentümer, sonst 404, nie gecacht", () => {
  assert.match(OFFEN, /mitglied\.rolle !== "ADMIN" && bild\.mitgliedId !== mitglied\.mitgliedId/);
  assert.match(OFFEN, /private, no-store/);
});
