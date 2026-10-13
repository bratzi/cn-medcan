import { test } from "node:test";
import assert from "node:assert/strict";

import { parseStrainFilter } from "@/lib/query/filter";
import { baueWhere } from "@/lib/query/strains";

const ID = "ed9c2468f2c9b661441986de9d72f496";

test("baueWhere: Bestandsfilter tragen ohne Fachkreis die Sichtbarkeitsbedingung, mit Fachkreis nicht", () => {
  const ohne = baueWhere(parseStrainFilter({ apotheke: "x" }), false);
  assert.equal((ohne.bestaende as { some: { nurFuerFachkreise?: boolean } }).some.nurFuerFachkreise, false);
  const mit = baueWhere(parseStrainFilter({ apotheke: "x" }), true);
  assert.equal((mit.bestaende as { some: { nurFuerFachkreise?: boolean } }).some.nurFuerFachkreise, undefined);
});

test("baueWhere: kultivar setzt kultivarId", () => {
  assert.equal(baueWhere(parseStrainFilter({ kultivar: ID }), false).kultivarId, ID);
});
