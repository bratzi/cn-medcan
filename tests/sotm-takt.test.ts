import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";

import { sotmTakt, type SqlZiel } from "@/lib/sotm/takt";

const TABELLEN = `
CREATE TABLE umfragen (
  id TEXT PRIMARY KEY, titel TEXT NOT NULL, beschreibung TEXT,
  phase TEXT NOT NULL DEFAULT 'VORSCHLAG', aktiv TEXT, monat TEXT,
  start_am TEXT NOT NULL, vorschlag_bis_am TEXT, endet_am TEXT,
  community_plaetze INTEGER NOT NULL DEFAULT 2, erstellt_am TEXT NOT NULL
);
CREATE UNIQUE INDEX umfragen_aktiv_key ON umfragen(aktiv);
CREATE UNIQUE INDEX umfragen_monat_key ON umfragen(monat);
CREATE TABLE umfrage_vorschlaege (
  id TEXT PRIMARY KEY, umfrage_id TEXT NOT NULL REFERENCES umfragen(id) ON DELETE CASCADE,
  strain_id TEXT NOT NULL, mitglied_id TEXT NOT NULL, begruendung TEXT,
  uebernommen INTEGER NOT NULL DEFAULT 0, erstellt_am TEXT NOT NULL
);
CREATE UNIQUE INDEX uv_key ON umfrage_vorschlaege(umfrage_id, mitglied_id, strain_id);
CREATE TABLE umfrage_optionen (
  id TEXT PRIMARY KEY, umfrage_id TEXT NOT NULL REFERENCES umfragen(id) ON DELETE CASCADE,
  strain_id TEXT NOT NULL, reihenfolge INTEGER NOT NULL, herkunft TEXT NOT NULL,
  ist_gewinner INTEGER NOT NULL DEFAULT 0, ergebnis_review_id TEXT, erstellt_am TEXT NOT NULL
);
CREATE UNIQUE INDEX uo_strain_key ON umfrage_optionen(umfrage_id, strain_id);
CREATE UNIQUE INDEX uo_reihe_key ON umfrage_optionen(umfrage_id, reihenfolge);
CREATE TABLE stimmen (
  id TEXT PRIMARY KEY, umfrage_id TEXT NOT NULL REFERENCES umfragen(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL REFERENCES umfrage_optionen(id) ON DELETE CASCADE,
  mitglied_id TEXT NOT NULL, abgegeben_am TEXT NOT NULL
);
CREATE UNIQUE INDEX stimmen_key ON stimmen(umfrage_id, mitglied_id);
`;

/** Trigger der vier Tabellen aus db/constraints.sql, damit das SQL sie nachweislich einhaelt. */
function trigger(): string {
  const sql = readFileSync(new URL("../db/constraints.sql", import.meta.url), "utf8");
  const von = sql.indexOf("drop trigger if exists umfragen_insert_chk;");
  const bis = sql.indexOf("drop trigger if exists sorten_vorschlaege_insert_chk;");
  assert.ok(von > 0 && bis > von);
  return sql.slice(von, bis);
}

function testDb() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(TABELLEN);
  db.exec(trigger());
  const ziel: SqlZiel = {
    async alle<T>(sql: string, ...werte: unknown[]) {
      return db.prepare(sql).all(...werte) as T[];
    },
    async batch(befehle) {
      db.transaction(() => {
        for (const b of befehle) db.prepare(b.sql).run(...b.werte);
      })();
    },
  };
  return { db, ziel };
}

function ids() {
  let n = 0;
  const lauf = Math.random().toString(36).slice(2, 8);
  return () => `id${++n}-${lauf}`;
}

function aktiveId(db: Database): string {
  return (db.prepare("SELECT id FROM umfragen WHERE aktiv = 'AKTIV'").get() as { id: string }).id;
}

function vorschlag(db: Database, strainId: string, mitgliedId: string, am: string) {
  db.prepare(
    "INSERT INTO umfrage_vorschlaege (id, umfrage_id, strain_id, mitglied_id, uebernommen, erstellt_am) VALUES (?, ?, ?, ?, 0, ?)",
  ).run(`v-${strainId}-${mitgliedId}`, aktiveId(db), strainId, mitgliedId, am);
}

