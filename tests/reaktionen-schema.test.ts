import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ZIEL_ARTEN, KOMMENTAR_ZIELE, KOMMENTAR_STATUS, BENACHRICHTIGUNG_ARTEN } from "@/db/enums";

const lies = (p: string) => readFileSync(p, "utf8");

test("0023: vier Tabellen, rein additiv", () => {
  const sql = lies("migrations/0023_kommentare_likes.sql");
  for (const t of ["likes", "kommentare", "kommentar_meldungen", "zaehler"]) assert.match(sql, new RegExp(`CREATE TABLE "${t}"`));
  assert.doesNotMatch(sql, /DROP TABLE|d1_migrations/);
});

test("Wertelisten und Trigger stimmen überein", () => {
  assert.deepEqual([...ZIEL_ARTEN], ["BEWERTUNG", "BLUETE", "MITGLIED"]);
  assert.deepEqual([...KOMMENTAR_ZIELE], ["BEWERTUNG", "PROFIL"]);
  assert.deepEqual([...KOMMENTAR_STATUS], ["SICHTBAR", "GEMELDET", "GELOESCHT"]);
  for (const a of ["LIKE", "FOLGT", "KOMMENTAR", "KOMMENTAR_GEMELDET"]) assert.ok((BENACHRICHTIGUNG_ARTEN as readonly string[]).includes(a), a);
  const c = lies("db/constraints.sql");
  for (const t of ["likes_insert_chk", "kommentare_insert_chk", "kommentare_update_chk", "zaehler_insert_chk"]) assert.match(c, new RegExp(t));
  for (const a of ["LIKE", "FOLGT", "KOMMENTAR", "KOMMENTAR_GEMELDET"]) assert.match(c, new RegExp(`'${a}'`));
});
