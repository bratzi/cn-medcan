import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Alle .ts/.tsx unter einem Ordner, rekursiv. */
function dateien(ordner: string): string[] {
  return readdirSync(ordner, { recursive: true, encoding: "utf8" })
    .filter((name) => /\.tsx?$/.test(name))
    .map((name) => join(ordner, name));
}

// Spec 2026-10-01 (statische Seiten), 4.2: next/root-params wirft in Server Actions und
// Route Handlern. Beide nehmen die Sprache deshalb aus der Anfrage (lib/i18n/anfrage.ts),
// nie aus "@/lib/i18n" oder lib/i18n/sprache.ts.
test("Server Actions und Route Handler lesen die Sprache aus der Anfrage", () => {
  const verboten = /from "@\/lib\/i18n"|from "@\/lib\/i18n\/sprache"|next\/root-params/;
  const treffer = dateien("app").filter((datei) => {
    const quelle = readFileSync(datei, "utf8");
    const istAktion = /^\s*"use server";/m.test(quelle);
    const istRoute = /[\\/]route\.ts$/.test(datei);
    return (istAktion || istRoute) && verboten.test(quelle);
  });
  assert.deepEqual(treffer, []);
});

test("anfrage.ts lädt die Wörterbücher ohne Umweg über lib/i18n/index.ts", () => {
  const quelle = readFileSync("lib/i18n/anfrage.ts", "utf8");
  assert.match(quelle, /from "\.\/woerterbuecher"/);
  assert.match(quelle, /bestimmeSprache\(/);
  assert.doesNotMatch(quelle, /from "\.\/index"|from "\.\/sprache"|from "@\/lib\/i18n"/);
});
