import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const karte = readFileSync("components/katalog/KatalogKarte.tsx", "utf8");

test("Karte: Community-Zeile steht vor Name und THC", () => {
  const c = karte.indexOf("data-community");
  const n = karte.indexOf("data-name");
  const thc = karte.indexOf("data-fuss");
  assert.ok(c > 0 && n > c && thc > n, "Reihenfolge Community, Name, Fuß");
});

test("Karte: Handelsname nie in Handschrift, Wert hat sr-only-Text", () => {
  assert.doesNotMatch(karte, /data-name[^>]*font-hand/);
  assert.match(karte, /sr-only/);
});

test("Blättern: Links funktionieren ohne JS, aktuelle Seite markiert", () => {
  const b = readFileSync("components/katalog/Blaettern.tsx", "utf8");
  assert.match(b, /href=\{hrefFuer\(/);
  assert.match(b, /aria-current="page"/);
  assert.match(b, /preventDefault\(\)/);
});
