import { test } from "node:test";
import assert from "node:assert/strict";

import { istFilterLeer, parseStrainFilter, serialisiereFilter } from "@/lib/query/filter";

const id = "4a5761be-5783-43ea-8223-a9e58cc75af8";

test("vertreiber: Liste aus Komma und Mehrfachwert, doppelt einmal", () => {
  const f = parseStrainFilter({ vertreiber: [`${id},${id}`, "abc-1"] });
  assert.deepEqual(f.vertreiber, [id, "abc-1"]);
  assert.equal(serialisiereFilter(f).get("vertreiber"), `${id},abc-1`);
  assert.equal(istFilterLeer(f), false);
});

test("alte Links mit hersteller= filtern nach Vertreiber (Review Focus)", () => {
  const f = parseStrainFilter({ hersteller: id });
  assert.deepEqual(f.vertreiber, [id]);
  assert.equal(serialisiereFilter(f).get("hersteller"), null);
  assert.equal(serialisiereFilter(f).get("vertreiber"), id);
});

test("vertreiber: Kaputtes fällt weg, kein Fehler", () => {
  const f = parseStrainFilter({ vertreiber: "<script>,,  " });
  assert.deepEqual(f.vertreiber, []);
  assert.equal(istFilterLeer(f), true);
});
