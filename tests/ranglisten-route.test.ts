import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("app/api/ranglisten/route.ts", "utf8");
const abfrage = readFileSync("lib/query/rangliste.ts", "utf8");

test("Route: ohne Sitzung 401, privat und ungecacht", () => {
  assert.match(route, /aktuellesMitglied\(\)/);
  assert.match(route, /status: 401/);
  assert.match(route, /"Cache-Control": "private, no-store"/);
  assert.match(route, /parameter\(/);
});

test("Abfrage: GROUP BY in D1, nur freigegeben und aktive Sorten, höchstens 12 Sorten nachladen", () => {
  assert.match(abfrage, /GROUP BY r\.strain_id/);
  assert.match(abfrage, /r\.freigegeben = 1/);
  assert.match(abfrage, /s\.aktiv = 1/);
  assert.match(abfrage, /id: \{ in: ids \}/);
});

test("Abfrage: Betreiber-Note der neuesten Betreiber-Bewertung, Datumsformate vereinheitlicht", () => {
  assert.match(abfrage, /ORDER BY strftime\('%Y-%m-%dT%H:%M:%fZ', b\.erstellt_am\) DESC, b\.id DESC LIMIT 1/);
  assert.match(abfrage, /begrenzeSeite\(/);
});
