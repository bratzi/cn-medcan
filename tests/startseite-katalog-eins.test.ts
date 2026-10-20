import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { explorerStart, explorerZustand } from "@/components/story/explorer-zustand";
import type { ExplorerSorte } from "@/lib/query/sorten-explorer";

const sorten = [{ slug: "a", waren: [{ vertreiberId: "v1" }] }] as unknown as ExplorerSorte[];

test("zu gestartet: keine Sorte gewählt, Wahl klappt auf", () => {
  const z = explorerStart(sorten, false);
  assert.equal(z.sorte, "");
  const auf = explorerZustand({ typ: "sorte", slug: "a", ersteWare: "v1" }, z);
  assert.equal(auf.sorte, "a");
});

test("offen bleibt Standard", () => {
  assert.equal(explorerStart(sorten).sorte, "a");
});

test("Startseite hat genau eine Sortensuche", () => {
  const seite = readFileSync("app/[lang]/page.tsx", "utf8");
  assert.doesNotMatch(seite, /<VertreiberKapitel\b/);
  assert.match(readFileSync("components/story/AromaWechsel.tsx", "utf8"), /SortenExplorer/);
});
