import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const q = readFileSync("lib/query/buch-band.ts", "utf8");

test("ladeBand: nur freigegebene, aktive Sorten, Buchreihenfolge, Band zu 24", () => {
  assert.match(q, /freigegeben: true/);
  assert.match(q, /strain: \{ aktiv: true \}/);
  assert.match(q, /orderBy: \[\{ istRedaktionell: "desc" \}, \{ erstelltAm: "desc" \}, \{ id: "asc" \}\]/);
  assert.match(q, /skip: \(band - 1\) \* BAND_GROESSE/);
  assert.match(q, /take: BAND_GROESSE/);
  assert.match(q, /BEWERTUNG_SELECT/);
});

test("ladeBand: Band außerhalb ergibt null", () => {
  assert.match(q, /if \(!Number\.isInteger\(band\) \|\| band < 1 \|\| band > baende\) return null;/);
});
