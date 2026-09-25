import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (pfad: string) => readFileSync(pfad, "utf8");

test("Admin-Aktionen: jede beginnt mit adminErforderlich", () => {
  const quelle = lies("app/admin/vorschlag-aktionen.ts");
  assert.match(quelle, /^"use server";/);
  for (const name of ["blueteFreigeben", "blueteAblehnen", "blueteZuordnen"]) {
    assert.match(
      quelle,
      new RegExp(String.raw`export async function ${name}\([^)]*\)[^{]*\{\s*await adminErforderlich\(\);`),
    );
  }
  // Ids nach der Regel des Importskripts, nie zufaellig
  assert.match(quelle, /strainIdAusSlug\(/);
  assert.match(quelle, /unternehmensIdAusSchluessel\(/);
  // Benachrichtigen vor dem Statuswechsel (Wiederholung verliert keine Nachricht)
  assert.ok(quelle.indexOf("await benachrichtigen(") < quelle.indexOf("sortenVorschlag.updateMany("));
});

test("Admin-Seite zeigt den Abschnitt Vorgeschlagene Blueten", () => {
  const seite = lies("app/admin/page.tsx");
  assert.match(seite, /<BlueteVorschlaege \/>/);
});
