import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const quelle = readFileSync("app/[lang]/profil/page.tsx", "utf8");
const lage = (id: string) => {
  const i = quelle.indexOf(`id="${id}"`);
  assert.ok(i >= 0, `Feld ${id} fehlt`);
  return i;
};
const reihenfolge = (r: number[]) => assert.deepEqual([...r].sort((a, b) => a - b), r, JSON.stringify(r));

test("Profil: Reiter Übersicht, Aromen, Bewertungen, Vertreiber stehen in dieser Reihenfolge (Spec 2026-10-13)", () => {
  const r = ['ansicht === "uebersicht"', 'ansicht === "aromen"', 'ansicht === "bewertungen"', 'ansicht === "vertreiber"'].map((s) => quelle.indexOf(s));
  assert.ok(r.every((i) => i > 0), JSON.stringify(r));
  reihenfolge(r);
});

test("Übersicht: Netz, Top und Flop, Spur, Noten", () => {
  reihenfolge(["netz", "topflop", "aktivitaet", "verteilung"].map(lage));
});

test("Aromen: Netz, dann Ähnliches im Aroma", () => {
  reihenfolge([lage("netz"), lage("vorschlaege")]);
});

test("Vertreiber: Hersteller, Schnitte, Community", () => {
  reihenfolge(["hersteller", "schnitte", "community"].map(lage));
});

test("Kein Feld Terpene mehr, jedes Feld mit Kopf, klein und als Karte, ohne Rasterspalten", () => {
  assert.doesNotMatch(quelle, /id="terpene"/);
  const felder = quelle.match(/<Feld\b[^>]*>/g) ?? [];
  assert.ok(felder.length >= 9, String(felder.length));
  for (const f of felder) {
    assert.match(f, /kopf=/, f);
    assert.match(f, /groesse="klein"/, f);
    assert.match(f, /rahmen="karte"/, f);
    assert.doesNotMatch(f, /spalten=/, f);
  }
});
