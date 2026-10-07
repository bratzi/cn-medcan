import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/** Migration 0018 (Spec Profil 9): Opt-in fürs öffentliche Profil, Kurz-Id eindeutig. */
function datenbank() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE "mitglied" ("id" TEXT NOT NULL PRIMARY KEY); INSERT INTO "mitglied" VALUES ('m1'), ('m2');`);
  db.exec(readFileSync(join(process.cwd(), "migrations", "0018_profil_oeffentlich.sql"), "utf8"));
  return db;
}

test("0018: bestehende Mitglieder sind privat und ohne Kurz-Id", () => {
  const db = datenbank();
  assert.deepEqual(db.prepare(`SELECT "profil_oeffentlich" AS o, "kurz_id" AS k FROM "mitglied" WHERE "id" = 'm1'`).get(), { o: 0, k: null });
});

test("0018: Kurz-Id ist eindeutig, mehrere NULL sind erlaubt", () => {
  const db = datenbank();
  db.prepare(`UPDATE "mitglied" SET "kurz_id" = 'abcd2345' WHERE "id" = 'm1'`).run();
  assert.throws(() => db.prepare(`UPDATE "mitglied" SET "kurz_id" = 'abcd2345' WHERE "id" = 'm2'`).run(), /UNIQUE/);
});
