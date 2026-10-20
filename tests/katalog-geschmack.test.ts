import assert from "node:assert/strict";
import { test } from "node:test";

import { QUALITAET_MITTE } from "@/lib/bewertung-v2";
import {
  BESTAETIGT_AB,
  GEFUNDEN_AB,
  HOECHSTENS_DATENBLATT,
  HOECHSTENS_GEFUNDEN,
  geschmaeckerMitStatus,
} from "@/lib/katalog/geschmack";

/**
 * Echte Kennwerte aus D1 (kultivar_kennwerte.geschmack_median von „Apples & Bananas“, 4 Bewertungen,
 * 2026-10-20). Top-Terpene laut Datenblatt: Ocimen (süß), Myrcen (erdig), alpha-Pinen (holzig).
 */
const APPLES_BANANAS = { diesel: 0, zitrus: 0.5, erdig: 3.25, suess: 4.5, wuerzig: 0.5, blumig: 0, holzig: 2.5, kraeutrig: 0.5, fruchtig: 0, minzig: 0 };
const NULLEN = { diesel: 0, zitrus: 0, erdig: 0, suess: 0, wuerzig: 0, blumig: 0, holzig: 0, kraeutrig: 0, fruchtig: 0, minzig: 0 };

test("Schwellen: bestätigt ab der Hälfte des Sweet Spots, gefunden ab dem Sweet Spot, höchstens 3 + 2", () => {
  assert.equal(BESTAETIGT_AB, 1.25);
  assert.equal(GEFUNDEN_AB, 2.5);
  assert.equal(BESTAETIGT_AB, QUALITAET_MITTE / 2);
  assert.equal(GEFUNDEN_AB, QUALITAET_MITTE);
  assert.equal(HOECHSTENS_DATENBLATT, 3);
  assert.equal(HOECHSTENS_GEFUNDEN, 2);
});

test("Apples & Bananas: alle drei Datenblatt-Geschmäcker bestätigt, nichts zusätzlich gefunden", () => {
  assert.deepEqual(geschmaeckerMitStatus(["SUESS", "ERDIG", "HOLZIG"], APPLES_BANANAS), [
    { geschmack: "SUESS", status: "bestaetigt" },
    { geschmack: "ERDIG", status: "bestaetigt" },
    { geschmack: "HOLZIG", status: "bestaetigt" },
  ]);
});

test("Nicht bestätigt: Kennwerte da, Median unter 1,25; genau 1,25 gilt als bestätigt", () => {
  const median = { ...NULLEN, zitrus: 1.24, kraeutrig: 1.25 };
  assert.deepEqual(geschmaeckerMitStatus(["ZITRUS", "KRAEUTRIG"], median), [
    { geschmack: "ZITRUS", status: "nichtBestaetigt" },
    { geschmack: "KRAEUTRIG", status: "bestaetigt" },
  ]);
});

test("Offen: ohne Kennwerte (null) und bei Katalog-JSON ohne gm (undefined), dann nichts gefunden", () => {
  const erwartet = [
    { geschmack: "SUESS", status: "offen" },
    { geschmack: "ERDIG", status: "offen" },
  ];
  assert.deepEqual(geschmaeckerMitStatus(["SUESS", "ERDIG"], null), erwartet);
  assert.deepEqual(geschmaeckerMitStatus(["SUESS", "ERDIG"], undefined), erwartet);
});

test("Gefunden: Achsen außerhalb des Datenblatts ab 2,5, stärkste zuerst, höchstens zwei", () => {
  const median = { ...NULLEN, zitrus: 2, suess: 4.5, erdig: 3.25, holzig: 2.5, wuerzig: 2.49 };
  assert.deepEqual(geschmaeckerMitStatus(["ZITRUS"], median), [
    { geschmack: "ZITRUS", status: "bestaetigt" },
    { geschmack: "SUESS", status: "gefunden" },
    { geschmack: "ERDIG", status: "gefunden" },
  ]);
});

test("Gefunden: genau 2,5 zählt, 2,49 nicht", () => {
  const median = { ...NULLEN, holzig: 2.5, wuerzig: 2.49 };
  assert.deepEqual(geschmaeckerMitStatus([], median), [{ geschmack: "HOLZIG", status: "gefunden" }]);
});

test("Gefunden wiederholt keinen Datenblatt-Geschmack", () => {
  assert.deepEqual(geschmaeckerMitStatus(["SUESS"], APPLES_BANANAS), [
    { geschmack: "SUESS", status: "bestaetigt" },
    { geschmack: "ERDIG", status: "gefunden" },
    { geschmack: "HOLZIG", status: "gefunden" },
  ]);
});

test("Gefunden bei Gleichstand: Reihenfolge der Geschmacksachsen", () => {
  const median = { ...NULLEN, diesel: 3, minzig: 3, fruchtig: 3 };
  assert.deepEqual(geschmaeckerMitStatus([], median), [
    { geschmack: "FRUCHTIG", status: "gefunden" },
    { geschmack: "MINZIG", status: "gefunden" },
  ]);
});

test("Datenblatt: eindeutig, in Rangfolge, ohne Lücken, höchstens drei", () => {
  assert.deepEqual(geschmaeckerMitStatus(["ERDIG", null, "ERDIG", "ZITRUS", "WUERZIG", "BLUMIG"], null), [
    { geschmack: "ERDIG", status: "offen" },
    { geschmack: "ZITRUS", status: "offen" },
    { geschmack: "WUERZIG", status: "offen" },
  ]);
});

test("Unbrauchbare Werte zählen nicht: Datenblatt-Geschmack bleibt offen, nichts wird gefunden", () => {
  const kaputt = { suess: "4.5", erdig: Number.NaN, holzig: null, zitrus: Number.POSITIVE_INFINITY } as unknown as Record<string, number>;
  assert.deepEqual(geschmaeckerMitStatus(["SUESS", "ERDIG"], kaputt), [
    { geschmack: "SUESS", status: "offen" },
    { geschmack: "ERDIG", status: "offen" },
  ]);
});
