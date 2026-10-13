import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  fasseBewertungenZusammen,
  waehleBeispiel,
  zaehleVertreiberJeKultivar,
  type BeispielKandidat,
} from "@/lib/query/vertreiber-beispiel";

const k = (teil: Partial<BeispielKandidat>): BeispielKandidat => ({
  kultivarId: "k", name: "K", bewerteteVertreiber: 0, bewertungen: 0, vertreiber: 2, handelsnamen: 2, ...teil,
});

test("waehleBeispiel: mehr bewertete Vertreiber schlagen mehr Bewertungen", () => {
  const sieger = waehleBeispiel([
    k({ kultivarId: "a", name: "A", bewerteteVertreiber: 1, bewertungen: 9 }),
    k({ kultivarId: "b", name: "B", bewerteteVertreiber: 2, bewertungen: 2 }),
  ]);
  assert.equal(sieger?.kultivarId, "b");
});

test("waehleBeispiel: Gleichstand über Bewertungen, Vertreiber, Handelsnamen, dann Name", () => {
  assert.equal(waehleBeispiel([k({ kultivarId: "a", bewertungen: 1 }), k({ kultivarId: "b", bewertungen: 3 })])?.kultivarId, "b");
  assert.equal(waehleBeispiel([k({ kultivarId: "a", vertreiber: 2 }), k({ kultivarId: "b", vertreiber: 4 })])?.kultivarId, "b");
  assert.equal(waehleBeispiel([k({ kultivarId: "z", name: "Zkittlez" }), k({ kultivarId: "m", name: "MAC 1" })])?.kultivarId, "m");
});

test("waehleBeispiel: nur Kultivare mit mindestens zwei Vertreibern, sonst null", () => {
  assert.equal(waehleBeispiel([k({ vertreiber: 1, bewerteteVertreiber: 1 })]), null);
  // Viele Handelsnamen, aber nur eine Firma: kein Vergleich.
  assert.equal(waehleBeispiel([k({ vertreiber: 1, handelsnamen: 6 })]), null);
  assert.equal(waehleBeispiel([]), null);
});

test("zaehleVertreiberJeKultivar: verschiedene bekannte Vertreiber, null zählt nicht", () => {
  const z = zaehleVertreiberJeKultivar([
    { kultivarId: "a", vertreiberId: "v1" },
    { kultivarId: "a", vertreiberId: "v2" },
    { kultivarId: "a", vertreiberId: "v1" },
    { kultivarId: "b", vertreiberId: null },
    { kultivarId: null, vertreiberId: "v1" },
  ]);
  assert.equal(z.get("a"), 2);
  assert.equal(z.has("b"), false);
  assert.equal(z.size, 1);
});

test("fasseBewertungenZusammen: Summe je Kultivar, vertreiberId null zählt Bewertung, nicht Vertreiber", () => {
  const m = fasseBewertungenZusammen([
    { qualitaetAnzahl: 3, strain: { kultivarId: "a", vertreiberId: "v1" } },
    { qualitaetAnzahl: 2, strain: { kultivarId: "a", vertreiberId: "v1" } },
    { qualitaetAnzahl: 4, strain: { kultivarId: "a", vertreiberId: null } },
    { qualitaetAnzahl: 1, strain: { kultivarId: null, vertreiberId: "v9" } },
  ]);
  assert.equal(m.get("a")?.bewertungen, 9);
  assert.equal(m.get("a")?.vertreiber.size, 1);
  assert.equal(m.size, 1);
});

test("ladeVertreiberBeispiel: jede Abfrage begrenzt, kein Roh-SQL, Liste über ladeVertreiberDerBluete", () => {
  const q = readFileSync("lib/query/vertreiber-beispiel.ts", "utf8");
  assert.doesNotMatch(q, /\$queryRaw|\$executeRaw/);
  // Drei findMany, jede begrenzt: zweimal KANDIDATEN_MAX, einmal 20; die Vertreiber-Gruppierung trägt GRUPPEN_MAX.
  assert.equal((q.match(/findMany\(/g) ?? []).length, 3);
  assert.equal((q.match(/take: KANDIDATEN_MAX/g) ?? []).length, 2);
  assert.equal((q.match(/take: 20/g) ?? []).length, 2);
  assert.match(q, /take: GRUPPEN_MAX/);
  assert.match(q, /ladeVertreiberDerBluete\(/);
});
