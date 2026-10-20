import assert from "node:assert/strict";
import { test } from "node:test";
import Database from "better-sqlite3";

import { KATALOG_SQL_KULTIVARE, KATALOG_SQL_WAREN } from "@/lib/katalog/laden";
import type { KatalogKultivar } from "@/lib/katalog/typen";

test("Katalog-SQL: öffentlich nur Bestände ohne Fachkreis-Pflicht", () => {
  const sql = KATALOG_SQL_WAREN(false);
  assert.match(sql, /nur_fuer_fachkreise\s*=\s*0/);
  assert.match(sql, /s\.aktiv\s*=\s*1/);
});

test("Katalog-SQL: Fachkreis ohne Bestandsgrenze", () => {
  assert.doesNotMatch(KATALOG_SQL_WAREN(true), /nur_fuer_fachkreise/);
});

test("Katalog-SQL: jedes Wire-Feld der Ware ist gesetzt", () => {
  const sql = KATALOG_SQL_WAREN(false);
  for (const feld of ["i", "s", "h", "k", "y", "f", "g", "t0", "t1", "c0", "c1", "v", "b", "tp", "st", "u"])
    assert.match(sql, new RegExp(`'${feld}',`), `Feld ${feld} fehlt`);
});

test("Katalog-SQL der Blüten: gm bettet geschmack_median als JSON ein (json(...), kein Parsen im Worker)", () => {
  assert.match(KATALOG_SQL_KULTIVARE, /'gm',\s*json\(/);
  assert.match(KATALOG_SQL_KULTIVARE, /kk\.geschmack_median/);
});

/** Echte Kennwerte aus D1 („Apples & Bananas“, 4 Bewertungen, 2026-10-20). */
const APPLES_BANANAS = { diesel: 0, zitrus: 0.5, erdig: 3.25, suess: 4.5, wuerzig: 0.5, blumig: 0, holzig: 2.5, kraeutrig: 0.5, fruchtig: 0, minzig: 0 };

test("Katalog-SQL der Blüten in SQLite: gm ist ein Objekt, null ohne Kennwerte, ohne Stimmen oder bei kaputtem Text", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE kultivare (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT);
    CREATE TABLE kultivar_kennwerte (kultivar_id TEXT PRIMARY KEY, terpen_median TEXT NOT NULL, geschmack_median TEXT NOT NULL,
      gesamtnote_median REAL, gesamtnote_mittel REAL, anzahl INTEGER NOT NULL);
    CREATE TABLE strains (id TEXT PRIMARY KEY, kultivar_id TEXT, aktiv INTEGER NOT NULL);
    CREATE TABLE reviews (id TEXT PRIMARY KEY, kultivar_id TEXT, ist_redaktionell INTEGER NOT NULL, freigegeben INTEGER NOT NULL,
      gesamtnote REAL, erstellt_am TEXT);
  `);
  const kultivar = db.prepare("INSERT INTO kultivare (id, name, slug) VALUES (?, ?, ?)");
  const kennwerte = db.prepare(
    "INSERT INTO kultivar_kennwerte (kultivar_id, terpen_median, geschmack_median, gesamtnote_mittel, anzahl) VALUES (?, '{}', ?, ?, ?)",
  );
  const strain = db.prepare("INSERT INTO strains (id, kultivar_id, aktiv) VALUES (?, ?, 1)");
  for (const [id, name] of [["k1", "Apples & Bananas"], ["k2", "Ohne Kennwerte"], ["k3", "Ohne Stimmen"], ["k4", "Kaputt"]]) {
    kultivar.run(id, name, id);
    strain.run(`s-${id}`, id);
  }
  kennwerte.run("k1", JSON.stringify(APPLES_BANANAS), 4.1, 4);
  kennwerte.run("k3", "{}", null, 0);
  kennwerte.run("k4", "kaputt", 3, 2);

  const zeile = db.prepare(KATALOG_SQL_KULTIVARE).get() as { j: string };
  const kultivare = new Map((JSON.parse(zeile.j) as KatalogKultivar[]).map((k) => [k.i, k]));
  assert.deepEqual(kultivare.get("k1")?.gm, APPLES_BANANAS);
  assert.equal(kultivare.get("k1")?.cn, 4.1);
  assert.equal(kultivare.get("k2")?.gm, null);
  assert.equal(kultivare.get("k3")?.gm, null);
  assert.equal(kultivare.get("k4")?.gm, null);
});
