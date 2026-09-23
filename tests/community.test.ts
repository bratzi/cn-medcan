import { test } from "node:test";
import assert from "node:assert/strict";

import { LEITSAETZE, hatCommunityZahlen, wandTags, zuCommunityZahlen } from "@/lib/query/community";

test("Zeile aus D1 wird zu Zahlen, egal ob number, bigint oder string", () => {
  assert.deepEqual(zuCommunityZahlen([{ stimmen: 12, vorschlaege: 3n, runden: "2" }]), {
    stimmen: 12,
    vorschlaege: 3,
    runden: 2,
  });
});

test("fehlende oder kaputte Werte werden 0", () => {
  assert.deepEqual(zuCommunityZahlen([]), { stimmen: 0, vorschlaege: 0, runden: 0 });
  assert.deepEqual(zuCommunityZahlen(undefined), { stimmen: 0, vorschlaege: 0, runden: 0 });
  assert.deepEqual(zuCommunityZahlen([{ stimmen: "viele", vorschlaege: -1, runden: null }]), {
    stimmen: 0,
    vorschlaege: 0,
    runden: 0,
  });
});

test("leere Datenbank: statt Nullen die drei Leitsätze", () => {
  const leer = { stimmen: 0, vorschlaege: 0, runden: 0 };
  assert.equal(hatCommunityZahlen(leer), false);
  assert.deepEqual(wandTags(leer), [...LEITSAETZE]);
  assert.deepEqual(wandTags(null), [...LEITSAETZE]);
});

test("echte Zahlen mit deutscher Schreibweise und Singular", () => {
  assert.deepEqual(wandTags({ stimmen: 1284, vorschlaege: 1, runden: 9 }), [
    "1.284 Stimmen",
    "1 Vorschlag",
    "9 Runden",
  ]);
});
