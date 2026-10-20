import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("TransparentMachen trägt nur noch das Manifest", () => {
  const q = readFileSync("components/story/TransparentMachen.tsx", "utf8");
  assert.doesNotMatch(q, /<Paar\b|PUNKTE/);
});

test("BewertungSchritte nummeriert Overall, Terpz, Qualität 1 bis 3", () => {
  const q = readFileSync("components/story/BewertungSchritte.tsx", "utf8");
  assert.match(q, /data-story="bewertung"/);
  assert.match(q, /overall[\s\S]*terpz[\s\S]*qualitaet/);
  assert.match(q, /ladeNeuestenBetreiberEintrag/);
});

test("Texte de/en vorhanden", () => {
  for (const w of [de, en]) {
    assert.ok(w.start.bewertung.titel);
    assert.match(w.start.bewertung.schritt, /\{nummer\}/);
  }
});

test("Zeiger-Tiefe gilt der neuen Sektion", () => {
  assert.match(readFileSync("components/story/bewegung/punkte.ts", "utf8"), /data-story="bewertung"/);
});
