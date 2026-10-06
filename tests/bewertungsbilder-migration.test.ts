import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/**
 * Migration 0016 (Spec 2026-10-06): budpics bekommt review_id. Bestehende
 * Bilder bleiben frei (NULL), Bilder einer Bewertung gehen mit ihr, ein
 * Aktualisieren der Bewertung lässt sie stehen. D1 prüft Fremdschlüssel,
 * deshalb hier PRAGMA foreign_keys = ON.
 */
const sql = (name: string) => readFileSync(join(process.cwd(), "migrations", name), "utf8");

function datenbank() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE "strains" ("id" TEXT NOT NULL PRIMARY KEY);
    CREATE TABLE "mitglied" ("id" TEXT NOT NULL PRIMARY KEY);
    CREATE TABLE "reviews" ("id" TEXT NOT NULL PRIMARY KEY, "notiz" TEXT);
    INSERT INTO "strains" VALUES ('s1');
    INSERT INTO "mitglied" VALUES ('m1');
    INSERT INTO "reviews" VALUES ('r1', NULL);
  `);
  db.exec(sql("0012_budpics.sql"));
  db.prepare(`INSERT INTO "budpics" ("id", "strain_id", "mitglied_id", "daten", "breite", "hoehe") VALUES ('alt', 's1', 'm1', x'00', 1, 1)`).run();
  db.exec(sql("0016_bewertungsbilder.sql"));
  return db;
}

const neu = (db: Database, id: string, review: string | null) =>
  db
    .prepare(`INSERT INTO "budpics" ("id", "strain_id", "mitglied_id", "daten", "breite", "hoehe", "review_id") VALUES (?, 's1', 'm1', x'00', 1, 1, ?)`)
    .run(id, review);

test("0016: bestehende Budpics bleiben frei", () => {
  const db = datenbank();
  assert.deepEqual(db.prepare(`SELECT "review_id" FROM "budpics" WHERE "id" = 'alt'`).get(), { review_id: null });
});

test("0016: Bild an einer Bewertung, Aktualisieren lässt es stehen, Löschen nimmt es mit", () => {
  const db = datenbank();
  neu(db, "b1", "r1");
  db.prepare(`UPDATE "reviews" SET "notiz" = 'neu' WHERE "id" = 'r1'`).run();
  assert.equal((db.prepare(`SELECT COUNT(*) AS n FROM "budpics" WHERE "review_id" = 'r1'`).get() as { n: number }).n, 1);
  db.prepare(`DELETE FROM "reviews" WHERE "id" = 'r1'`).run();
  assert.equal((db.prepare(`SELECT COUNT(*) AS n FROM "budpics" WHERE "id" = 'b1'`).get() as { n: number }).n, 0);
  assert.equal((db.prepare(`SELECT COUNT(*) AS n FROM "budpics" WHERE "id" = 'alt'`).get() as { n: number }).n, 1);
});

test("0016: unbekannte Bewertung wird abgewiesen", () => {
  const db = datenbank();
  assert.throws(() => neu(db, "b2", "gibt-es-nicht"), /FOREIGN KEY/);
});

test("0016: Index für Bilder je Bewertung und Status", () => {
  const db = datenbank();
  const index = db.prepare(`SELECT "name" FROM sqlite_master WHERE "type" = 'index' AND "name" = 'budpics_review_id_status_idx'`).get();
  assert.ok(index);
});
