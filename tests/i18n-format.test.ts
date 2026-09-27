import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatiereDatum,
  formatiereLieferzeit,
  formatierePreisProGramm,
  formatiereProzent,
  formatiereProzentSpanne,
  formatiereRelativ,
} from "@/lib/format";

const JETZT = Date.UTC(2026, 8, 27, 12);
const TAG = 86_400_000;

test("Prozent: de mit Komma und schmalem Abstand, en mit Punkt ohne Abstand", () => {
  assert.equal(formatiereProzent(22), "22,0 %");
  assert.equal(formatiereProzent(22, 1, "en"), "22.0%");
  assert.equal(formatiereProzent(null, 1, "en"), "n/a");
  assert.equal(formatiereProzentSpanne(22, 28, 1, "en"), "22.0 – 28.0%");
});

test("Datum und relativ", () => {
  assert.equal(formatiereDatum(new Date(JETZT)), "27.09.2026");
  assert.equal(formatiereDatum(new Date(JETZT), "en"), "27/09/2026");
  assert.equal(formatiereRelativ(JETZT - 3 * TAG, JETZT), "vor 3 Tagen");
  assert.equal(formatiereRelativ(JETZT - 3 * TAG, JETZT, "en"), "3 days ago");
  assert.equal(formatiereDatum(null, "en"), "n/a");
});

test("Lieferzeit und Preis", () => {
  assert.equal(formatiereLieferzeit(1, 1), "1 Werktag");
  assert.equal(formatiereLieferzeit(1, 1, "en"), "1 working day");
  assert.equal(formatiereLieferzeit(2, 2, "en"), "2 working days");
  assert.equal(formatiereLieferzeit(1, 2, "en"), "1 – 2 working days");
  assert.equal(formatierePreisProGramm(null, "en"), "Price on request");
  assert.equal(formatierePreisProGramm(1250, "en"), "€12.50/g");
});

test("formatiereZahl und formatiereAnteil je Sprache", async () => {
  const { formatiereAnteil, formatiereZahl } = await import("@/lib/format");
  assert.equal(formatiereZahl(4.25, 1), "4,3");
  assert.equal(formatiereZahl(4.25, 1, "en"), "4.3");
  assert.equal(formatiereAnteil(0.43), "43 %");
  assert.equal(formatiereAnteil(0.43, 0, "en"), "43%");
});

test("formatiereWert: hoechstens eine Stelle", async () => {
  const { formatiereWert } = await import("@/lib/format");
  assert.equal(formatiereWert(4), "4");
  assert.equal(formatiereWert(3.54), "3,5");
  assert.equal(formatiereWert(3.54, "en"), "3.5");
});
