import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { mehrzahl, meldungText, t } from "@/lib/i18n/text";

type Baum = { readonly [k: string]: string | Baum };

function blaetter(baum: Baum, pfad = ""): Map<string, string> {
  const aus = new Map<string, string>();
  for (const [k, v] of Object.entries(baum)) {
    const p = pfad ? `${pfad}.${k}` : k;
    if (typeof v === "string") aus.set(p, v);
    else for (const [pp, vv] of blaetter(v, p)) aus.set(pp, vv);
  }
  return aus;
}

const platzhalter = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("de und en: gleiche Schluessel, keine leeren Werte, gleiche Platzhalter", () => {
  const d = blaetter(de as unknown as Baum);
  const e = blaetter(en as unknown as Baum);
  assert.deepEqual([...e.keys()].sort(), [...d.keys()].sort());
  for (const [schluessel, text] of d) {
    assert.ok(text.trim().length > 0, `de.${schluessel} ist leer`);
    assert.ok(e.get(schluessel)!.trim().length > 0, `en.${schluessel} ist leer`);
    assert.deepEqual(platzhalter(e.get(schluessel)!), platzhalter(text), `Platzhalter in ${schluessel}`);
  }
});

test("t ersetzt bekannte Platzhalter und laesst unbekannte stehen", () => {
  assert.equal(t("Hallo {name}", { name: "Ada" }), "Hallo Ada");
  assert.equal(t("{a} und {b}", { a: 1 }), "1 und {b}");
  assert.equal(t("ohne"), "ohne");
});

test("mehrzahl waehlt die Form je Sprache und setzt {anzahl}", () => {
  const eintrag = { one: "{anzahl} Stimme", other: "{anzahl} Stimmen" };
  assert.equal(mehrzahl("de", eintrag, 1), "1 Stimme");
  assert.equal(mehrzahl("de", eintrag, 0), "0 Stimmen");
  assert.equal(mehrzahl("en", { one: "{anzahl} vote", other: "{anzahl} votes" }, 2), "2 votes");
});

test("meldungText loest Schluessel mit Parametern auf", () => {
  assert.equal(meldungText(de, { schluessel: "allgemein.unbekannt" }), de.meldung["allgemein.unbekannt"]);
});

// Importwaechter (Review Focus 3): Woerterbuecher nie im Browser-Paket.
function dateien(ordner: string): string[] {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    if (name === "generated") return [];
    if (statSync(pfad).isDirectory()) return dateien(pfad);
    return /\.(ts|tsx)$/.test(name) ? [pfad] : [];
  });
}

test("keine Client-Datei importiert ein Woerterbuch als Wert", () => {
  const verboten = /^import\s+(?!type\b)[^;]*from\s+"@\/lib\/i18n(\/(de|en|index|woerterbuecher))?"/m;
  const verstoesse = ["app", "components", "lib"]
    .flatMap(dateien)
    .filter((pfad) => {
      const inhalt = readFileSync(pfad, "utf8");
      return /^["']use client["']/m.test(inhalt) && verboten.test(inhalt);
    });
  assert.deepEqual(verstoesse, []);
});
