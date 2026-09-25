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

// Live 2026-09-25: /admin sprengte mit den Vorschlaegen die 10-ms-CPU-Grenze (Worker exceeded
// resource limits). Die Pruefung hat deshalb eine eigene Seite; /admin zeigt nur eine Zaehlkarte.
test("Vorschlaege stehen auf /admin/vorschlaege, /admin zaehlt nur", () => {
  const seite = lies("app/admin/page.tsx");
  assert.doesNotMatch(seite, /<BlueteVorschlaege \/>/);
  assert.match(seite, /href="\/admin\/vorschlaege"/);
  assert.match(seite, /sortenVorschlag\.count\(/);
  const eigene = lies("app/admin/vorschlaege/page.tsx");
  assert.match(eigene, /<BlueteVorschlaege \/>/);
  assert.match(eigene, /notFound\(\)/);
  assert.match(lies("app/admin/vorschlag-aktionen.ts"), /revalidatePath\("\/admin\/vorschlaege"\)/);
});
