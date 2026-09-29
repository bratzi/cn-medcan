import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const QUELLE = readFileSync(join(process.cwd(), "app/blueten/[slug]/page.tsx"), "utf8");

test("Produktseite: Rückweg als 44-px-Einzellink", () => {
  assert.match(QUELLE, /className=\{einzelLinkKlassen\(\)\}>\s*\{w\.bluete\.alleBlueten\}/);
});

test("Produktseite: die Bewertungsmaske sitzt am Anker #bewerten, kein Link führt mehr auf /bewerten", () => {
  assert.match(QUELLE, /id="bewerten"/);
  assert.match(QUELLE, /<BewertungsFormular\b/);
  // Der zweite Weg ("Erste Bewertung abgeben") steht seit T7 über dem Buch: tests/buch.test.ts.
  assert.equal(QUELLE.match(/href="#bewerten"/g)?.length, 1);
  assert.doesNotMatch(QUELLE, /["`]\/bewerten\//);
  // Gäste kommen nach dem Anmelden zurück an die Maske: das Fragment steckt kodiert im Ziel.
  assert.match(QUELLE, /\/anmelden\?weiter=\$\{encodeURIComponent\(`\/blueten\/\$\{strain\.slug\}#bewerten`\)\}/);
});

test("Produktseite: keine Hilfszeile, die auf nicht gezeigte Ränge verweist", () => {
  assert.doesNotMatch(QUELLE, /Rang 1 ist das dominante Terpen/);
});
