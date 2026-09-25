import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (pfad: string) => readFileSync(pfad, "utf8");

// Live 2026-09-25, Fehler 1102 "Worker exceeded resource limits": jede Seite loeste
// fuer die sichtbaren Links Prefetches aus, die auf dem Server ganze dynamische
// Seiten rendern (gemessen bis 212 ms CPU, Grenze im Free-Plan 10 ms). Die
// haeufigsten Links (Kopf, Fuss, Bluetenkarten) prefetchen deshalb nicht.
test("Kopf, Fuss und Bluetenkarten prefetchen nicht", () => {
  assert.match(lies("components/layout/NavLink.tsx"), /prefetch=\{false\}/);
  assert.match(lies("components/layout/Fuss.tsx"), /<Link href=\{link\.href\} prefetch=\{false\}/);
  assert.match(lies("components/produkt/ProduktCard.tsx"), /prefetch=\{false\}/);
});
