import { test } from "node:test";
import assert from "node:assert/strict";

import { annehmbareDateien, bildStatusFuer, bilderFrei, ersatzBildId } from "@/lib/bewertungsbilder";
import { BEWERTUNGSBILD_MAX, musterBildId } from "@/lib/budpics";

test("drei Bilder je Bewertung", () => {
  assert.equal(BEWERTUNGSBILD_MAX, 3);
});

test("bildStatusFuer: Betreiber sofort sichtbar, alle anderen offen", () => {
  assert.equal(bildStatusFuer("ADMIN"), "FREIGEGEBEN");
  assert.equal(bildStatusFuer("MITGLIED"), "OFFEN");
  assert.equal(bildStatusFuer(""), "OFFEN");
});

test("bilderFrei: offene und freigegebene belegen, abgelehnte nicht", () => {
  assert.equal(bilderFrei([]), 3);
  assert.equal(bilderFrei(["OFFEN"]), 2);
  assert.equal(bilderFrei(["OFFEN", "FREIGEGEBEN", "FREIGEGEBEN"]), 0);
  assert.equal(bilderFrei(["ABGELEHNT", "ABGELEHNT", "OFFEN"]), 2);
  assert.equal(bilderFrei(["OFFEN", "OFFEN", "OFFEN", "OFFEN"]), 0);
});

test("annehmbareDateien: nie mehr als frei, nie negativ", () => {
  assert.equal(annehmbareDateien(3, 1), 1);
  assert.equal(annehmbareDateien(2, 3), 2);
  assert.equal(annehmbareDateien(5, 0), 0);
  assert.equal(annehmbareDateien(0, 3), 0);
  assert.equal(annehmbareDateien(1, -2), 0);
});

test("ersatzBildId: Herstellerbild vor Musterbild, unbekanntes Herstellerbild zählt nicht", () => {
  assert.equal(ersatzBildId(null, "nebelharz-22"), musterBildId("nebelharz-22"));
  assert.equal(ersatzBildId("gibt-es-nicht", "nebelharz-22"), musterBildId("nebelharz-22"));
  assert.equal(ersatzBildId("bluete-03", "nebelharz-22"), "bluete-03");
});
