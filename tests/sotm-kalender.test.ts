import { test } from "node:test";
import assert from "node:assert/strict";
import { folgeMonat, monatSchluessel, resttage, sotmLage } from "@/lib/sotm/kalender";

test("Monatsschlüssel und Folgemonat, auch über den Jahreswechsel", () => {
  assert.equal(monatSchluessel(new Date("2026-10-20T12:00:00Z")), "2026-10");
  assert.equal(folgeMonat("2026-10"), "2026-11");
  assert.equal(folgeMonat("2026-12"), "2027-01");
});

test("1. bis 14.: Vorschläge, Ende am 15. 00:00 UTC", () => {
  const l = sotmLage(new Date("2026-10-14T23:59:59Z"));
  assert.equal(l.phase, "VORSCHLAG");
  assert.equal(l.zielMonat, "2026-11");
  assert.equal(l.phaseEndet.toISOString(), "2026-10-15T00:00:00.000Z");
});

test("ab dem 15.: Abstimmung bis Monatsende, Februar und Dezember", () => {
  const feb = sotmLage(new Date("2027-02-15T00:00:00Z"));
  assert.equal(feb.phase, "ABSTIMMUNG");
  assert.equal(feb.phaseEndet.toISOString(), "2027-03-01T00:00:00.000Z");
  const dez = sotmLage(new Date("2026-12-31T23:00:00Z"));
  assert.equal(dez.zielMonat, "2027-01");
  assert.equal(dez.phaseEndet.toISOString(), "2027-01-01T00:00:00.000Z");
});

test("Resttage aufgerundet, nie negativ", () => {
  assert.equal(resttage(new Date("2026-10-20T12:00:00Z"), new Date("2026-11-01T00:00:00Z")), 12);
  assert.equal(resttage(new Date("2026-11-02T00:00:00Z"), new Date("2026-11-01T00:00:00Z")), 0);
});
