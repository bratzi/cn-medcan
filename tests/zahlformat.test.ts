import { test } from "node:test";
import assert from "node:assert/strict";

import { zahlFormat } from "@/components/story/bewegung/zahlformat";

test("Zaehl-Animationen formatieren in der Sprache der Seite", () => {
  assert.equal(zahlFormat("de", 1).format(4.3), "4,3");
  assert.equal(zahlFormat("en", 1).format(4.3), "4.3");
  assert.equal(zahlFormat("en", 0).format(1284), "1,284");
  assert.equal(zahlFormat("de", 0).format(1284), "1.284");
  assert.equal(zahlFormat("", 0).format(1284), "1.284");
});
