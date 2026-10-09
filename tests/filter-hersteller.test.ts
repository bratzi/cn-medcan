import { test } from "node:test";
import assert from "node:assert/strict";

import { istFilterLeer, parseStrainFilter, serialisiereFilter } from "@/lib/query/filter";

const id = "4a5761be-5783-43ea-8223-a9e58cc75af8";

test("hersteller: Liste aus Komma und Mehrfachwert, doppelt einmal", () => {
  const f = parseStrainFilter({ hersteller: [`${id},${id}`, "abc-1"] });
  assert.deepEqual(f.hersteller, [id, "abc-1"]);
  assert.equal(serialisiereFilter(f).get("hersteller"), `${id},abc-1`);
  assert.equal(istFilterLeer(f), false);
});

test("hersteller: Kaputtes fällt weg, kein Fehler (Review Focus 4)", () => {
  const f = parseStrainFilter({ hersteller: "<script>,,  " });
  assert.deepEqual(f.hersteller, []);
  assert.equal(istFilterLeer(f), true);
});
