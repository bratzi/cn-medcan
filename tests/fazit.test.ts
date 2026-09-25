import { test } from "node:test";
import assert from "node:assert/strict";

import { communityFazit } from "@/lib/fazit";

test("Fazit: Mittel aus Gesamteindruck (1..5), Terpen-Treue (0..1) und Beschaffenheit (0..5)", () => {
  // Eindruck 5/5 -> 1, Treue 0.5, Beschaffenheit 2.5/5 -> 0.5  => (1 + 0.5 + 0.5) / 3
  const wert = communityFazit({ eindruck: { aussehen: 5, geruch: 5 }, treue: 0.5, beschaffenheit: { chlorophyll: 2.5 } });
  assert.equal(wert, 2 / 3);
});

test("Fazit: Eindruck 1 ist 0 %, fehlende Stufen fallen heraus", () => {
  assert.equal(communityFazit({ eindruck: { aussehen: 1 }, treue: null, beschaffenheit: {} }), 0);
  assert.equal(communityFazit({ eindruck: {}, treue: 0.8, beschaffenheit: {} }), 0.8);
});

test("Fazit: ohne jede Stufe null", () => {
  assert.equal(communityFazit({ eindruck: {}, treue: null, beschaffenheit: {} }), null);
});
