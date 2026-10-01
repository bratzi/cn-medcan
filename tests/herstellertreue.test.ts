import { test } from "node:test";
import assert from "node:assert/strict";

import { herstellerTreue } from "@/lib/aromakarte";
import { leereGeschmacksMatrix } from "@/lib/query/bewertung";

const HERSTELLER = { ...leereGeschmacksMatrix(), zitrus: 4, holzig: 2 };

test("Herstellertreue: Sweet Spot 2,5 auf allen erwarteten Achsen ergibt 1", () => {
  assert.equal(herstellerTreue(HERSTELLER, { ...leereGeschmacksMatrix(), zitrus: 2.5, holzig: 2.5 }), 1);
});

test("Herstellertreue: zu viel und zu wenig zählen gleich", () => {
  const zuViel = herstellerTreue(HERSTELLER, { ...leereGeschmacksMatrix(), zitrus: 3.75, holzig: 2.5 });
  const zuWenig = herstellerTreue(HERSTELLER, { ...leereGeschmacksMatrix(), zitrus: 1.25, holzig: 2.5 });
  assert.equal(zuViel, 0.75);
  assert.equal(zuWenig, 0.75);
});

test("Herstellertreue: erwartete, nicht bewertete Achse zählt als zu wenig", () => {
  assert.equal(herstellerTreue(HERSTELLER, { ...leereGeschmacksMatrix(), zitrus: 2.5 }), 0.5);
});

test("Herstellertreue: zusätzlich bewertete Achse zählt mit", () => {
  assert.equal(
    herstellerTreue(HERSTELLER, { ...leereGeschmacksMatrix(), zitrus: 2.5, holzig: 2.5, blumig: 5 }),
    2 / 3,
  );
});

test("Herstellertreue: leeres Profil ergibt null", () => {
  assert.equal(herstellerTreue(HERSTELLER, leereGeschmacksMatrix()), null);
});
