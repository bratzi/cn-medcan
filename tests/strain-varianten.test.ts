import { test } from "node:test";
import assert from "node:assert/strict";

import { auswahlSegment } from "@/lib/seiten-tor";
import { leseAuswahl, variantenFuer } from "@/lib/strain-varianten";

test("leseAuswahl ist die Umkehrung von auswahlSegment", () => {
  for (const [id, alle] of [[null, false], ["abc-1", false], ["abc-1", true]] as const) {
    assert.deepEqual(leseAuswahl(auswahlSegment(id, alle)), { vertreiberId: id, alle: id ? alle : false });
  }
  assert.equal(leseAuswahl("quatsch"), null);
});

test("variantenFuer: Standard plus je Vertreiber zwei, je Sprache", () => {
  const v = variantenFuer([{ slug: "mac-1", vertreiberIds: ["a", "b"] }]);
  assert.equal(v.length, 2 * (1 + 2 * 2));
  assert.ok(v.some((x) => x.lang === "en" && x.slug === "mac-1" && x.auswahl === "v-b-alle"));
});
