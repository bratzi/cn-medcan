import { test } from "node:test";
import assert from "node:assert/strict";

import { terpenAnzeige } from "@/lib/i18n/terpen";

test("terpenAnzeige: -en wird im Englischen -ene, -ol bleibt, Deutsch unveraendert", () => {
  assert.equal(terpenAnzeige("Myrcen", "de"), "Myrcen");
  assert.equal(terpenAnzeige("Myrcen", "en"), "Myrcene");
  assert.equal(terpenAnzeige("beta-Caryophyllen", "en"), "beta-Caryophyllene");
  assert.equal(terpenAnzeige("Linalool", "en"), "Linalool");
  assert.equal(terpenAnzeige("Ester", "en"), "Esters");
  assert.equal(terpenAnzeige("Thiole", "en"), "Thiols");
});
