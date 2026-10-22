import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import type { IchStrain } from "@/lib/ich-strain";

type Freigegeben = Extract<IchStrain, { zugang: "freigegeben" }>;
type SqliteStmt = { get(...w: never[]): unknown; all(...w: never[]): unknown[] };
type DatabaseSync = { exec(sql: string): void; prepare(sql: string): SqliteStmt };
// node:sqlite (Node 22.5+) fehlt in den installierten @types/node; darum über require mit eigenem Typ.
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as { DatabaseSync: new (pfad: string) => DatabaseSync };

import { tokenErzeugen } from "@/lib/gate";
import { sitzungsToken, type D1Roh } from "@/lib/insel-roh";
import { tor } from "@/lib/tor";
import { liveNetzBasis } from "@/lib/live-netz";
import { sortenAusZeilen } from "@/lib/empfehlung";
import { parseGeschmacksMatrix, parseTerpenIntensitaet } from "@/lib/query/bewertung";

const GATE = "s".repeat(32);
const AUTH = "a".repeat(40);

/** D1-Nachbau über node:sqlite: prüft das echte SQL gegen die echten Tabellennamen. */
function d1(db: DatabaseSync): D1Roh {
  const stmt = (sql: string, werte: unknown[] = []) => ({
    bind: (...w: unknown[]) => stmt(sql, w),
    first: async <T>() => (db.prepare(sql).get(...(werte as never[])) ?? null) as T | null,
    all: async <T>() => ({ results: db.prepare(sql).all(...(werte as never[])) as T[] }),
  });
  return {
    prepare: (sql: string) => stmt(sql),
    batch: async (liste) => Promise.all(liste.map((s) => s.all())),
  } as D1Roh;
}

function datenbank() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT, email TEXT);
    CREATE TABLE session (id TEXT PRIMARY KEY, expiresAt TEXT, token TEXT UNIQUE, userId TEXT);
    CREATE TABLE mitglied (id TEXT PRIMARY KEY, user_id TEXT UNIQUE, freigegeben INTEGER, rolle TEXT);
    CREATE TABLE chargen (id TEXT PRIMARY KEY, chargen_nr TEXT);
    CREATE TABLE reviews (id TEXT PRIMARY KEY, strain_id TEXT, charge_id TEXT, kultivar_id TEXT, vertreiber_id TEXT,
      ware_genau INTEGER, autor_id TEXT, aussehen REAL, geruch REAL, geschmack REAL, wirkung REAL, konsistenz REAL,
      feuchtigkeit_prozent REAL, geschmacks_matrix TEXT, terpen_intensitaet TEXT, beschaffenheit TEXT, gesamtnote REAL,
      notiz TEXT, instagram_reel_url TEXT, erstellt_am TEXT, aktualisiert_am TEXT);
    CREATE TABLE budpics (id TEXT PRIMARY KEY, review_id TEXT, breite INTEGER, hoehe INTEGER, status TEXT, erstellt_am TEXT);
    CREATE TABLE terpene (id TEXT PRIMARY KEY, name TEXT, geschmack TEXT);
    CREATE TABLE strains (id TEXT PRIMARY KEY);
    CREATE TABLE strain_terpene (strain_id TEXT, terpen_id TEXT, rang INTEGER);
    CREATE TABLE sorten_kennwerte (strain_id TEXT PRIMARY KEY, geschmack_median TEXT, gesamtnote_median REAL, anzahl INTEGER);

    INSERT INTO user VALUES ('u1','Ana','a@x'), ('u2','Ben','b@x'), ('u3','Cem','c@x');
    INSERT INTO session VALUES ('s1','2999-01-01T00:00:00.000+00:00','tok1','u1'),
                               ('s2','2000-01-01T00:00:00.000+00:00','tok2','u1'),
                               ('s3','2999-01-01T00:00:00.000+00:00','tok3','u2'),
                               ('s4','2999-01-01T00:00:00.000+00:00','tok4','u3');
    INSERT INTO mitglied VALUES ('m1','u1',1,'ADMIN'), ('m2','u2',0,'MITGLIED');
    INSERT INTO chargen VALUES ('c1','CH-42');
    INSERT INTO reviews VALUES
      ('r1','st1','c1','k1','v1',1,'m1',4,3.5,4,5,3,11.5,'{"fruchtig":3}','{"Myrcen":3}','{}',4.5,'gut',NULL,
       '2026-10-01T10:00:00.000+00:00','2026-10-02T10:00:00.000+00:00'),
      ('r2','st2',NULL,'k2','v2',1,'m1',2,2,2,2,2,NULL,'{"erdig":4}',NULL,NULL,NULL,NULL,NULL,
       '2026-10-03T10:00:00.000+00:00','2026-10-03T10:00:00.000+00:00');
    INSERT INTO budpics VALUES ('b1','r1',800,600,'FREIGEGEBEN','2026-10-01T11:00:00.000+00:00');
    INSERT INTO terpene VALUES ('t1','Myrcen','ERDIG'), ('t2','Limonen','ZITRUS');
    INSERT INTO strains VALUES ('st1'), ('st2');
    INSERT INTO strain_terpene VALUES ('st1','t1',1), ('st1','t2',2), ('st2','t1',1);
  `);
  return db;
}

async function signiert(token: string, secret = AUTH) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token)))));
  return encodeURIComponent(`${token}.${sig}`);
}

function env(db = datenbank()) {
  return {
    SITE_PASSWORD: "pw",
    SITE_SESSION_SECRET: GATE,
    BETTER_AUTH_SECRET: AUTH,
    DB: d1(db),
    ASSETS: { fetch: async () => new Response("nf", { status: 404 }) },
  };
}

async function anfrage(sitzung: string, query = "kultivar=k1&vertreiber=v1&strain=st1", name = "__Secure-better-auth.session_token") {
  const gate = await tokenErzeugen(GATE, "besucher");
  return new Request(`https://x.dev/api/ich/strain?${query}`, { headers: { cookie: `cn_gate=${gate}; ${name}=${sitzung}` } });
}

