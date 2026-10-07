import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/** Migration 0020 (Profil Stufe 3): Verlauf als JSON-Spalte, bestehende Profile ohne Verlauf. */
test("0020: bestehende Profile haben verlauf NULL, neue Werte lassen sich schreiben", () => {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE "nutzer_profil" ("mitglied_id" TEXT NOT NULL PRIMARY KEY, "geschmack" TEXT NOT NULL);
           INSERT INTO "nutzer_profil" VALUES ('m1', '{}');`);
  db.exec(readFileSync(join(process.cwd(), "migrations", "0020_profil_verlauf.sql"), "utf8"));
  assert.deepEqual(db.prepare(`SELECT "verlauf" AS v FROM "nutzer_profil"`).get(), { v: null });
  db.prepare(`UPDATE "nutzer_profil" SET "verlauf" = '[]'`).run();
  assert.deepEqual(db.prepare(`SELECT "verlauf" AS v FROM "nutzer_profil"`).get(), { v: "[]" });
});
