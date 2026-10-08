import assert from "node:assert/strict";
import test from "node:test";

import { begrenzeSeite, KARTEN_JE_SEITE, ordne, parameter, seiteVon, type SortenZeile } from "@/lib/rangliste";

const z = (id: string, noten: number[], extra: Partial<SortenZeile> = {}): SortenZeile => ({
  strainId: id,
  anzahl: noten.length,
  summe: noten.reduce((a, b) => a + b, 0),
  betreiber: null,
  communityAnzahl: noten.length,
  communitySumme: noten.reduce((a, b) => a + b, 0),
  zuletzt: "2026-10-01T00:00:00.000Z",
  ...extra,
});

test("parameter: Unsinn fällt auf hoechste und Seite 1", () => {
  assert.deepEqual(parameter("xyz", "0"), { nach: "hoechste", seite: 1 });
  assert.deepEqual(parameter(null, "abc"), { nach: "hoechste", seite: 1 });
  assert.deepEqual(parameter("uneins", "3"), { nach: "uneins", seite: 3 });
});

test("hoechste: eine einzelne 5,0 schlägt nicht viele 4,6 (Bayes)", () => {
  const p = ordne([z("eins", [5]), z("viele", [4.6, 4.6, 4.6, 4.6, 4.6, 4.6]), z("mittel", [3, 3, 3])], "hoechste");
  assert.deepEqual(p.map((x) => x.strainId), ["viele", "eins", "mittel"]);
  assert.equal(p[1].schnitt, 5);
  assert.deepEqual(p.map((x) => x.rang), [1, 2, 3]);
});

test("niedrigste ist die Umkehrung", () => {
  const p = ordne([z("a", [5, 5]), z("b", [1, 1])], "niedrigste");
  assert.equal(p[0].strainId, "b");
});

test("meiste: Anzahl, dann Schnitt", () => {
  const p = ordne([z("a", [3, 3]), z("b", [4, 4]), z("c", [5])], "meiste");
  assert.deepEqual(p.map((x) => x.strainId), ["b", "a", "c"]);
});

test("neueste: jüngste Bewertung zuerst", () => {
  const p = ordne([z("alt", [4], { zuletzt: "2026-01-01T00:00:00.000Z" }), z("neu", [4], { zuletzt: "2026-10-01T00:00:00.000Z" })], "neueste");
  assert.equal(p[0].strainId, "neu");
});

test("uneins: nur mit Betreiber und Community, größter Abstand zuerst", () => {
  const p = ordne(
    [
      z("ohne", [4]),
      z("klein", [4, 4], { betreiber: 4.5, communityAnzahl: 1, communitySumme: 4 }),
      z("gross", [2, 5], { betreiber: 5, communityAnzahl: 1, communitySumme: 2 }),
    ],
    "uneins",
  );
  assert.deepEqual(p.map((x) => x.strainId), ["gross", "klein"]);
  assert.equal(p[0].abstand, 3);
});

test("Sorten ohne Gesamtnote fehlen, nie NaN", () => {
  const p = ordne([z("leer", []), z("a", [4])], "hoechste");
  assert.deepEqual(p.map((x) => x.strainId), ["a"]);
  assert.ok(p.every((x) => Number.isFinite(x.schnitt) && Number.isFinite(x.gewichtet)));
});

test("seiteVon: 12 je Seite, Seite außerhalb ergibt leer", () => {
  const viele = ordne(Array.from({ length: 30 }, (_, i) => z(`s${i}`, [1 + (i % 5)])), "hoechste");
  assert.equal(seiteVon(viele, 1).plaetze.length, KARTEN_JE_SEITE);
  assert.equal(seiteVon(viele, 3).plaetze.length, 6);
  assert.equal(seiteVon(viele, 3).seiten, 3);
  assert.equal(seiteVon(viele, 9).plaetze.length, 0);
});

test("begrenzeSeite: Seite jenseits der letzten wird die letzte, nie unter 1", () => {
  const viele = ordne(Array.from({ length: 30 }, (_, i) => z(`s${i}`, [1 + (i % 5)])), "hoechste");
  assert.equal(begrenzeSeite(viele, 9), 3);
  assert.equal(begrenzeSeite(viele, 2), 2);
  assert.equal(begrenzeSeite(viele, 0), 1);
  assert.equal(begrenzeSeite([], 5), 1);
});
