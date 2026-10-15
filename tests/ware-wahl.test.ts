import { test } from "node:test";
import assert from "node:assert/strict";
import { waehleWare } from "@/lib/ware-wahl";

const p = (id: string, v: string, h: string) => ({ id, vertreiberId: v, handelsname: h, aktiv: true });
const produkte = [p("x1", "V1", "B 22/1"), p("x2", "V1", "A 27/1"), p("y1", "V2", "C 20/1")];

test("ein Produkt beim Vertreiber: genau", () => {
  assert.deepEqual(waehleWare(produkte, "V2", null), { ok: true, strainId: "y1", wareGenau: true });
});
test("mehrere Stärken, keine gewählt: erstes nach Handelsname, ungenau", () => {
  assert.deepEqual(waehleWare(produkte, "V1", null), { ok: true, strainId: "x2", wareGenau: false });
});
test("Stärke gewählt: genau", () => {
  assert.deepEqual(waehleWare(produkte, "V1", "x1"), { ok: true, strainId: "x1", wareGenau: true });
});
test("fremder Vertreiber", () => {
  assert.deepEqual(waehleWare(produkte, "V9", null), { ok: false, grund: "vertreiberFremd" });
});
test("Produkt eines anderen Vertreibers", () => {
  assert.deepEqual(waehleWare(produkte, "V1", "y1"), { ok: false, grund: "produktFremd" });
});