function stimme(db: Database, optionId: string, mitgliedId: string) {
  db.prepare("INSERT INTO stimmen (id, umfrage_id, option_id, mitglied_id, abgegeben_am) VALUES (?, ?, ?, ?, ?)")
    .run(`st-${mitgliedId}`, aktiveId(db), optionId, mitgliedId, "2026-10-16T00:00:00.000+00:00");
}

function optionId(db: Database, strainId: string): string {
  return (db.prepare("SELECT id FROM umfrage_optionen WHERE strain_id = ? AND umfrage_id = ?").get(strainId, aktiveId(db)) as { id: string }).id;
}

/** Oktober-Runde (fuer November) bis in die Abstimmung mit Kandidaten s1, s2. */
async function bisAbstimmung(ziel: SqlZiel, db: Database) {
  await sotmTakt(ziel, new Date("2026-10-03T00:00:00Z"), ids());
  vorschlag(db, "s1", "m1", "2026-10-04T00:00:00.000+00:00");
  vorschlag(db, "s2", "m2", "2026-10-05T00:00:00.000+00:00");
  await sotmTakt(ziel, new Date("2026-10-15T00:00:00Z"), ids());
}

test("leer am 3. Oktober: neue Runde für November in VORSCHLAG", async () => {
  const { ziel, db } = testDb();
  const r = await sotmTakt(ziel, new Date("2026-10-03T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["NEUE_RUNDE"]);
  assert.deepEqual(db.prepare("SELECT phase, aktiv, monat, community_plaetze FROM umfragen").all(),
    [{ phase: "VORSCHLAG", aktiv: "AKTIV", monat: "2026-11", community_plaetze: 1 }]);
  assert.deepEqual(db.prepare("SELECT titel, start_am, vorschlag_bis_am FROM umfragen").get(), {
    titel: "Strain of the Month 2026-11",
    start_am: "2026-10-03T00:00:00.000+00:00",
    vorschlag_bis_am: "2026-10-14T23:59:59.999+00:00",
  });
});

test("zweimal am selben Tag: nichts Neues", async () => {
  const { ziel } = testDb();
  await sotmTakt(ziel, new Date("2026-10-03T00:00:00Z"), ids());
  assert.deepEqual((await sotmTakt(ziel, new Date("2026-10-03T00:01:00Z"), ids())).schritte, []);
});

test("am 15. ohne übernommene Kandidaten: Vorschläge werden Optionen, Phase ABSTIMMUNG", async () => {
  const { ziel, db } = testDb();
  await sotmTakt(ziel, new Date("2026-10-03T00:00:00Z"), ids());
  vorschlag(db, "s1", "m1", "2026-10-04T00:00:00.000+00:00");
  vorschlag(db, "s2", "m2", "2026-10-05T00:00:00.000+00:00");
  vorschlag(db, "s1", "m3", "2026-10-06T00:00:00.000+00:00");
  const r = await sotmTakt(ziel, new Date("2026-10-15T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["KANDIDATEN", "ABSTIMMUNG"]);
  assert.deepEqual(db.prepare("SELECT strain_id, reihenfolge FROM umfrage_optionen ORDER BY reihenfolge").all(),
    [{ strain_id: "s1", reihenfolge: 1 }, { strain_id: "s2", reihenfolge: 2 }]);
  assert.deepEqual(db.prepare("SELECT DISTINCT herkunft, ist_gewinner FROM umfrage_optionen").all(),
    [{ herkunft: "COMMUNITY", ist_gewinner: 0 }]);
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM umfrage_vorschlaege WHERE uebernommen = 0").get() as { n: number }).n, 0);
  assert.equal((db.prepare("SELECT phase FROM umfragen").get() as { phase: string }).phase, "ABSTIMMUNG");
});

test("am 15. mit vom Betreiber übernommenen Kandidaten: nur Phase ABSTIMMUNG", async () => {
  const { ziel, db } = testDb();
  await sotmTakt(ziel, new Date("2026-10-03T00:00:00Z"), ids());
  vorschlag(db, "s1", "m1", "2026-10-04T00:00:00.000+00:00");
  db.prepare("INSERT INTO umfrage_optionen (id, umfrage_id, strain_id, reihenfolge, herkunft, ist_gewinner, erstellt_am) VALUES ('o9', ?, 's9', 1, 'COMMUNITY', 0, 'x')").run(aktiveId(db));
  const r = await sotmTakt(ziel, new Date("2026-10-15T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["ABSTIMMUNG"]);
  assert.deepEqual(db.prepare("SELECT strain_id FROM umfrage_optionen").all(), [{ strain_id: "s9" }]);
});

test("am 1. November: Gewinner markiert, Runde beendet, Dezember-Runde offen", async () => {
  const { ziel, db } = testDb();
  await bisAbstimmung(ziel, db);
  stimme(db, optionId(db, "s2"), "m1");
  stimme(db, optionId(db, "s2"), "m2");
  stimme(db, optionId(db, "s1"), "m3");
  const r = await sotmTakt(ziel, new Date("2026-11-01T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["BEENDET", "NEUE_RUNDE"]);
  assert.equal((db.prepare("SELECT o.strain_id FROM umfrage_optionen o WHERE ist_gewinner = 1").get() as { strain_id: string } | undefined)?.strain_id, "s2");
  assert.equal((db.prepare("SELECT monat FROM umfragen WHERE aktiv = 'AKTIV'").get() as { monat: string } | undefined)?.monat, "2026-12");
  assert.deepEqual(db.prepare("SELECT phase, aktiv, endet_am FROM umfragen WHERE monat = '2026-11'").get(),
    { phase: "BEENDET", aktiv: null, endet_am: "2026-11-01T00:00:00.000+00:00" });
});

test("Gleichstand: früher übernommene Option gewinnt; keine Stimmen: kein Gewinner", async () => {
  {
    const { ziel, db } = testDb();
    await bisAbstimmung(ziel, db);
    stimme(db, optionId(db, "s2"), "m1");
    stimme(db, optionId(db, "s1"), "m2");
    await sotmTakt(ziel, new Date("2026-11-01T00:00:00Z"), ids());
    assert.deepEqual(db.prepare("SELECT strain_id FROM umfrage_optionen WHERE ist_gewinner = 1").all(), [{ strain_id: "s1" }]);
  }
  {
    const { ziel, db } = testDb();
    await bisAbstimmung(ziel, db);
    const r = await sotmTakt(ziel, new Date("2026-11-01T00:00:00Z"), ids());
    assert.deepEqual(r.schritte, ["BEENDET", "NEUE_RUNDE"]);
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM umfrage_optionen WHERE ist_gewinner = 1").get() as { n: number }).n, 0);
    assert.equal((db.prepare("SELECT phase FROM umfragen WHERE monat = '2026-11'").get() as { phase: string }).phase, "BEENDET");
  }
});

function altrunde(db: Database, phase: string) {
  db.prepare(`INSERT INTO umfragen (id, titel, phase, aktiv, start_am, community_plaetze, erstellt_am) VALUES ('alt', 'Alte Runde', '${phase}', 'AKTIV', '2026-09-28T07:05:45.077+00:00', 2, '2026-09-28T07:05:45.077+00:00')`).run();
}

test("Altrunde ohne monat in ABSTIMMUNG wird übernommen statt geschlossen", async () => {
  const { ziel, db } = testDb();
  altrunde(db, "ABSTIMMUNG");
  db.prepare("INSERT INTO umfrage_optionen (id, umfrage_id, strain_id, reihenfolge, herkunft, ist_gewinner, erstellt_am) VALUES ('oa', 'alt', 's1', 1, 'COMMUNITY', 0, 'x'), ('ob', 'alt', 's2', 2, 'COMMUNITY', 0, 'x')").run();
  stimme(db, "ob", "m1");
  const r = await sotmTakt(ziel, new Date("2026-10-20T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["UEBERNOMMEN"]);
  assert.deepEqual(db.prepare("SELECT id, phase, aktiv, monat, community_plaetze FROM umfragen").all(),
    [{ id: "alt", phase: "ABSTIMMUNG", aktiv: "AKTIV", monat: "2026-11", community_plaetze: 1 }]);
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM umfrage_optionen WHERE ist_gewinner = 1").get() as { n: number }).n, 0);
  assert.deepEqual((await sotmTakt(ziel, new Date("2026-10-20T00:05:00Z"), ids())).schritte, []);
});

test("Altrunde in VORSCHLAG nach dem 15.: übernommen und in die Abstimmung", async () => {
  const { ziel, db } = testDb();
  altrunde(db, "VORSCHLAG");
  vorschlag(db, "s1", "m1", "2026-10-04T00:00:00.000+00:00");
  const r = await sotmTakt(ziel, new Date("2026-10-20T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["UEBERNOMMEN", "KANDIDATEN", "ABSTIMMUNG"]);
  assert.deepEqual(db.prepare("SELECT phase, monat FROM umfragen").all(), [{ phase: "ABSTIMMUNG", monat: "2026-11" }]);
});

test("Altrunde, aber Zielmonat schon belegt: Altrunde wird beendet", async () => {
  const { ziel, db } = testDb();
  db.prepare("INSERT INTO umfragen (id, titel, phase, aktiv, start_am, community_plaetze, erstellt_am, monat) VALUES ('nov', 'Alt Nov', 'BEENDET', NULL, 'a', 1, 'a', '2026-11')").run();
  altrunde(db, "ABSTIMMUNG");
  const r = await sotmTakt(ziel, new Date("2026-10-20T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["BEENDET"]);
  assert.deepEqual(db.prepare("SELECT phase, aktiv, monat FROM umfragen WHERE id = 'alt'").get(), { phase: "BEENDET", aktiv: null, monat: null });
});

test("Gewinner nur aus COMMUNITY: GESETZTE Altoption wird nie Gewinner", async () => {
  const { ziel, db } = testDb();
  db.prepare("INSERT INTO umfragen (id, titel, phase, aktiv, start_am, community_plaetze, erstellt_am, monat) VALUES ('okt', 'Okt', 'ABSTIMMUNG', 'AKTIV', 'a', 1, 'a', '2026-10')").run();
  db.prepare("INSERT INTO umfrage_optionen (id, umfrage_id, strain_id, reihenfolge, herkunft, ist_gewinner, erstellt_am) VALUES ('og', 'okt', 's0', 1, 'GESETZT', 0, 'x'), ('oc', 'okt', 's1', 2, 'COMMUNITY', 0, 'x')").run();
  stimme(db, "oc", "m1");
  const r = await sotmTakt(ziel, new Date("2026-10-03T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["BEENDET", "NEUE_RUNDE"]);
  assert.deepEqual(db.prepare("SELECT id FROM umfrage_optionen WHERE ist_gewinner = 1").all(), [{ id: "oc" }]);
});

test("Cron verpasst: erster Takt am 20. November schließt Oktober-Runde, neue Dezember-Runde startet in ABSTIMMUNG", async () => {
  const { ziel, db } = testDb();
  await bisAbstimmung(ziel, db);
  stimme(db, optionId(db, "s1"), "m1");
  const r = await sotmTakt(ziel, new Date("2026-11-20T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["BEENDET", "NEUE_RUNDE", "ABSTIMMUNG"]);
  assert.deepEqual(db.prepare("SELECT strain_id FROM umfrage_optionen WHERE ist_gewinner = 1").all(), [{ strain_id: "s1" }]);
  assert.deepEqual(db.prepare("SELECT monat, phase FROM umfragen WHERE aktiv = 'AKTIV'").get(), { monat: "2026-12", phase: "ABSTIMMUNG" });
  assert.deepEqual(await sotmTakt(ziel, new Date("2026-11-20T00:05:00Z"), ids()), { schritte: [] });
});

test("Konflikt beim Anlegen (Runde parallel angelegt): kein Fehler, kein Schritt", async () => {
  const { ziel, db } = testDb();
  let erster = true;
  const stoerer: SqlZiel = {
    alle: ziel.alle.bind(ziel),
    async batch(befehle) {
      if (erster && befehle.some((b) => b.sql.includes("INSERT OR IGNORE INTO umfragen"))) {
        erster = false;
        db.prepare("INSERT INTO umfragen (id, titel, phase, aktiv, start_am, community_plaetze, erstellt_am, monat) VALUES ('fremd', 'x', 'VORSCHLAG', 'AKTIV', 'a', 1, 'a', '2026-11')").run();
      }
      return ziel.batch(befehle);
    },
  };
  const r = await sotmTakt(stoerer, new Date("2026-10-03T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, []);
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM umfragen").get() as { n: number }).n, 1);
});
