import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { BENACHRICHTIGUNG_ARTEN, VORSCHLAG_STATUS } from "@/db/enums";

const lies = (pfad: string) => readFileSync(pfad, "utf8");

test("Trigger kennen genau die Wertelisten aus db/enums.ts", () => {
  const sql = lies("db/constraints.sql");
  const status = VORSCHLAG_STATUS.map((w) => `'${w}'`).join(",");
  const arten = BENACHRICHTIGUNG_ARTEN.map((w) => `'${w}'`).join(",");
  assert.match(sql, new RegExp(String.raw`sorten_vorschlaege_insert_chk[\s\S]*NEW\.status not in \(${status}\)`));
  assert.match(sql, new RegExp(String.raw`sorten_vorschlaege_update_chk[\s\S]*NEW\.status not in \(${status}\)`));
  assert.match(sql, new RegExp(String.raw`benachrichtigungen_insert_chk[\s\S]*NEW\.art not in \(${arten}\)`));
});

test("Migration 0006 legt beide Tabellen samt Unique-Index an", () => {
  const sql = lies("migrations/0006_sorten_vorschlaege.sql");
  assert.match(sql, /CREATE TABLE "sorten_vorschlaege"/);
  assert.match(sql, /CREATE TABLE "benachrichtigungen"/);
  assert.match(sql, /CREATE UNIQUE INDEX "sorten_vorschlaege_mitglied_id_schluessel_key"/);
  assert.doesNotMatch(sql, /d1_migrations/);
});
