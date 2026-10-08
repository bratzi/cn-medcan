import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { zuAuftaktZahlen, hatAuftaktZahlen } from "@/lib/query/auftakt-zahlen";

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");

test("Zeile aus D1 wird zu Zahlen, egal ob number, bigint oder string", () => {
  assert.deepEqual(zuAuftaktZahlen([{ sorten: 412, bewertungen: 37n, stimmen: "1284" }]), {
    sorten: 412,
    bewertungen: 37,
    stimmen: 1284,
  });
});

test("fehlende oder kaputte Werte werden 0", () => {
  const null3 = { sorten: 0, bewertungen: 0, stimmen: 0 };
  assert.deepEqual(zuAuftaktZahlen([]), null3);
  assert.deepEqual(zuAuftaktZahlen(undefined), null3);
  assert.deepEqual(zuAuftaktZahlen(null), null3);
  assert.deepEqual(zuAuftaktZahlen([{ sorten: "viele", bewertungen: -1, stimmen: null }]), null3);
});

test("leere Datenbank: keine Leiste, eine Zahl über 0: Leiste", () => {
  assert.equal(hatAuftaktZahlen({ sorten: 0, bewertungen: 0, stimmen: 0 }), false);
  assert.equal(hatAuftaktZahlen({ sorten: 0, bewertungen: 0, stimmen: 1 }), true);
});

test("Abfrage: eine queryRaw mit drei Unterabfragen, keine Transaktion", () => {
  const quelle = lies("lib/query/start-zahlen.ts");
  assert.match(quelle, /import "server-only"/);
  assert.match(quelle, /\$queryRaw/);
  assert.doesNotMatch(quelle, /\$transaction|\.count\(/);
  assert.match(quelle, /FROM strains WHERE aktiv = 1/);
  assert.match(quelle, /FROM reviews WHERE freigegeben = 1/);
  assert.match(quelle, /FROM stimmen\)/);
});
