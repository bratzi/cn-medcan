import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const quelle = readFileSync("app/[lang]/profil/page.tsx", "utf8");
const lage = (id: string) => {
  const i = quelle.indexOf(`id="${id}"`);
  assert.ok(i >= 0, `Feld ${id} fehlt`);
  return i;
};
// Die Reihen sind eigene Funktionen; ihre Reihenfolge steht in ProfilPage.
const reihen = (namen: string[]) => namen.map((n) => quelle.indexOf(`<${n} `));

test("Profil: Aktivität, Netz, Auswertung, Bewertungen, Ähnlich (Nutzer 2026-10-09)", () => {
  const r = reihen(["Notizen", "ReiheAktivitaet", "ReiheNetz", "ReiheAuswertung", "ReiheRegister", "ReiheVorschlaege"]);
  assert.ok(r.every((i) => i > 0), JSON.stringify(r));
  assert.deepEqual([...r].sort((a, b) => a - b), r);
});

test("Auswertung: Top/Flop, dann Noten+Hersteller, dann Schnitte+Community", () => {
  const r = ["topflop", "verteilung", "hersteller", "schnitte", "community"].map(lage);
  assert.deepEqual([...r].sort((a, b) => a - b), r);
});

test("Kein Feld Terpene mehr, jedes Feld mit Kopf", () => {
  assert.doesNotMatch(quelle, /id="terpene"/);
  const felder = quelle.match(/<Feld\b[^>]*>/g) ?? [];
  assert.ok(felder.length >= 9, String(felder.length));
  for (const f of felder) assert.match(f, /kopf=/, f);
});

test("Noten und Hersteller, Schnitte und Community je halbe Breite", () => {
  for (const id of ["verteilung", "hersteller", "schnitte", "community"]) {
    assert.ok(quelle.includes(`id="${id}" spalten={5}`), id);
  }
});
