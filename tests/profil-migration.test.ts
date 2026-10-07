import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/**
 * Migration 0017 (Spec 2026-10-07): nutzer_profil je Mitglied, dazu
 * nutzer_empfehlungen.bestaetigt mit Vorgabe 0. Rein additiv.
 */
const sql = (name: string) => readFileSync(join(process.cwd(), "migrations", name), "utf8");

function datenbank() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE "strains" ("id" TEXT NOT NULL PRIMARY KEY);
    CREATE TABLE "mitglied" ("id" TEXT NOT NULL PRIMARY KEY);
    INSERT INTO "strains" VALUES ('s1');
    INSERT INTO "mitglied" VALUES ('m1');
  `);
  db.exec(sql("0014_nutzer_empfehlungen.sql"));
  db.prepare(`INSERT INTO "nutzer_empfehlungen" ("mitglied_id", "strain_id", "rang", "score", "bezug_strain_id", "gemeinsam") VALUES ('m1', 's1', 1, 0.9, 's1', '[]')`).run();
  db.exec(sql("0017_nutzer_profil.sql"));
  return db;
}

const profilZeile = (id: string) =>
  `INSERT INTO "nutzer_profil" ("mitglied_id", "geschmack", "terpene", "anzahl", "gewichtet", "berechnet_am") VALUES ('${id}', '{}', '[]', 0, 0, CURRENT_TIMESTAMP)`;

test("0017: bestehende Empfehlungen gelten als nicht bestätigt", () => {
  const db = datenbank();
  assert.deepEqual(db.prepare(`SELECT "bestaetigt" FROM "nutzer_empfehlungen"`).get(), { bestaetigt: 0 });
});

test("0017: ein Profil je Mitglied, geht mit dem Mitglied", () => {
  const db = datenbank();
  const neu = db.prepare(profilZeile("m1"));
  neu.run();
  assert.throws(() => neu.run(), /UNIQUE|PRIMARY KEY/);
  db.prepare(`DELETE FROM "mitglied" WHERE "id" = 'm1'`).run();
  assert.equal((db.prepare(`SELECT COUNT(*) AS n FROM "nutzer_profil"`).get() as { n: number }).n, 0);
});

test("0017: unbekanntes Mitglied wird abgewiesen", () => {
  const db = datenbank();
  assert.throws(() => db.prepare(profilZeile("x")).run(), /FOREIGN KEY/);
});
