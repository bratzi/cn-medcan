import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AUSGABE_STATUS, IG_STATUS, JURY_STATUS, istJuryStatus } from "@/db/enums";

test("Jury-Status-Listen", () => {
  assert.deepEqual(JURY_STATUS, ["ENTWURF", "EINGEREICHT", "VEROEFFENTLICHT", "ZURUECKGEZOGEN"]);
  assert.deepEqual(AUSGABE_STATUS, ["ENTWURF", "VEROEFFENTLICHT"]);
  assert.equal(IG_STATUS.length, 5);
  assert.equal(istJuryStatus("EINGEREICHT"), true);
  assert.equal(istJuryStatus("x"), false);
});

test("Migration legt Tabellen und Flag an", () => {
  const sql = readFileSync("migrations/0026_jury.sql", "utf8");
  for (const t of ["jury_ausgaben", "jury_beitraege", "jury_bilder"]) assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${t}`));
  assert.match(sql, /ALTER TABLE mitglied ADD COLUMN jury INTEGER NOT NULL DEFAULT 0/);
  assert.match(sql, /UPDATE mitglied SET jury = 1 WHERE rolle = 'ADMIN'/);
});
