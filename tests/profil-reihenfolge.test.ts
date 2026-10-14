import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Seit 2026-10-13 eine Seite ohne Reiter: die Reihen stehen in profil-reihen.tsx und konto-reihen.tsx.
const quelle = readFileSync("app/[lang]/profil/profil-reihen.tsx", "utf8") + readFileSync("app/[lang]/profil/konto-reihen.tsx", "utf8");
const lage = (id: string) => {
  const i = quelle.indexOf(`id="${id}"`);
  assert.ok(i >= 0, `Feld ${id} fehlt`);
  return i;
};
const reihenfolge = (r: number[]) => assert.deepEqual([...r].sort((a, b) => a - b), r, JSON.stringify(r));

test("Profil-Reihen: Netz, Top und Flop, Spur, Noten, Register, Ähnliches, Vertreiber", () => {
  reihenfolge(["netz", "topflop", "aktivitaet", "verteilung", "bewertungen", "aehnliches", "vertreiber", "schnitte", "community"].map(lage));
});

test("Konto-Reihen: Umfrage, Vorschläge, Stimmen, Nachrichten, Status, Einstellungen", () => {
  reihenfolge(["umfrage", "meine-vorschlaege", "stimmen", "nachrichten", "status", "einstellungen", "verwaltung"].map(lage));
});

test("Kein Feld Terpene mehr, jedes Feld mit Kopf, klein und als Karte, ohne Rasterspalten", () => {
  assert.doesNotMatch(quelle, /id="terpene"/);
  const felder = quelle.match(/<Feld\b[^>]*>/g) ?? [];
  assert.ok(felder.length >= 16, String(felder.length));
  for (const f of felder) {
    assert.match(f, /kopf=/, f);
    assert.match(f, /groesse="klein"/, f);
    assert.match(f, /rahmen="karte"/, f);
    assert.doesNotMatch(f, /spalten=/, f);
  }
});
