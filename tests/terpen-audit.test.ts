import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { aromaAnteile, istKandidatAnteil } from "@/lib/terpen-aromen";
import { TERPEN_ACHSEN, hauptAroma } from "@/lib/terpen-achsen";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";

const NAMEN = [
  "Myrcen", "Limonen", "beta-Caryophyllen", "Linalool", "alpha-Pinen", "Terpinolen", "Humulen", "Ocimen",
  "Farnesen", "Nerolidol", "Bisabolol", "beta-Pinen", "Terpineol", "Eukalyptol", "Borneol", "Fenchol", "Guajol",
];

test("Terpen-Audit: Anteile summieren zu 1, erster Eintrag ist die Datenbank-Hauptnote", () => {
  const stamm = readFileSync("scripts/stamm/sql-erzeugen.py", "utf-8");
  const haupt = readFileSync("migrations/0030_terpen_katalog.sql", "utf-8");
  for (const name of NAMEN) {
    const a = aromaAnteile({ name, geschmack: "ERDIG" });
    assert.ok(a.length > 1, `${name} hat eine Tabelle`);
    assert.ok(Math.abs(a.reduce((s, x) => s + x.anteil, 0) - 1) < 1e-9, `${name} Summe`);
    for (const x of a) assert.ok(GESCHMACKS_KATEGORIEN.includes(x.geschmack));
    const m = new RegExp(`[(]"${name}", "([A-Z]+)"`).exec(stamm);
    assert.ok(m, `${name} im Stamm-Skript`);
    assert.equal(m?.[1], a[0].geschmack, `${name} Hauptnote Skript gegen Tabelle`);
  }
  assert.ok(haupt.includes("'Farnesen';") && haupt.includes("'FRUCHTIG'"));
  assert.equal(hauptAroma("farnesen"), "FRUCHTIG");
});

test("Terpen-Audit: Bisabolol ist elfte Achse, Minzig hat Kandidaten", () => {
  assert.equal(TERPEN_ACHSEN[10].schluessel, "bisabolol");
  const minzig = NAMEN.filter((n) => aromaAnteile({ name: n, geschmack: "ERDIG" }).some((x) => x.geschmack === "MINZIG" && istKandidatAnteil(x.anteil)));
  assert.deepEqual(minzig.sort(), ["Borneol", "Eukalyptol", "Fenchol", "alpha-Pinen"]);
});

test("Schwelle 0,2 ist rundungsfest", () => {
  assert.equal(istKandidatAnteil(0.2), true);
  assert.equal(istKandidatAnteil(1 - 0.8), true);
  assert.equal(istKandidatAnteil(0.1 + 0.1), true);
  assert.equal(istKandidatAnteil(0.19), false);
});
