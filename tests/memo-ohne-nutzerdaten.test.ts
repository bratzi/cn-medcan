import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Wache (Plan Caching v2, 6.3): wer merke() nutzt, darf keine Nutzerdaten in der Hand haben.
const VERBOTEN = ["@/lib/session", "@/lib/query/fachkreis", "next/headers"];

function dateien(ordner: string): string[] {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    if (name === "generated" || name === "node_modules") return [];
    if (statSync(pfad).isDirectory()) return dateien(pfad);
    return /\.(ts|tsx)$/.test(name) ? [pfad] : [];
  });
}

test("Dateien mit merke( importieren weder Sitzung noch Fachkreis noch next/headers", () => {
  const verstoesse: string[] = [];
  for (const pfad of ["lib", "app", "components"].flatMap(dateien)) {
    const inhalt = readFileSync(pfad, "utf8");
    if (!inhalt.includes("merke(") || pfad.endsWith(join("lib", "memo.ts"))) continue;
    for (const modul of VERBOTEN) if (inhalt.includes(`"${modul}"`)) verstoesse.push(`${pfad} -> ${modul}`);
  }
  assert.deepEqual(verstoesse, []);
});
