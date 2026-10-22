import { test } from "node:test";
import assert from "node:assert/strict";

import { slugParameter } from "@/lib/strain-slugs";

test("slugParameter: eine Seite je Strain und Sprache, doppelte Slugs einmal", () => {
  const v = slugParameter(["mac-1", "mac-1", "gelato"]);
  assert.deepEqual(v, [
    { lang: "de", slug: "mac-1" },
    { lang: "de", slug: "gelato" },
    { lang: "en", slug: "mac-1" },
    { lang: "en", slug: "gelato" },
  ]);
});
