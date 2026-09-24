import { test } from "node:test";
import assert from "node:assert/strict";

import { teileBewertungen } from "@/lib/query/bewertung";

function bewertung(id: string, istRedaktionell: boolean, tag: number, note: number) {
  return {
    id,
    istRedaktionell,
    erstelltAm: new Date(Date.UTC(2026, 8, tag, 12)),
    aussehen: note,
    geruch: note,
    geschmack: note,
    wirkung: note,
    konsistenz: note,
  };
}

test("eigene und Community getrennt, je neueste zuerst", () => {
  const t = teileBewertungen([
    bewertung("c1", false, 3, 3),
    bewertung("e1", true, 1, 4),
    bewertung("e2", true, 5, 5),
    bewertung("c2", false, 9, 2),
  ]);
  assert.deepEqual(t.eigene.map((b) => b.id), ["e2", "e1"]);
  assert.deepEqual(t.community.map((b) => b.id), ["c2", "c1"]);
});

test("Meine Note ist die Gesamtnote der neuesten eigenen, kein Mittel", () => {
  const t = teileBewertungen([bewertung("e1", true, 1, 2), bewertung("e2", true, 5, 5)]);
  assert.equal(t.meineNote, 5);
});

test("Community-Mittel über die Gesamtnoten, auf eine Stelle gerundet", () => {
  const t = teileBewertungen([
    bewertung("c1", false, 1, 3),
    bewertung("c2", false, 2, 4),
    bewertung("c3", false, 3, 4),
  ]);
  assert.equal(t.communityMittel, 3.7);
});

test("nur Community: keine eigene Note, Community vollständig", () => {
  const t = teileBewertungen([bewertung("c1", false, 1, 3)]);
  assert.equal(t.meineNote, null);
  assert.equal(t.eigene.length, 0);
  assert.equal(t.communityMittel, 3);
});

test("keine Bewertungen: beides null", () => {
  const t = teileBewertungen([]);
  assert.equal(t.meineNote, null);
  assert.equal(t.communityMittel, null);
});
