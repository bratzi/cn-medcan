import assert from "node:assert/strict";
import { test } from "node:test";
import { CHIPS, SORTIER_MEHR, SORTIER_SEGMENT, chipZahl, sichtbareChips } from "@/lib/katalog/chipleiste";
import { SORTIERUNGEN, leererFilter } from "@/lib/query/filter";

const f = (teil = {}) => ({ ...leererFilter(), ...teil });

test("chipZahl zählt aktive Werte je Chip", () => {
  assert.equal(chipZahl(f(), "terpene"), 0);
  assert.equal(chipZahl(f({ terp: ["Myrcen", "Limonen"] }), "terpene"), 2);
  assert.equal(chipZahl(f({ note: 4, bewertet: true }), "community"), 2);
  assert.equal(chipZahl(f({ thcMin: 20, cbd: true }), "thc"), 2);
  assert.equal(chipZahl(f({ apotheke: ["a"], preisMax: 900 }), "mehr"), 2);
  assert.equal(chipZahl(f({ nurVerfuegbar: true }), "verfuegbar"), 1);
});

test("leerer Filter: kein Chip zeigt einen Zähler", () => {
  for (const c of CHIPS) assert.equal(chipZahl(f(), c), 0, c);
});

test("Sortier-Segment plus Mehr deckt alle Sortierungen genau einmal ab", () => {
  assert.deepEqual([...SORTIER_SEGMENT, ...SORTIER_MEHR].sort(), [...SORTIERUNGEN].sort());
});

test("Relevanz liegt im Mehr-Menü (Suchtext springt dorthin)", () => {
  assert.ok(SORTIER_MEHR.includes("relevanz"));
});

test("Chip Mehr nur für Fachkreis", () => {
  assert.ok(!sichtbareChips(false).includes("mehr"));
  assert.deepEqual(sichtbareChips(true), [...CHIPS]);
});
