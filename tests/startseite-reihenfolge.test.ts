import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Startseite in der Reihenfolge der Spec 2026-10-20", () => {
  const q = readFileSync("app/[lang]/page.tsx", "utf8");
  const folge = ["Auftakt", "TerpenBand", "TransparentMachen", "DeinKapitel", "AromaSektion", "NeuesterEintrag",
    "TerpenRegister", "Katalog", "WissenBuendeln", "GemeinsamLernen", "Empfehlungen", "Abstimmung"];
  const stellen = folge.map((n) => q.indexOf(`<${n} />`));
  assert.ok(stellen.every((s) => s >= 0), JSON.stringify(stellen));
  for (let i = 1; i < stellen.length; i++) assert.ok(stellen[i - 1] < stellen[i], folge[i]);
  assert.match(q, /dynamic = "force-static"/);
});
