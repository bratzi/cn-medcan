import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { explorerStart } from "@/components/story/explorer-zustand";
import { aromaAbfrage } from "@/lib/query/aroma-abfrage";
import type { ExplorerSorte } from "@/lib/query/sorten-explorer";

const lies = (p: string) => readFileSync(p, "utf8");

test("Startseite: genau eine Katalog-Sektion, Bewertung und Katalog vereint", () => {
  const seite = lies("app/[lang]/page.tsx");
  assert.doesNotMatch(seite, /<Katalog \/>/);
  assert.equal(existsSync("components/story/Katalog.tsx"), false);
  const sektion = lies("components/story/AromaSektion.tsx");
  assert.match(sektion, /ladeSortenExplorer/);
  assert.match(sektion, /<AromaWechsel/);
  assert.equal((sektion.match(/data-story=/g) ?? []).length, 1);
});

test("Explorer: Vorwahl der Sorte mit der vorgeführten Bewertung", () => {
  const sorten = [
    { slug: "a", waren: [{ vertreiberId: "v1" }] },
    { slug: "apples-bananas", waren: [{ vertreiberId: "v2" }] },
  ] as unknown as ExplorerSorte[];
  const z = explorerStart(sorten, true, "apples-bananas");
  assert.equal(z.sorte, "apples-bananas");
  assert.equal(z.ware, "v2");
  assert.equal(explorerStart(sorten, true, "fehlt").sorte, "a");
});

test("Aroma je Sorte: nur freigegebene Bewertungen, Sorte über den Kultivar-Slug", () => {
  const args = aromaAbfrage("apples-bananas");
  assert.deepEqual(args.where.reviews, { some: { freigegeben: true } });
  assert.deepEqual(args.where.kultivar, { slug: "apples-bananas" });
  assert.deepEqual(args.select.reviews.where, { freigegeben: true });
  assert.equal(aromaAbfrage(null).where.kultivar, undefined);
});

test("Route /api/aroma/[sorte]: 404 bei unbekannt, öffentlich cachebar, Tag katalog", () => {
  const route = lies("app/api/aroma/[sorte]/route.ts");
  assert.match(route, /status: 404/);
  assert.match(route, /public, max-age=300/);
  assert.match(route, /unstable_cache/);
  assert.match(route, /tags: \["katalog"\]/);
});
