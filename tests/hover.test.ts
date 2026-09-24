import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Angefasste Dateien der Welle 1: Hover nie über Deckkraft (Spec TP2 3.10). */
export const DATEIEN = [
  "app/produkte/[slug]/page.tsx",
  "app/reviews/page.tsx",
  "components/produkt/BestandTabelle.tsx",
  "components/produkt/CannabinoidBar.tsx",
  "components/produkt/TerpenChips.tsx",
  "components/produkt/Titelblatt.tsx",
  "components/review/CommunityStimmen.tsx",
  "components/review/Doppelseite.tsx",
  "components/review/Inhaltsverzeichnis.tsx",
];

test("kein Deckkraft-Hover in den angefassten Dateien", () => {
  const treffer = DATEIEN.filter((datei) => /hover:opacity/.test(readFileSync(join(process.cwd(), datei), "utf8")));
  assert.deepEqual(treffer, []);
});
