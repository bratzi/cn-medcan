import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const lies = (p: string) => readFileSync(p, "utf8");

test("Schublade: echtes dialog, Escape, reduzierte Bewegung", () => {
  const s = lies("components/katalog/FilterSchublade.tsx");
  assert.match(s, /<dialog/);
  assert.match(s, /showModal\(\)/);
  assert.match(s, /onCancel=/);
  assert.match(s, /motion-reduce:transition-none/);
});

test("Filterfelder: Reihenfolge Community vor Terpene vor Geschmack vor Typ", () => {
  const s = lies("components/katalog/FilterFelder.tsx");
  const pos = ["texte.community", "texte.terpene", "texte.geschmack", "texte.kultivarTyp"].map((k) => s.indexOf(k));
  assert.ok(pos.every((p) => p > 0), "Gruppe fehlt");
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
});

test("Filterfelder: Preis und Apotheke nur im Fachkreis, keine dark:-Klassen", () => {
  const s = lies("components/katalog/FilterFelder.tsx");
  assert.match(s, /daten\?\.fachkreis/);
  for (const d of ["FilterFelder", "MobilLeiste", "FilterSchublade"])
    assert.doesNotMatch(lies(`components/katalog/${d}.tsx`), /\bdark:/);
});

test("Wörterbuch: neue Schlüssel in de und en", () => {
  for (const datei of ["lib/i18n/de.ts", "lib/i18n/en.ts"]) {
    const s = lies(datei);
    for (const k of ["mindestnote", "nurBewertet", "cbdReich", "trefferZeigen", "vertreiberSuchen"])
      assert.match(s, new RegExp(`${k}:`), `${k} fehlt in ${datei}`);
  }
});
