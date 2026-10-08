import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

import { d1Datum, profilErsetzen, type ProfilZeile } from "@/lib/profil";

const zeile = (anzahl: number): ProfilZeile => ({
  geschmack: '{"FRUCHTIG":1}',
  terpene: "[]",
  anzahl,
  gewichtet: anzahl,
  oeffentlich: "{}",
  verlauf: "[]",
  berechnetAm: new Date(Date.UTC(2026, 9, 8, 12, 0, 0)),
});

function tabelle() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE nutzer_profil (
    mitglied_id TEXT PRIMARY KEY, geschmack TEXT NOT NULL, terpene TEXT NOT NULL,
    anzahl INTEGER NOT NULL, gewichtet INTEGER NOT NULL, oeffentlich TEXT, verlauf TEXT,
    berechnet_am DATETIME NOT NULL)`);
  return db;
}

test("d1Datum schreibt wie der Prisma-D1-Adapter", () => {
  assert.equal(d1Datum(new Date(Date.UTC(2026, 9, 8, 12, 0, 0))), "2026-10-08T12:00:00.000+00:00");
});

test("profilErsetzen legt an und ersetzt beim zweiten Mal (eine Zeile)", () => {
  const db = tabelle();
  for (const n of [1, 2]) {
    const a = profilErsetzen("m1", zeile(n));
    db.prepare(a.sql).run(...a.params);
  }
  const zeilen = db.prepare("SELECT * FROM nutzer_profil").all() as Record<string, unknown>[];
  assert.equal(zeilen.length, 1);
  assert.equal(zeilen[0].anzahl, 2);
  assert.equal(zeilen[0].verlauf, "[]");
  assert.equal(zeilen[0].berechnet_am, "2026-10-08T12:00:00.000+00:00");
});

test("profilErsetzen bindet genau acht Werte, Mitglied zuerst", () => {
  const a = profilErsetzen("m1", zeile(3));
  assert.equal(a.params.length, 8);
  assert.equal(a.params[0], "m1");
  assert.match(a.sql, /ON CONFLICT\(mitglied_id\) DO UPDATE/);
});
