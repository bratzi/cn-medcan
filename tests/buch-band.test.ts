import assert from "node:assert/strict";
import test from "node:test";

import { BAND_GROESSE, bandAnzahl, bandHref, bandVon, nummerSeite, seitenleiste } from "@/lib/buch";

const zahlen = (p: ReturnType<typeof seitenleiste>) => p.map((x) => (x.art === "nummer" ? x.nummer : "…"));

test("Bände zu 24", () => {
  assert.equal(BAND_GROESSE, 24);
  assert.equal(bandAnzahl(0), 1);
  assert.equal(bandAnzahl(24), 1);
  assert.equal(bandAnzahl(25), 2);
  assert.equal(bandVon(1), 1);
  assert.equal(bandVon(24), 1);
  assert.equal(bandVon(25), 2);
  assert.equal(bandHref(1), "/reviews");
  assert.equal(bandHref(2), "/reviews/band/2");
});

test("Seitenleiste: wenige Einträge ohne Lücke", () => {
  assert.deepEqual(zahlen(seitenleiste(3, 7)), [1, 2, 3, 4, 5, 6, 7]);
});

test("Seitenleiste: Ränder und Umfeld mit Lücken", () => {
  assert.deepEqual(zahlen(seitenleiste(13, 26)), [1, 2, "…", 12, 13, 14, "…", 25, 26]);
  assert.deepEqual(zahlen(seitenleiste(1, 26)), [1, 2, "…", 25, 26]);
  assert.deepEqual(zahlen(seitenleiste(4, 26)), [1, 2, 3, 4, 5, "…", 25, 26]);
});

test("Lücken haben eindeutige Schlüssel", () => {
  const l = seitenleiste(13, 26).filter((x) => x.art === "luecke");
  assert.equal(new Set(l.map((x) => (x.art === "luecke" ? x.schluessel : ""))).size, l.length);
});

test("nummerSeite: #nr-25 in Band 2 ist Index 0", () => {
  assert.equal(nummerSeite("#nr-25", 24, 2), 0);
  assert.equal(nummerSeite("#nr-26", 24, 2), 1);
  assert.equal(nummerSeite("#nr-27", 24, 2), null);
  assert.equal(nummerSeite("#nr-3", 24, 2), null);
  assert.equal(nummerSeite("#eintrag-x", 0, 5), null);
  assert.equal(nummerSeite("#nr-abc", 0, 5), null);
});
