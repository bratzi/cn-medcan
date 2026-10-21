import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const lies = (p: string) => readFileSync(p, "utf8");

test("Aroma-Kopf: Erklärtext steht im InfoKnopf, nicht als Absatz", () => {
  const sektion = lies("components/story/AromaSektion.tsx");
  assert.doesNotMatch(sektion, /<p[^>]*>\{texte\.text\}<\/p>/);
  assert.match(sektion, /<InfoKnopf[^>]*text=\{texte\.text\}/);
});

test("Explorer: kein eigener Strain-Link, Hinweis im InfoKnopf neben der Vertreiberzeile", () => {
  const explorer = lies("components/story/SortenExplorer.tsx");
  assert.doesNotMatch(explorer, /texte\.zurSorte/);
  assert.doesNotMatch(explorer, /<p[^>]*>\{texte\.hinweis\}<\/p>/);
  assert.match(explorer, /<InfoKnopf[^>]*text=\{texte\.hinweis\}/);
  assert.match(explorer, /onWare\?\.\(/);
});

test("Am Ende der Bewertung genau ein Link zum Strain, mit gewähltem Vertreiber", () => {
  const wechsel = lies("components/story/AromaWechsel.tsx");
  assert.equal((wechsel.match(/texte\.zurSorte/g) ?? []).length, 1);
  assert.match(wechsel, /\?vertreiber=\$\{encodeURIComponent\(vertreiber\)\}/);
});
