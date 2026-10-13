import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/** Mindestschema der berührten Tabellen, wie es vor 0021 live steht. */
function alteDb() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE "unternehmen" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "land" TEXT, "rolle" TEXT NOT NULL);
    CREATE TABLE "strains" (
      "id" TEXT PRIMARY KEY, "handelsname" TEXT NOT NULL, "kultivar_name" TEXT,
      "hersteller_id" TEXT, "importeur_id" TEXT,
      CONSTRAINT "f1" FOREIGN KEY ("hersteller_id") REFERENCES "unternehmen" ("id") ON DELETE SET NULL,
      CONSTRAINT "f2" FOREIGN KEY ("importeur_id") REFERENCES "unternehmen" ("id") ON DELETE SET NULL);
    CREATE TABLE "sorten_kennwerte" ("strain_id" TEXT PRIMARY KEY, "terpen_median" TEXT NOT NULL, "geschmack_median" TEXT NOT NULL,
      "gesamtnote_median" REAL, "gesamtnote_mittel" REAL, "anzahl" INTEGER NOT NULL, "aktualisiert_am" DATETIME NOT NULL);
    CREATE TABLE "sorten_vorschlaege" ("id" TEXT PRIMARY KEY, "handelsname" TEXT NOT NULL, "hersteller" TEXT, "kultivar_name" TEXT);
    INSERT INTO "unternehmen" VALUES ('avaay','avaay',NULL,'HERSTELLER'), ('enua','Enua Pharma GmbH',NULL,'IMPORTEUR'),
      ('aurora','Aurora','CA','HERSTELLER'), ('jumis','Jumis Pharma',NULL,'BEIDES');
    INSERT INTO "strains" VALUES
      ('s1','avaay 22/1 BCP','Black Cherry Punch','avaay',NULL),
      ('s2','Enua 22/1 BCP CA','black cherry punch ','aurora','enua'),
      ('s3','Cold Creek Kush',' Cold Creek Kush',NULL,'enua'),
      ('s4','Phyto-Hemp PHCC 20/1','Cherry Cookies','jumis','jumis'),
      ('s5','Ohne Kultivar 1',NULL,'avaay',NULL),
      ('s6','Leer Kultivar 2','  ','avaay',NULL);
    INSERT INTO "sorten_vorschlaege" VALUES ('v1','Neu 1','Remexian','Citrus Sprizz');
  `);
  db.exec(readFileSync(join(process.cwd(), "migrations", "0021_vertreiber_kultivar.sql"), "utf8"));
  return db;
}

const zeile = (db: Database, id: string) =>
  db.prepare(`SELECT s.hersteller_id h, s.importeur_id i, s.vertreiber_id v, k.name k FROM strains s LEFT JOIN kultivare k ON k.id = s.kultivar_id WHERE s.id = ?`).get(id);

test("0021: Vertreiber aus Importeur, sonst aus bisherigem Hersteller; Hersteller nur bei abweichendem Importeur", () => {
  const db = alteDb();
  assert.deepEqual(zeile(db, "s1"), { h: null, i: null, v: "avaay", k: "Black Cherry Punch" });
  assert.deepEqual(zeile(db, "s2"), { h: "aurora", i: null, v: "enua", k: "Black Cherry Punch" });
  assert.deepEqual(zeile(db, "s3"), { h: null, i: null, v: "enua", k: "Cold Creek Kush" });
  assert.deepEqual(zeile(db, "s4"), { h: null, i: null, v: "jumis", k: "Cherry Cookies" });
});

test("0021: gleiche Kultivare trotz Schreibweise einmal, ohne Kultivarnamen der Handelsname", () => {
  const db = alteDb();
  const namen = db.prepare(`SELECT name FROM kultivare ORDER BY name`).all().map((r) => (r as { name: string }).name);
  assert.deepEqual(namen, ["Black Cherry Punch", "Cherry Cookies", "Cold Creek Kush", "Leer Kultivar 2", "Ohne Kultivar 1"]);
  const ohne = db.prepare(`SELECT count(*) n FROM strains WHERE kultivar_id IS NULL`).get() as { n: number };
  assert.equal(ohne.n, 0);
});

test("0021: Kennwerte-Tabellen und Vorschlag-Felder", () => {
  const db = alteDb();
  db.prepare(`INSERT INTO vertreiber_kennwerte (vertreiber_id, qualitaet_mittel, achsen_mittel, restfeuchte_median, anzahl, aktualisiert_am) VALUES ('avaay', 3.5, '{}', 11, 2, CURRENT_TIMESTAMP)`).run();
  db.prepare(`INSERT INTO kultivar_kennwerte (kultivar_id, terpen_median, geschmack_median, anzahl, aktualisiert_am) SELECT id, '{}', '{}', 0, CURRENT_TIMESTAMP FROM kultivare LIMIT 1`).run();
  db.prepare(`UPDATE sorten_kennwerte SET qualitaet_mittel = 1, restfeuchte_median = 1, qualitaet_anzahl = 1`).run();
  assert.deepEqual(db.prepare(`SELECT vertreiber v, hersteller h, kultivar_id k FROM sorten_vorschlaege`).get(), { v: "Remexian", h: null, k: null });
  assert.throws(() => db.prepare(`INSERT INTO kultivare (id, name) VALUES ('x', 'BLACK CHERRY PUNCH')`).run(), /UNIQUE/);
});

test("0021: Datenschritte sind wiederholbar, ein zweiter Lauf ändert nichts", () => {
  const db = alteDb();
  const sql = readFileSync(join(process.cwd(), "migrations", "0021_vertreiber_kultivar.sql"), "utf8");
  const daten = sql.match(/^(?:INSERT OR IGNORE INTO|UPDATE) [\s\S]*?;$/gm) ?? [];
  assert.equal(daten.length, 4);
  const stand = () => ({
    strains: db.prepare(`SELECT s.id, s.hersteller_id h, s.importeur_id i, s.vertreiber_id v, k.name k FROM strains s LEFT JOIN kultivare k ON k.id = s.kultivar_id ORDER BY s.id`).all(),
    kultivare: db.prepare(`SELECT name FROM kultivare ORDER BY name`).all(),
    vorschlaege: db.prepare(`SELECT vertreiber v, hersteller h FROM sorten_vorschlaege`).all(),
  });
  const vorher = stand();
  db.exec(daten.join("\n"));
  assert.deepEqual(stand(), vorher);
});
