import { test } from "node:test";
import assert from "node:assert/strict";

import {
  slugAusName,
  strainIdAusSlug,
  unternehmensIdAusSchluessel,
  unternehmensSchluessel,
} from "@/lib/stamm-id";

test("slugAusName folgt scripts/stamm/sql-erzeugen.py", () => {
  assert.equal(slugAusName("Apples & Bananas"), "apples-bananas");
  assert.equal(slugAusName("Grüne Soße 22/1"), "gruene-sosse-22-1");
  assert.equal(slugAusName("  Ärger  "), "aerger");
  assert.equal(slugAusName("&&&"), "");
});

test("strainIdAusSlug ergibt dieselbe uuid5 wie Python", async () => {
  assert.equal(await strainIdAusSlug("apples-bananas"), "2d02638e-6813-508a-bef8-7e52e3349e92");
  assert.equal(await strainIdAusSlug("gruene-sosse-22-1"), "3d5bfe35-ab54-5b16-a89d-f668128add61");
  assert.equal(await strainIdAusSlug("aerger"), "e6bdf44a-5517-5909-9659-31e5d436ba24");
});

test("unternehmensSchluessel und Id wie firma() im Importskript", async () => {
  assert.equal(unternehmensSchluessel("Aurora Pharma GmbH"), "aurora");
  assert.equal(unternehmensSchluessel("Bedrocan International"), "bedrocan");
  assert.equal(unternehmensSchluessel("Tilray"), "tilray");
  assert.equal(unternehmensSchluessel("unbekannt"), null);
  assert.equal(unternehmensSchluessel("Nicht genannt"), null);
  assert.equal(unternehmensSchluessel("   "), null);
  assert.equal(await unternehmensIdAusSchluessel("aurora"), "077df828-700f-5a15-a477-488af42cc3f4");
  assert.equal(await unternehmensIdAusSchluessel("tilray"), "ed08922a-5136-55b3-8750-b1ba5aad8fee");
  assert.equal(await unternehmensIdAusSchluessel("bedrocan"), "6fe95d01-4deb-5ead-9614-1317775000db");
});
