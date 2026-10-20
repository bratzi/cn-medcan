import assert from "node:assert/strict";
import { test } from "node:test";

import { bauKatalogNeu, KATALOG_KV_SCHLUESSEL, liesOderBaueKatalog, type KatalogKv } from "@/lib/katalog/kv";
import { BUDPICS_JE_KULTIVAR_SQL } from "@/lib/query/budpics-sql";
import { tokenNenntFachkreis } from "@/lib/query/fachkreis";

function fakeKv(start: Record<string, string> = {}) {
  const daten = new Map(Object.entries(start));
  const log = { gets: 0, puts: 0 };
  const kv: KatalogKv = {
    async get(k) { log.gets++; return daten.get(k) ?? null; },
    async put(k, v) { log.puts++; daten.set(k, v); },
  };
  return { kv, daten, log };
}

test("KV-Schlüssel v2: das Katalog-JSON trägt seit Task 2 gm, alte Einträge (v1) werden nicht gelesen", () => {
  assert.equal(KATALOG_KV_SCHLUESSEL, "cn-katalog/oeffentlich-v2");
});

test("KV-Treffer: Text kommt durch, kein Bau, kein Schreiben", async () => {
  const { kv, log } = fakeKv({ [KATALOG_KV_SCHLUESSEL]: '{"a":1}' });
  let gebaut = 0;
  const text = await liesOderBaueKatalog(kv, async () => { gebaut++; return "neu"; });
  assert.equal(text, '{"a":1}');
  assert.equal(gebaut, 0);
  assert.equal(log.puts, 0);
});

test("KV leer: einmal bauen und schreiben, danach Treffer", async () => {
  const { kv, daten, log } = fakeKv();
  let gebaut = 0;
  const bauen = async () => { gebaut++; return '{"b":2}'; };
  assert.equal(await liesOderBaueKatalog(kv, bauen), '{"b":2}');
  assert.equal(await liesOderBaueKatalog(kv, bauen), '{"b":2}');
  assert.equal(gebaut, 1);
  assert.equal(log.puts, 1);
  assert.equal(daten.get(KATALOG_KV_SCHLUESSEL), '{"b":2}');
});

test("KV wirft: Rückfall auf Bau, Antwort trotzdem da", async () => {
  const kv: KatalogKv = { async get() { throw new Error("weg"); }, async put() { throw new Error("weg"); } };
  assert.equal(await liesOderBaueKatalog(kv, async () => "x"), "x");
  assert.equal(await liesOderBaueKatalog(null, async () => "y"), "y");
});

test("Neubau nach Datenänderung ersetzt den Text, Fehler bleiben still", async () => {
  const { kv, daten } = fakeKv({ [KATALOG_KV_SCHLUESSEL]: "alt" });
  await bauKatalogNeu(kv, async () => "neu");
  assert.equal(daten.get(KATALOG_KV_SCHLUESSEL), "neu");
  await bauKatalogNeu(kv, async () => { throw new Error("D1"); });
  assert.equal(daten.get(KATALOG_KV_SCHLUESSEL), "neu");
});

test("Fachkreis-Vorprüfung: nur ein Token mit Rolle fachkreis geht zur HMAC-Prüfung", () => {
  assert.equal(tokenNenntFachkreis(undefined), false);
  assert.equal(tokenNenntFachkreis("123.besucher.sig"), false);
  assert.equal(tokenNenntFachkreis("123.fachkreis.sig"), true);
});

test("Budpics je Kultivar: eine Abfrage, nur freigegeben, je Blüte begrenzt, Platzhalter je Id", () => {
  const sql = BUDPICS_JE_KULTIVAR_SQL(3);
  assert.match(sql, /status = 'FREIGEGEBEN'/);
  assert.match(sql, /IN \(\?, \?, \?\)/);
  assert.match(sql, /rn <= \d+/);
  assert.match(sql, /LIMIT \d+/);
  assert.doesNotMatch(sql, /daten/);
});