test("sitzungsToken: gültige Signatur liefert das Token, falsche oder fehlende null", async () => {
  const gut = new Map([["__Secure-better-auth.session_token", await signiert("tok1")]]);
  assert.equal(await sitzungsToken(gut, AUTH, true), "tok1");
  const plain = new Map([["better-auth.session_token", await signiert("tok1")]]);
  // Wie Better Auth: über https nur der __Secure-Name, lokal (http) nur der schlichte.
  assert.equal(await sitzungsToken(plain, AUTH, true), null);
  assert.equal(await sitzungsToken(plain, AUTH, false), "tok1");
  const falsch = new Map([["__Secure-better-auth.session_token", await signiert("tok1", "b".repeat(40))]]);
  assert.equal(await sitzungsToken(falsch, AUTH, true), null);
  assert.equal(await sitzungsToken(new Map([["__Secure-better-auth.session_token", "tok1"]]), AUTH, true), null);
  assert.equal(await sitzungsToken(new Map(), AUTH, true), null);
});

test("Live-Netz-Fehler kostet nur das Netz: 200, Vorbelegung bleibt, liveNetz null", async () => {
  const db = datenbank();
  db.exec("DROP TABLE terpene");
  const fehler = console.error;
  console.error = () => {};
  try {
    const antwort = await tor(await anfrage(await signiert("tok1")), env(db));
    assert.equal(antwort!.status, 200);
    const daten = (await antwort!.json()) as Freigegeben;
    assert.equal(daten.zugang, "freigegeben");
    assert.equal(daten.vorbelegung?.chargenNr, "CH-42");
    assert.equal(daten.liveNetz, null);
  } finally {
    console.error = fehler;
  }
});

test("Fehler in der rohen Insel: Next übernimmt (null)", async () => {
  const db = datenbank();
  db.exec("DROP TABLE session");
  const fehler = console.error;
  console.error = () => {};
  try {
    assert.equal(await tor(await anfrage(await signiert("tok1")), env(db)), null);
  } finally {
    console.error = fehler;
  }
});

