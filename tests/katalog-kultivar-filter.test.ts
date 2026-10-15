import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { istFilterLeer, parseStrainFilter, serialisiereFilter } from "@/lib/query/filter";

const ID = "ed9c2468f2c9b661441986de9d72f496";

test("kultivar: gültige Id gelesen und geschrieben, Großschreibung normalisiert", () => {
  const f = parseStrainFilter({ kultivar: ID.toUpperCase() });
  assert.equal(f.kultivar, ID);
  assert.equal(serialisiereFilter(f).get("kultivar"), ID);
  assert.equal(istFilterLeer(f), false);
});

test("kultivar: Müll fällt still weg", () => {
  for (const roh of ["", "abc", "x".repeat(40), "'; drop", ["a", "b"]]) {
    assert.equal(parseStrainFilter({ kultivar: roh as string }).kultivar, undefined);
  }
});

test("ansicht: Standard je Sorte, mit gewählter Blüte die Handelsnamen; der Standard steht nicht in der URL und ist kein Filter", () => {
  assert.equal(parseStrainFilter({}).ansicht, "bluete");
  assert.equal(parseStrainFilter({ ansicht: "quatsch" }).ansicht, "bluete");
  assert.equal(parseStrainFilter({ kultivar: ID }).ansicht, "ware");
  const f = parseStrainFilter({ ansicht: "ware" });
  assert.equal(f.ansicht, "ware");
  assert.equal(serialisiereFilter(f).get("ansicht"), "ware");
  assert.equal(serialisiereFilter(parseStrainFilter({})).has("ansicht"), false);
  assert.equal(serialisiereFilter(parseStrainFilter({ kultivar: ID })).has("ansicht"), false);
  assert.equal(istFilterLeer(f), true);
});

test("strains.ts: baueWhere exportiert, filtert kultivarId, Liste trägt kultivarId und vertreiberId", () => {
  const q = readFileSync("lib/query/strains.ts", "utf8");
  assert.match(q, /export function baueWhere/);
  assert.match(q, /bedingungen\.kultivarId = filter\.kultivar/);
  assert.match(q, /kultivarId: zeile\.kultivarId/);
  assert.match(q, /vertreiberId: zeile\.vertreiberId/);
});

test("Slug-Listen: höchstens 20 Einträge, damit D1 nicht über 100 Parameter kommt", () => {
  const viele = Array.from({ length: 30 }, (_, i) => `v${i}`).join(",");
  assert.equal(parseStrainFilter({ vertreiber: viele }).vertreiber.length, 20);
  assert.equal(parseStrainFilter({ apotheke: viele }).apotheke.length, 20);
});
