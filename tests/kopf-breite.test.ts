import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const kopf = readFileSync("components/layout/Kopf.tsx", "utf8");

test("Kopf: volle Breite, keine max-w-360", () => {
  assert.doesNotMatch(kopf, /max-w-360/);
});

test("Kopf: ab lg Logo links, Navigation und Konto rechts", () => {
  assert.match(kopf, /lg:grid-cols-\[auto_1fr_auto\]/);
  assert.match(kopf, /<nav\s+aria-label=\{w\.kopf\.hauptnavigation\}\s+className="[^"]*justify-self-end/);
});
