import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

test("0029 fügt umfragen.monat mit Unique-Index hinzu, zweimal einspielbar ist nicht nötig, einmal reicht", () => {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE umfragen (id TEXT PRIMARY KEY, titel TEXT NOT NULL, phase TEXT NOT NULL, aktiv TEXT UNIQUE)`);
  db.exec(readFileSync("migrations/0029_sotm_monat.sql", "utf8"));
  db.prepare(`INSERT INTO umfragen (id, titel, phase, aktiv, monat) VALUES ('a', 't', 'VORSCHLAG', 'AKTIV', '2026-11')`).run();
  assert.throws(() => db.prepare(`INSERT INTO umfragen (id, titel, phase, monat) VALUES ('b', 't', 'BEENDET', '2026-11')`).run(), /UNIQUE/);
  db.prepare(`INSERT INTO umfragen (id, titel, phase) VALUES ('c', 't', 'BEENDET')`).run();
  db.prepare(`INSERT INTO umfragen (id, titel, phase) VALUES ('d', 't', 'BEENDET')`).run();
});
