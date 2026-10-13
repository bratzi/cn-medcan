import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { waehleBeispiel, type BeispielKandidat } from "@/lib/query/vertreiber-beispiel";

const k = (teil: Partial<BeispielKandidat>): BeispielKandidat => ({
  kultivarId: "k", name: "K", bewerteteVertreiber: 0, bewertungen: 0, handelsnamen: 2, ...teil,
});

test("waehleBeispiel: mehr bewertete Vertreiber schlagen mehr Bewertungen", () => {
  const sieger = waehleBeispiel([
    k({ kultivarId: "a", name: "A", bewerteteVertreiber: 1, bewertungen: 9 }),
    k({ kultivarId: "b", name: "B", bewerteteVertreiber: 2, bewertungen: 2 }),
  ]);
  assert.equal(sieger?.kultivarId, "b");
});

test("waehleBeispiel: Gleichstand über Bewertungen, Handelsnamen, dann Name", () => {
  assert.equal(waehleBeispiel([k({ kultivarId: "a", bewertungen: 1 }), k({ kultivarId: "b", bewertungen: 3 })])?.kultivarId, "b");
  assert.equal(waehleBeispiel([k({ kultivarId: "a", handelsnamen: 2 }), k({ kultivarId: "b", handelsnamen: 5 })])?.kultivarId, "b");
  assert.equal(waehleBeispiel([k({ kultivarId: "z", name: "Zkittlez" }), k({ kultivarId: "m", name: "MAC 1" })])?.kultivarId, "m");
});

test("waehleBeispiel: nur Kultivare mit mindestens zwei Handelsnamen, sonst null", () => {
  assert.equal(waehleBeispiel([k({ handelsnamen: 1, bewerteteVertreiber: 1 })]), null);
  assert.equal(waehleBeispiel([]), null);
});

test("ladeVertreiberBeispiel: jede Abfrage begrenzt, kein Roh-SQL, Liste über ladeVertreiberDerBluete", () => {
  const q = readFileSync("lib/query/vertreiber-beispiel.ts", "utf8");
  assert.doesNotMatch(q, /\$queryRaw|\$executeRaw/);
  // Drei findMany, jede begrenzt: zweimal KANDIDATEN_MAX, einmal 20 (wie der groupBy-Rückfall).
  assert.equal((q.match(/findMany\(/g) ?? []).length, 3);
  assert.equal((q.match(/take: KANDIDATEN_MAX/g) ?? []).length, 2);
  assert.equal((q.match(/take: 20/g) ?? []).length, 2);
  assert.match(q, /ladeVertreiberDerBluete\(/);
});
