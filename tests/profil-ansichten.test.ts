import { test } from "node:test";
import assert from "node:assert/strict";

import { monatsReihe } from "@/lib/profil-dashboard";

test("Spur kompakt: beginnt beim Monat der ersten Bewertung", () => {
  const heute = new Date("2026-10-13T00:00:00Z");
  const reihe = monatsReihe([new Date("2026-09-02T00:00:00Z"), new Date("2026-10-01T00:00:00Z")], heute, "de", { abErster: true });
  assert.equal(reihe.length, 2);
  assert.deepEqual(reihe.map((m) => m.anzahl), [1, 1]);
});

test("Spur kompakt ohne Bewertung: leere Reihe, kein Fehler (Review Focus)", () => {
  assert.deepEqual(monatsReihe([], new Date("2026-10-13T00:00:00Z"), "de", { abErster: true }), []);
});

test("Spur kompakt: laenger als zwoelf Monate her, hoechstens zwoelf", () => {
  const reihe = monatsReihe([new Date("2024-01-05T00:00:00Z")], new Date("2026-10-13T00:00:00Z"), "de", { abErster: true });
  assert.equal(reihe.length, 12);
  assert.equal(reihe.at(-1)?.laufend, true);
});
