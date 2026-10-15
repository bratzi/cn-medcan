import { test } from "node:test";
import assert from "node:assert/strict";

import {
  verdichteExplorerSorte,
  waehleExplorerSorten,
  type ExplorerSorte,
  type ExplorerWare,
} from "@/lib/query/sorten-explorer";

const ware = (teil: Partial<ExplorerWare> = {}): ExplorerWare => ({
  vertreiberId: "v", vertreiberName: "V", thc: [20, 24], cbd: [0, 1], staerken: 1, anzahl: 0, note: null, ...teil,
});
const zweiWaren = [ware({ vertreiberId: "a", vertreiberName: "A" }), ware({ vertreiberId: "b", vertreiberName: "B" })];
const sorte = (teil: Partial<ExplorerSorte> = {}): ExplorerSorte => ({
  slug: "s", name: "S", typ: "HYBRID", anzahl: 0, waren: zweiWaren, ...teil,
});

test("waehleExplorerSorten: Sorte mit nur einer Ware fällt raus", () => {
  const ergebnis = waehleExplorerSorten([sorte({ slug: "eins", waren: [ware()] }), sorte({ slug: "zwei" })]);
  assert.deepEqual(ergebnis.map((s) => s.slug), ["zwei"]);
});

test("waehleExplorerSorten: höchstens 12 Sorten", () => {
  const kandidaten = Array.from({ length: 13 }, (_, i) => sorte({ slug: `s${i}`, name: `S${String(i).padStart(2, "0")}` }));
  assert.equal(waehleExplorerSorten(kandidaten).length, 12);
});

test("waehleExplorerSorten: nach Anzahl, dann Name, nie nach Note", () => {
  const ergebnis = waehleExplorerSorten([
    sorte({ slug: "z", name: "Zkittlez", anzahl: 3, waren: zweiWaren.map((w) => ({ ...w, note: 9 })) }),
    sorte({ slug: "m", name: "MAC 1", anzahl: 3, waren: zweiWaren.map((w) => ({ ...w, note: 2 })) }),
    sorte({ slug: "g", name: "Gelato", anzahl: 5 }),
  ]);
  assert.deepEqual(ergebnis.map((s) => s.slug), ["g", "m", "z"]);
});

test("waehleExplorerSorten: höchstens 8 Waren je Sorte, nach Anzahl dann Name", () => {
  const waren = Array.from({ length: 9 }, (_, i) =>
    ware({ vertreiberId: `v${i}`, vertreiberName: `V${i}`, anzahl: i === 8 ? 5 : 0, note: i === 0 ? 10 : 1 }),
  );
  const [ergebnis] = waehleExplorerSorten([sorte({ waren })]);
  assert.equal(ergebnis.waren.length, 8);
  assert.equal(ergebnis.waren[0].vertreiberId, "v8");
  assert.equal(ergebnis.waren[1].vertreiberId, "v0");
  assert.ok(!ergebnis.waren.some((w) => w.vertreiberId === "v7"));
});

test("verdichteExplorerSorte: fasst Strains je Vertreiber zu einer Ware zusammen", () => {
  const s = verdichteExplorerSorte({
    slug: "gelato",
    name: "Gelato",
    kennwerte: { anzahl: 4 },
    vertreiberKennwerte: [{ vertreiberId: "a", anzahl: 3, gesamtnoteMittel: 7.5 }],
    strains: [
      { kultivarTyp: "INDICA", thcMinProzent: 20, thcMaxProzent: 24, cbdMinProzent: 0, cbdMaxProzent: 1, vertreiber: { id: "a", name: "Aurora" } },
      { kultivarTyp: "INDICA", thcMinProzent: 26, thcMaxProzent: 28, cbdMinProzent: 0, cbdMaxProzent: 0.5, vertreiber: { id: "a", name: "Aurora" } },
      { kultivarTyp: "HYBRID", thcMinProzent: 18, thcMaxProzent: 22, cbdMinProzent: 1, cbdMaxProzent: 2, vertreiber: { id: "b", name: "Bedrocan" } },
      { kultivarTyp: "INDICA", thcMinProzent: 18, thcMaxProzent: 22, cbdMinProzent: 1, cbdMaxProzent: 2, vertreiber: null },
    ],
  });
  assert.equal(s?.typ, "INDICA");
  assert.equal(s?.anzahl, 4);
  assert.deepEqual(s?.waren[0], { vertreiberId: "a", vertreiberName: "Aurora", thc: [20, 28], cbd: [0, 1], staerken: 2, anzahl: 3, note: 7.5 });
  assert.deepEqual(s?.waren[1], { vertreiberId: "b", vertreiberName: "Bedrocan", thc: [18, 22], cbd: [1, 2], staerken: 1, anzahl: 0, note: null });
});

test("verdichteExplorerSorte: ohne Slug keine Sorte", () => {
  assert.equal(verdichteExplorerSorte({ slug: null, name: "X", kennwerte: null, vertreiberKennwerte: [], strains: [] }), null);
});
