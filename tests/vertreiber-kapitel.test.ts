import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Startseite: Kapitel direkt nach TransparentMachen", () => {
  const q = readFileSync("app/[lang]/page.tsx", "utf8");
  assert.ok(q.indexOf("<TransparentMachen />") < q.indexOf("<VertreiberKapitel />"));
  assert.ok(q.indexOf("<VertreiberKapitel />") < q.indexOf("<TerpenRegister />"));
});

test("VertreiberKapitel: eigene Suspense-Grenze, Schlagwort, Fehler mit unstable_rethrow", () => {
  const q = readFileSync("components/story/VertreiberKapitel.tsx", "utf8");
  assert.match(q, /<Suspense/);
  assert.match(q, /<Schlagwort/);
  assert.match(q, /unstable_rethrow/);
  assert.match(q, /data-story="vertreiber"/);
});
