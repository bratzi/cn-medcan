import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Admin zeigt gemeldete Kommentare mit Freigeben und Löschen", () => {
  const s = readFileSync("components/admin/bereiche/Gemeldet.tsx", "utf8");
  assert.match(s, /id="gemeldet-titel"/);
  assert.match(s, /gemeldeteKommentare\(\)/);
  const k = readFileSync("components/admin/GemeldeterKommentar.tsx", "utf8");
  assert.match(k, /adminEntscheide/);
});

test("Verwerfen einer Bewertung räumt Likes, Kommentare und Zähler ab", () => {
  assert.match(readFileSync("app/[lang]/admin/aktionen.ts", "utf8"), /raeumeZielAb\(prisma, "BEWERTUNG"/);
});
