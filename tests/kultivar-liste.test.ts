import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { verdichteKultivar, weitereVertreiber, type KultivarZeile } from "@/lib/query/kultivar-liste";

const jeKultivar = new Map([["k1", new Set(["v1", "v2", "v3"])]]);

test("weitereVertreiber: andere Vertreiber derselben Blüte ohne den eigenen", () => {
  assert.equal(weitereVertreiber({ kultivarId: "k1", vertreiberId: "v1" }, jeKultivar), 2);
  assert.equal(weitereVertreiber({ kultivarId: "k1", vertreiberId: null }, jeKultivar), 3);
  assert.equal(weitereVertreiber({ kultivarId: "k2", vertreiberId: "v1" }, jeKultivar), 0);
  assert.equal(weitereVertreiber({ kultivarId: null, vertreiberId: "v1" }, jeKultivar), 0);
});

const zeile = (teil: Partial<KultivarZeile>): KultivarZeile => ({
  id: "k1",
  name: "MAC 1",
  kennwerte: null,
  strains: [],
  ...teil,
});

test("verdichteKultivar: Typ-Mehrheit, THC-Spanne, Vertreiber eindeutig und sortiert, unbekannte fehlen", () => {
  const e = verdichteKultivar(
    zeile({
      kennwerte: { gesamtnoteMittel: 3.8, anzahl: 4 },
      strains: [
        { kultivarTyp: "INDICA", thcMinProzent: 20, thcMaxProzent: 22, vertreiber: { name: "Zeta" } },
        { kultivarTyp: "HYBRID", thcMinProzent: 18, thcMaxProzent: 25, vertreiber: { name: "Alpha" } },
        { kultivarTyp: "INDICA", thcMinProzent: 24, thcMaxProzent: 26, vertreiber: { name: "Zeta" } },
        { kultivarTyp: "INDICA", thcMinProzent: 21, thcMaxProzent: 21, vertreiber: null },
      ],
    }),
  );
  assert.equal(e.typ, "INDICA");
  assert.equal(e.thcMin, 18);
  assert.equal(e.thcMax, 26);
  assert.deepEqual(e.vertreiber, ["Alpha", "Zeta"]);
  assert.equal(e.handelsnamen, 4);
  assert.equal(e.overall, 3.8);
  assert.equal(e.bewertungen, 4);
});

test("verdichteKultivar: ohne Kennwerte kein Overall, ohne Handelsnamen keine Spanne", () => {
  const e = verdichteKultivar(zeile({}));
  assert.equal(e.overall, null);
  assert.equal(e.bewertungen, 0);
  assert.equal(e.thcMin, null);
  assert.equal(e.typ, "HYBRID");
});

test("kultivar-liste.ts: groupBy statt Schleife, jede findMany mit take, Blätterung wie die Liste", () => {
  const q = readFileSync("lib/query/kultivar-liste.ts", "utf8");
  assert.match(q, /groupBy\(\{\s*by: \["kultivarId", "vertreiberId"\]/);
  assert.match(q, /strains: \{ some: /);
  assert.match(q, /orderBy: \{ name: "asc" \}/);
  assert.match(q, /take: TREFFER_PRO_SEITE/);
  assert.doesNotMatch(q, /for \([^)]*\) \{[^}]*await/);
});
