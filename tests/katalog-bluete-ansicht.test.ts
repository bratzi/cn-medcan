import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { de } from "@/lib/i18n/de";

// Seit Task 5 (Spec 2026-10-20) laufen Ansicht, aktive Filter und Leerzustand in der Client-Insel
// components/katalog/KatalogAnsicht.tsx; AnsichtUmschalter, AktiveFilter, FilterLeiste und
// KultivarKarte sind entfallen.

test("ProduktCard: Link auf die anderen Vertreiber nur mit Zahl größer null", () => {
  const q = readFileSync("components/produkt/ProduktCard.tsx", "utf8");
  assert.match(q, /weitereVertreiber/);
  assert.match(q, /\/blueten\?kultivar=\$\{strain\.kultivarId\}/);
});

test("Katalog-Insel: Zurücksetzen im Leerzustand behält die Ansicht, Chips nennen Vertreiber nie per Id", () => {
  const insel = readFileSync("components/katalog/KatalogAnsicht.tsx", "utf8");
  assert.match(insel, /setze\(\{ \.\.\.leererFilter\(\), ansicht: filter\.ansicht \}\)/);
  assert.match(insel, /vertreiber\.get\(x\) \?\? a\.vertreiberUnbekannt/);
});

test("Trefferzeile der Handelsnamen-Ansicht zählt Handelsnamen", () => {
  assert.match(de.katalog.anzahl.other, /Handelsnamen/);
});
