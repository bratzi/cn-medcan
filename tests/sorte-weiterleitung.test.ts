import { test } from "node:test";
import assert from "node:assert/strict";

import { sortenWeiterleitung } from "@/lib/alte-adressen";

const produkte: Record<string, string> = { "420-evolution-22-1-ca-mac": "mac-1" };
const kultivarSlugVon = (slug: string) => produkte[slug] ?? null;

test("alte Produktadresse leitet auf die Sorte mit ?ware", () => {
  assert.equal(
    sortenWeiterleitung("/blueten/420-evolution-22-1-ca-mac", "", kultivarSlugVon),
    "/blueten/mac-1?ware=420-evolution-22-1-ca-mac",
  );
});

test("vorhandene Query bleibt angehängt", () => {
  assert.equal(
    sortenWeiterleitung("/blueten/420-evolution-22-1-ca-mac", "?x=1", kultivarSlugVon),
    "/blueten/mac-1?ware=420-evolution-22-1-ca-mac&x=1",
  );
});

test("Kultivar-Slug selbst leitet nicht weiter", () => {
  assert.equal(sortenWeiterleitung("/blueten/mac-1", "", (s) => (s === "mac-1" ? "mac-1" : null)), null);
});

test("unbekannter Slug und fremde Pfade leiten nicht weiter", () => {
  assert.equal(sortenWeiterleitung("/blueten/gibts-nicht", "", kultivarSlugVon), null);
  assert.equal(sortenWeiterleitung("/blueten", "", kultivarSlugVon), null);
  assert.equal(sortenWeiterleitung("/profil/420-evolution-22-1-ca-mac", "", kultivarSlugVon), null);
});
