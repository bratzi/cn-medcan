import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (pfad: string) => readFileSync(pfad, "utf8");

test("Zaehler: Kopf bleibt statisch, Zahl kommt aus der API", () => {
  const kopf = lies("components/layout/Kopf.tsx");
  assert.match(kopf, /<KontoZaehler \/>/);
  assert.doesNotMatch(kopf, /aktuellesMitglied|headers\(\)|cookies\(\)/);
  const route = lies("app/api/benachrichtigungen/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /private, no-store/);
  const zaehler = lies("components/layout/KontoZaehler.tsx");
  assert.match(zaehler, /sr-only/);
  assert.match(zaehler, /sessionStorage/);
});

test("Mitgliederbereich: Benachrichtigungen und eigene Vorschlaege", () => {
  const seite = lies("app/mitglied/page.tsx");
  assert.match(seite, /benachrichtigungenLaden\(mitglied\.mitgliedId\)/);
  assert.match(seite, /eigeneVorschlaege\(mitglied\.mitgliedId\)/);
  assert.match(seite, /<GelesenMarkieren/);
  assert.match(lies("app/mitglied/aktionen.ts"), /export async function benachrichtigungenGelesen/);
});
