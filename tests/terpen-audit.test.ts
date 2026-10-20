import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { aromaAnteile, istKandidatAnteil } from "@/lib/terpen-aromen";
import { TERPEN_ACHSEN, hauptAroma } from "@/lib/terpen-achsen";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";

const NAMEN = [
  "Myrcen", "Limonen", "beta-Caryophyllen", "Linalool", "alpha-Pinen", "Terpinolen", "Humulen", "Ocimen",
  "Farnesen", "Nerolidol", "Bisabolol", "beta-Pinen", "Terpineol", "Eukalyptol", "Borneol", "Fenchol", "Guajol",
  "Valencen", "Geraniol", "Caryophyllenoxid", "Camphen", "delta-3-Caren", "Phellandren", "Selinen",
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
  const zweite = readFileSync("migrations/0031_terpen_katalog_zwei.sql", "utf-8");
  for (const name of NAMEN.slice(17)) {
    const m = new RegExp(`'${name}', '[^']+', '([A-Z]+)'`).exec(zweite);
    assert.equal(m?.[1], aromaAnteile({ name, geschmack: "ERDIG" })[0].geschmack, `${name} in 0031`);
  }
});

test("Zweite Prioritaet bleibt aus dem Terpen-Netz", () => {
  assert.equal(TERPEN_ACHSEN.length, 11);
});

test("Terpen-Audit: Bisabolol ist elfte Achse, Minzig hat Kandidaten", () => {
  assert.equal(TERPEN_ACHSEN[10].schluessel, "bisabolol");
  const minzig = NAMEN.filter((n) => aromaAnteile({ name: n, geschmack: "ERDIG" }).some((x) => x.geschmack === "MINZIG" && istKandidatAnteil(x.anteil)));
  assert.deepEqual(minzig.sort(), ["Borneol", "Camphen", "Eukalyptol", "Fenchol", "Phellandren", "alpha-Pinen"]);
});

test("Schwelle 0,2 ist rundungsfest", () => {
  assert.equal(istKandidatAnteil(0.2), true);
  assert.equal(istKandidatAnteil(1 - 0.8), true);
  assert.equal(istKandidatAnteil(0.1 + 0.1), true);
  assert.equal(istKandidatAnteil(0.19), false);
});

test("Alltagswörter und Beispiele: für jedes Terpen und jede Geschmacksrichtung, ohne Wirkversprechen", async () => {
  const { de } = await import("@/lib/i18n/de");
  const { en } = await import("@/lib/i18n/en");
  for (const w of [de, en]) {
    for (const name of NAMEN) {
      const k = name.toLowerCase();
      assert.ok((w.aroma.alltag as Record<string, string>)[k], `${name} Alltagswort`);
      assert.ok((w.aroma.satz as Record<string, string>)[k], `${name} Satz`);
    }
    for (const g of GESCHMACKS_KATEGORIEN) assert.ok((w.aroma.beispiele as Record<string, string>)[g], `${g} Beispiel`);
    const alles = JSON.stringify([w.aroma.alltag, w.aroma.beispiele]);
    assert.ok(!/Ware|Stärke|Wirkung|heilt|lindert/.test(alles));
  }
  assert.match(de.aroma.beispiele.FRUCHTIG, /Ester/);
  assert.match(de.aroma.beispiele.DIESEL, /Thiole/);
});
