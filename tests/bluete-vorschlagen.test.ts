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

test("Vorschlagen: Aktion prueft Anmeldung, nicht die Freigabe, und schreibt die Id nie aus dem Formular", () => {
  const quelle = lies("app/vorschlagen/aktionen.ts");
  assert.match(quelle, /^"use server";/);
  assert.match(quelle, /await mitgliedErforderlich\(\)/);
  assert.doesNotMatch(quelle, /freigabeErforderlich/);
  assert.match(quelle, /mitgliedId: mitglied\.mitgliedId/);
  assert.doesNotMatch(quelle, /formData\.get\("mitgliedId"\)/);
  assert.match(quelle, /MAX_OFFENE_VORSCHLAEGE/);
});

test("Vorschlagen: Seite leitet ohne Anmeldung weiter, Katalog verlinkt mit Suchbegriff", () => {
  assert.match(lies("app/vorschlagen/page.tsx"), /redirect\("\/anmelden\?weiter=%2Fvorschlagen"\)/);
  const katalog = lies("app/produkte/page.tsx");
  assert.match(katalog, /href=\{vorschlagLink\(filter\.q\)\}/);
  assert.match(lies("components/umfrage/VorschlagFormular.tsx"), /href="\/vorschlagen"/);
});
