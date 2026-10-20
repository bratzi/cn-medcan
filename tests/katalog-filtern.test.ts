import assert from "node:assert/strict";
import { test } from "node:test";

import { filtere, normalisiere, verdichte, zaehleOptionen } from "@/lib/katalog/filtern";
import type { KatalogErgebnis } from "@/lib/katalog/filtern";
import type { KatalogDaten, KatalogWare } from "@/lib/katalog/typen";
import { leererFilter } from "@/lib/query/filter";

const ware = (x: Partial<KatalogWare> & Pick<KatalogWare, "i" | "h">): KatalogWare => ({
  s: x.i, k: null, y: "HYBRID", f: "BLUETE", g: null, t0: 20, t1: 22, c0: 0, c1: 0.5, v: null, b: null, tp: [], st: [],
  u: "2026-10-01T00:00:00Z", ...x,
});

const DATEN: KatalogDaten = {
  stand: "2026-10-20T00:00:00Z", fachkreis: false,
  waren: [
    ware({ i: "w1", h: "Süße Zitrone 22/1", k: "k1", tp: ["Limonen", "Myrcen"], v: "u1" }),
    ware({ i: "w2", h: "Sour Diesel 20/1", k: "k2", tp: ["Caryophyllen"], y: "SATIVA", c1: 0.5, v: "u2" }),
    ware({ i: "w3", h: "Ohne Sorte 18/1", k: null, tp: ["Myrcen"], c0: 5, c1: 8 }),
    ware({ i: "w4", h: "Süße Zitrone 25/1", k: "k1", tp: ["Myrcen", "Limonen"], t1: 26, v: "u2" }),
  ],
  kultivare: [
    { i: "k1", n: "Süße Zitrone", s: "suesse-zitrone", cn: 4.3, ca: 12, en: 4.5, lb: "2026-10-10T00:00:00Z" },
    { i: "k2", n: "Sour Diesel", s: "sour-diesel", cn: null, ca: 0, en: null, lb: null },
  ],
  vertreiber: [{ i: "u1", n: "Alpha GmbH" }, { i: "u2", n: "Beta AG" }],
  terpene: [{ n: "Limonen", g: "ZITRUS" }, { n: "Myrcen", g: "ERDIG" }, { n: "Caryophyllen", g: "WUERZIG" }],
  apotheken: [],
};
const V = verdichte(DATEN);
const ids = (e: KatalogErgebnis) => (e.ansicht === "bluete" ? e.zeilen.map((z) => z.id) : e.zeilen.map((z) => z.i));
const f = (x: Partial<ReturnType<typeof leererFilter>>) => ({ ...leererFilter(), ...x });

test("Verdichten: eine Blüte je Kultivar, Strain ohne Kultivar als eigene Zeile", () => {
  assert.deepEqual(V.blueten.map((b) => b.id).sort(), ["k1", "k2", "w3"]);
  const k1 = V.blueten.find((b) => b.id === "k1")!;
  assert.equal(k1.handelsnamen, 2);
  assert.equal(k1.thcMax, 26);
  assert.deepEqual(k1.community, { note: 4.3, stimmen: 12 });
  assert.deepEqual(k1.terpene.map((t) => t.name), ["Limonen", "Myrcen"].sort((a, b) => a.localeCompare(b)));
});

test("Suche: ohne Umlaute und Großschreibung", () => {
  assert.equal(normalisiere("SÜẞE"), "susse");
  assert.deepEqual(ids(filtere(V, f({ q: "suesse" }))), []);
  assert.deepEqual(ids(filtere(V, f({ q: "SÜSSE" }))), ["k1"]);
  assert.deepEqual(ids(filtere(V, f({ q: "sour diesel" }))), ["k2"]);
  assert.deepEqual(ids(filtere(V, f({ q: "beta" }))).sort(), ["k1", "k2"]);
});

test("Community: Mindestnote und nur bewertet lassen Zeilen ohne Note fallen", () => {
  assert.deepEqual(ids(filtere(V, f({ note: 4 }))), ["k1"]);
  assert.deepEqual(ids(filtere(V, f({ note: 4.5 }))), []);
  assert.deepEqual(ids(filtere(V, f({ bewertet: true }))), ["k1"]);
});

test("Terpene: alle gewählten unter den Top 3", () => {
  assert.deepEqual(ids(filtere(V, f({ terp: ["Myrcen"] }))).sort(), ["k1", "w3"]);
  assert.deepEqual(ids(filtere(V, f({ terp: ["Myrcen", "Limonen"] }))), ["k1"]);
});

test("CBD-reich, Typ, Vertreiber, THC", () => {
  assert.deepEqual(ids(filtere(V, f({ cbd: true }))), ["w3"]);
  assert.deepEqual(ids(filtere(V, f({ typ: ["SATIVA"] }))), ["k2"]);
  assert.deepEqual(ids(filtere(V, f({ vertreiber: ["u1"] }))), ["k1"]);
  assert.deepEqual(ids(filtere(V, f({ thcMin: 25 }))), ["k1"]);
});

test("Sortierung community: bewertete zuerst, dann Name", () => {
  assert.deepEqual(ids(filtere(V, f({}))), ["k1", "w3", "k2"].sort((a, b) =>
    a === "k1" ? -1 : b === "k1" ? 1 : 0));
  assert.equal(ids(filtere(V, f({})))[0], "k1");
});

test("Blättern: Seite hinter dem Ende wird geklemmt", () => {
  const e = filtere(V, f({ seite: 99 }));
  assert.equal(e.seite, 1);
  assert.equal(e.seitenAnzahl, 1);
  assert.equal(e.zeilen.length, 3);
});

test("Strain-Ansicht: je Handelsname, mit Kultivarnote", () => {
  const e = filtere(V, f({ ansicht: "ware", kultivar: "k1" }));
  assert.equal(e.ansicht, "ware");
  assert.deepEqual(e.zeilen.map((z) => z.i).sort(), ["w1", "w4"]);
  assert.equal(e.ansicht === "ware" && e.zeilen[0]!.community?.stimmen, 12);
});

test("Zählen je Option: Gruppe ohne eigene Auswahl", () => {
  const z = zaehleOptionen(V, f({ terp: ["Myrcen"] }));
  assert.equal(z.terp["Myrcen"], 2);
  assert.equal(z.terp["Limonen"], 1);
  assert.equal(z.bewertet, 1);
});
