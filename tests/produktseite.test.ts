import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const QUELLE = readFileSync(join(process.cwd(), "app/[lang]/blueten/[slug]/page.tsx"), "utf8");

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

test("Angaben zur Blüte stehen im Sortenkopf, nicht nach dem Rating (Nutzer 2026-10-03)", () => {
  const kopf = readFileSync(join(process.cwd(), "components/review/SortenKopf.tsx"), "utf8");
  assert.match(kopf, /angaben\?: React\.ReactNode/);
  // Die Angaben gehen in den Kopf hinein; die eigene Sektion nach dem Rating entfällt.
  assert.match(QUELLE, /angaben=\{/);
  const nachErkundung = QUELLE.slice(QUELLE.indexOf("<AromaErkundung"));
  assert.doesNotMatch(nachErkundung, /texte\.angaben/);
  // Terpen-Chips entfallen dort: der Sortenkopf zeigt das Profil schon mit Anteilsbalken.
  assert.doesNotMatch(QUELLE, /<TerpenChips/);
});
