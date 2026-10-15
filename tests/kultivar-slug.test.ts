import { test } from "node:test";
import assert from "node:assert/strict";
import { freierKultivarSlug, kultivarSlugs } from "@/lib/kultivar-slug";

test("Slugs aus Namen, Kollision bekommt Zähler", () => {
  const m = kultivarSlugs([
    { id: "a", name: "8 Ball Kush" },
    { id: "b", name: "8-Ball Kush" },
    { id: "c", name: "Gelato" },
  ]);
  assert.equal(m.get("a"), "8-ball-kush");
  assert.equal(m.get("b"), "8-ball-kush-2");
  assert.equal(m.get("c"), "gelato");
});

test("freierKultivarSlug: Basis frei oder nächster Zähler", () => {
  assert.equal(freierKultivarSlug("Gelato Mint", []), "gelato-mint");
  assert.equal(freierKultivarSlug("Gelato Mint", ["gelato-mint", "gelato-mint-2"]), "gelato-mint-3");
});
