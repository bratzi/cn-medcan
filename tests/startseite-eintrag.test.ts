import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Nutzer 2026-10-09: die Startseite zieht bei der Darstellung der Bewertungen immer mit /reviews mit.
test("Startseite zeigt den neuesten Eintrag als Doppelseite wie das große Buch", () => {
  const quelle = readFileSync("components/story/NeuesterEintrag.tsx", "utf8");
  assert.match(quelle, /<BuchDoppelseite[^>]*\bsorte\b/);
  assert.match(quelle, /<Buch\b/);
  assert.match(quelle, /ladeNeuestenBetreiberEintrag/);
});

test("Neuester Eintrag: nur freigegebene Bewertungen des Betreibers zu aktiven Sorten", () => {
  const quelle = readFileSync("lib/query/buch-band.ts", "utf8");
  const abfrage = quelle.slice(quelle.indexOf("export const ladeNeuestenBetreiberEintrag"));
  assert.match(abfrage, /where: \{ \.\.\.WO, istRedaktionell: true \}/);
  assert.match(quelle, /const WO = \{ freigegeben: true, strain: \{ aktiv: true \} \}/);
});
