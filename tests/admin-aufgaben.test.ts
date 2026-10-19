import { test } from "node:test";
import assert from "node:assert/strict";
import { ADMIN_BEREICHE, kachelReihenfolge, sicherZaehlen, summeOffen } from "@/lib/admin-aufgaben";

test("Kacheln: offene nach Zahl absteigend vorn, Null und Werkzeuge hinten in Grundreihenfolge", () => {
  const r = kachelReihenfolge({ bewertungen: 2, mitglieder: 0, gemeldet: 5, budpics: null, vorschlaege: 0, jury: 1, instagram: 0 });
  assert.deepEqual(r.map((b) => b.id), ["gemeldet", "bewertungen", "jury", "mitglieder", "budpics", "vorschlaege", "instagram", "abstimmung", "kennwerte"]);
});

test("summeOffen ignoriert null und Werkzeuge", () => {
  assert.equal(summeOffen({ bewertungen: 2, gemeldet: 5, budpics: null }), 7);
});

test("sicherZaehlen: Fehler wird null", async () => {
  assert.equal(await sicherZaehlen(async () => 3), 3);
  assert.equal(await sicherZaehlen(async () => { throw new Error("no such table"); }), null);
});

test("jeder Bereich hat /admin/<id>", () => {
  for (const b of ADMIN_BEREICHE) assert.equal(b.href, `/admin/${b.id}`);
});
