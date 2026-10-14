import { test } from "node:test";
import assert from "node:assert/strict";
import { ordneNoten } from "@/lib/buch-statistik";

const z = (titel: string, mittel: number | null, anzahl: number) => ({ titel, href: `/blueten/${titel}`, mittel, anzahl });

test("Bestbewertet erst ab drei Bewertungen, höchstens fünf", () => {
  const r = ordneNoten([z("a", 4.9, 2), z("b", 4.5, 3), z("c", 4.1, 7), z("d", 3, 3), z("e", 2, 4), z("f", 1, 5), z("g", 4.5, 9)], "best");
  assert.deepEqual(r.map((e) => e.titel), ["g", "b", "c", "d", "e"]);
});

test("Niedrigst bewertet dreht die Reihenfolge, null fällt raus", () => {
  const r = ordneNoten([z("a", 1.2, 3), z("b", null, 9), z("c", 2, 3)], "niedrigst");
  assert.deepEqual(r.map((e) => e.titel), ["a", "c"]);
});
