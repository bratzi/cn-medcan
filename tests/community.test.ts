import { test } from "node:test";
import assert from "node:assert/strict";

import { LEITSAETZE, hatCommunityZahlen, randnotizen, zuCommunityZahlen } from "@/lib/query/community";

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

test("leere Datenbank oder Fehler: die drei Leitsätze, ohne Zahl", () => {
  const leer = { stimmen: 0, vorschlaege: 0, runden: 0 };
  const erwartet = LEITSAETZE.map((wort) => ({ zahl: null, wort }));
  assert.equal(hatCommunityZahlen(leer), false);
  assert.deepEqual(randnotizen(leer), erwartet);
  assert.deepEqual(randnotizen(null), erwartet);
});

test("echte Zahlen: Zahl und Wort getrennt, Mehrzahl", () => {
  assert.deepEqual(randnotizen({ stimmen: 1284, vorschlaege: 2, runden: 9 }), [
    { zahl: 1284, wort: "Stimmen" },
    { zahl: 2, wort: "Vorschläge" },
    { zahl: 9, wort: "Runden" },
  ]);
});

test("Einzahl bei genau 1 (Spec TP3 12)", () => {
  assert.deepEqual(
    randnotizen({ stimmen: 1, vorschlaege: 1, runden: 1 }).map((notiz) => notiz.wort),
    ["Stimme", "Vorschlag", "Runde"],
  );
});

test("nur eine Zahl über 0: alle drei Zahlen, auch die Nullen, keine Leitsätze", () => {
  assert.deepEqual(randnotizen({ stimmen: 0, vorschlaege: 3, runden: 0 }), [
    { zahl: 0, wort: "Stimmen" },
    { zahl: 3, wort: "Vorschläge" },
    { zahl: 0, wort: "Runden" },
  ]);
});
