import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (pfad: string) => readFileSync(pfad, "utf8");

test("Zaehler: Kopf bleibt statisch, Zahl kommt aus der API", () => {
  const kopf = lies("components/layout/Kopf.tsx");
  assert.match(kopf, /<KontoZaehler texte=\{w\.kopf\.ungelesen\} sprache=\{sprache\} beschriftung=\{w\.kopf\.navigation\[PROFIL_LINK\.schluessel\]\} \/>/);
  assert.doesNotMatch(kopf, /aktuellesMitglied|headers\(\)|cookies\(\)/);
  const route = lies("app/api/benachrichtigungen/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /private, no-store/);
  const zaehler = lies("components/layout/KontoZaehler.tsx");
  assert.match(zaehler, /sr-only/);
  assert.match(zaehler, /sessionStorage/);
});

test("Mitgliederbereich: Benachrichtigungen und eigene Vorschlaege", () => {
  // Seit 2026-10-13 auf /profil: Lader in laden.ts, Boxen in konto-reihen.tsx.
  const laden = lies("app/[lang]/profil/laden.ts");
  assert.match(laden, /benachrichtigungenLaden\(id\)/);
  assert.match(laden, /eigeneVorschlaege\(id\)/);
  assert.match(lies("app/[lang]/profil/konto-reihen.tsx"), /<GelesenMarkieren/);
  assert.match(lies("app/[lang]/mitglied/aktionen.ts"), /export async function benachrichtigungenGelesen/);
});
