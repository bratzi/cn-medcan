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

test("Angaben zur Blüte stehen oben, als ein Block mit dem Terpenprofil (Nutzer 2026-10-05)", () => {
  // Ein Block, nicht gesplittet: Fakten, Wirkstoffspannen und Profil gehören zusammen.
  assert.match(QUELLE, /<TerpenProfil/);
  // Terpen-Chips entfallen: dieselbe Information nicht zweimal in zwei Formen.
  assert.doesNotMatch(QUELLE, /<TerpenChips/);
  // Nicht doppelt: der Sortenkopf der Erkundung wiederholt hier das Titelblatt, also nur
  // auf der Startseite.
  assert.doesNotMatch(QUELLE, /<SortenKopf/);
  // Der Block steht vor dem Bewertungsbuch und damit weit vor dem Rating.
  assert.ok(QUELLE.indexOf("{angabenZurBluete}") < QUELLE.indexOf("<BewertungsBuch"));
  assert.ok(QUELLE.indexOf("{angabenZurBluete}") < QUELLE.indexOf("<AromaErkundung"));
});
