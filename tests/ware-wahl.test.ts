import { test } from "node:test";
import assert from "node:assert/strict";
import { waehleWare, waehleZielBewertung } from "@/lib/ware-wahl";

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

const k = (id: string, strainId: string, wareGenau = true) => ({ id, strainId, wareGenau });

test("Ziel: Bewertung auf genau dem Zielprodukt geht vor (sonst P2002)", () => {
  // Alt-Bewertungen auf X (id a) und Y (id b) beim selben Vertreiber, gewählt ist Y.
  assert.deepEqual(waehleZielBewertung([k("a", "x1"), k("b", "x2")], { strainId: "x2", wareGenau: true }, true, ["x1", "x2"]), {
    zielId: "b", alteStrainId: "x2", strainId: "x2", wareGenau: true,
  });
});
test("Ziel: ohne Treffer auf dem Produkt die kleinste id, alte Ware wird gemeldet", () => {
  assert.deepEqual(waehleZielBewertung([k("c", "x2"), k("a", "x1")], { strainId: "x3", wareGenau: true }, true, ["x1", "x2", "x3"]), {
    zielId: "a", alteStrainId: "x1", strainId: "x3", wareGenau: true,
  });
});
test("Ziel: ohne Stärke bleibt die bekannte Stärke samt wareGenau", () => {
  assert.deepEqual(waehleZielBewertung([k("a", "x1", true)], { strainId: "x2", wareGenau: false }, false, ["x1", "x2"]), {
    zielId: "a", alteStrainId: "x1", strainId: "x1", wareGenau: true,
  });
});
test("Ziel: keine Bewertung, neu anlegen", () => {
  assert.deepEqual(waehleZielBewertung([], { strainId: "x2", wareGenau: false }, false, ["x1", "x2"]), {
    zielId: null, alteStrainId: null, strainId: "x2", wareGenau: false,
  });
});