test("Insel mit Sitzung: freigegeben, Vorbelegung und Live-Netz ohne Next", async () => {
  const antwort = await tor(await anfrage(await signiert("tok1")), env());
  assert.ok(antwort);
  assert.equal(antwort.status, 200);
  assert.equal(antwort.headers.get("cache-control"), "private, no-store");
  const daten = (await antwort.json()) as Freigegeben;
  assert.equal(daten.zugang, "freigegeben");
  assert.equal(daten.istBetreiber, true);
  assert.deepEqual(daten.vorbelegung, {
    stand: "2026-10-02T10:00:00.000Z",
    gesamtnote: 4.5,
    noten: { aussehen: 4, geruch: 3.5, geschmack: 4, wirkung: 5, konsistenz: 3 },
    geschmack: parseGeschmacksMatrix('{"fruchtig":3}'),
    intensitaet: { Myrcen: 3 },
    beschaffenheit: { feuchte: 11.5 },
    chargenNr: "CH-42",
    notiz: "gut",
    instagramReelUrl: null,
    bilder: [{ id: "b1", breite: 800, hoehe: 600, status: "FREIGEGEBEN" }],
    strainId: "st1",
    vertreiberId: "v1",
  });
  const terpene = [
    { id: "t1", name: "Myrcen", geschmack: "ERDIG" },
    { id: "t2", name: "Limonen", geschmack: "ZITRUS" },
  ];
  const sorten = sortenAusZeilen(terpene, [
    { sid: "st1", tp: "t1:1,t2:2", gm: null, gn: null, an: null },
    { sid: "st2", tp: "t1:1", gm: null, gn: null, an: null },
  ]);
  const erwartet = liveNetzBasis(
    [
      { strainId: "st2", gesamtnote: 2, terpene: parseTerpenIntensitaet(null), geschmack: parseGeschmacksMatrix('{"erdig":4}') },
      { strainId: "st1", gesamtnote: 4.5, terpene: parseTerpenIntensitaet('{"Myrcen":3}'), geschmack: parseGeschmacksMatrix('{"fruchtig":3}') },
    ],
    sorten,
    "st1",
  );
  assert.deepEqual(daten.liveNetz, JSON.parse(JSON.stringify(erwartet)));
});

test("Insel ohne passende eigene Bewertung: Vorbelegung null", async () => {
  const daten = (await (await tor(await anfrage(await signiert("tok1"), "kultivar=k9&vertreiber=v9&strain=st1"), env()))!.json()) as Freigegeben;
  assert.equal(daten.zugang, "freigegeben");
  assert.equal(daten.vorbelegung, null);
});

test("Insel ohne Vertreiber: jüngste eigene Bewertung der Sorte samt Vertreiber", async () => {
  const db = datenbank();
  db.exec(`INSERT INTO reviews VALUES ('r3','st3',NULL,'k1','v3',0,'m1',3,3,3,3,3,NULL,NULL,NULL,NULL,3,NULL,NULL,
    '2026-10-05T10:00:00.000+00:00','2026-10-05T10:00:00.000+00:00')`);
  const daten = (await (await tor(await anfrage(await signiert("tok1"), "kultivar=k1&strain=st1"), env(db)))!.json()) as Freigegeben;
  assert.equal(daten.vorbelegung?.vertreiberId, "v3");
  assert.equal(daten.vorbelegung?.strainId, null);
  const mitV1 = (await (await tor(await anfrage(await signiert("tok1")), env(db)))!.json()) as Freigegeben;
  assert.equal(mitV1.vorbelegung?.vertreiberId, "v1");
});

test("abgelaufene Sitzung, falsche Signatur, unbekanntes Token: gast", async () => {
  for (const cookie of [await signiert("tok2"), await signiert("tok1", "b".repeat(40)), await signiert("unbekannt")]) {
    const antwort = await tor(await anfrage(cookie), env());
    assert.deepEqual(await antwort!.json(), { zugang: "gast" });
  }
});

test("nicht freigegeben oder ohne Mitgliedssatz: mitglied", async () => {
  for (const tok of ["tok3", "tok4"]) {
    const antwort = await tor(await anfrage(await signiert(tok)), env());
    assert.deepEqual(await antwort!.json(), { zugang: "mitglied" });
  }
});

test("ungültige Parameter mit Sitzungscookie: 400 wie die Next-Route", async () => {
  const antwort = await tor(await anfrage(await signiert("tok1"), "kultivar=k1&strain=%27%3B"), env());
  assert.equal(antwort!.status, 400);
  assert.deepEqual(await antwort!.json(), { fehler: "parameter" });
  assert.equal(antwort!.headers.get("cache-control"), "private, no-store");
});

test("ohne DB oder Auth-Secret: Next übernimmt (null)", async () => {
  const e = env();
  const ohne = { ...e, DB: undefined, BETTER_AUTH_SECRET: undefined };
  assert.equal(await tor(await anfrage(await signiert("tok1")), ohne), null);
});
