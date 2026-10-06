import { test } from "node:test";
import assert from "node:assert/strict";

import { MEDIEN } from "@/lib/medien";
import { BUDPIC_MAX_BYTES, budpicAusBewertung, istBudpicId, musterBildId, skalierteMasse, slugHash } from "@/lib/budpics";

test("musterBildId ist je Slug stabil und zeigt auf ein vorhandenes Foto", () => {
  const ids = new Set(MEDIEN.filter((m) => m.art === "foto").map((m) => m.id));
  for (const slug of ["blue-dream", "gelato-41", "x", "", "Ünï-çödé"]) {
    const id = musterBildId(slug);
    assert.equal(id, musterBildId(slug));
    assert.ok(ids.has(id), `${slug}: ${id} fehlt in lib/medien.ts`);
    assert.match(id, /^bluete-(0[1-9]|10)$/);
  }
});

test("musterBildId streut ueber mehrere Motive", () => {
  const motive = new Set(Array.from({ length: 60 }, (_, i) => musterBildId(`sorte-${i}`)));
  assert.ok(motive.size >= 6, `nur ${motive.size} verschiedene Motive`);
});

test("slugHash liefert eine nichtnegative ganze Zahl", () => {
  assert.ok(Number.isInteger(slugHash("a")) && slugHash("a") >= 0);
});

test("skalierteMasse begrenzt die lange Kante und behaelt das Verhaeltnis", () => {
  assert.deepEqual(skalierteMasse(4000, 3000), { breite: 1280, hoehe: 960 });
  assert.deepEqual(skalierteMasse(3000, 4000), { breite: 960, hoehe: 1280 });
  assert.deepEqual(skalierteMasse(800, 600), { breite: 800, hoehe: 600 });
  assert.deepEqual(skalierteMasse(10000, 1), { breite: 1280, hoehe: 1 });
});

test("Grenze eines Bildes ist 150 KB", () => {
  assert.equal(BUDPIC_MAX_BYTES, 153600);
});

test("istBudpicId nimmt nur UUIDs", () => {
  assert.equal(istBudpicId("3f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc"), true);
  assert.equal(istBudpicId("../etc"), false);
  assert.equal(istBudpicId(42), false);
});

test("budpicAusBewertung: nur mit Review-Id", () => {
  assert.equal(budpicAusBewertung("3f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc"), true);
  assert.equal(budpicAusBewertung(null), false);
});
