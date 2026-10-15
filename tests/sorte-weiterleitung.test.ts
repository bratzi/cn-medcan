import { test } from "node:test";
import assert from "node:assert/strict";

import { abgeloesteSorteWeiterleitung, bluetenHref, sortenWeiterleitung } from "@/lib/alte-adressen";

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

test("bluetenHref zielt direkt auf die Sorte mit ?ware", () => {
  assert.equal(bluetenHref("420-evolution-22-1-ca-mac", "mac-1"), "/blueten/mac-1?ware=420-evolution-22-1-ca-mac");
  assert.equal(bluetenHref("a b", "mac-1"), "/blueten/mac-1?ware=a%20b");
});

test("bluetenHref ohne oder mit gleichem Sorten-Slug bleibt bei der Produktadresse", () => {
  assert.equal(bluetenHref("mac-1", "mac-1"), "/blueten/mac-1");
  assert.equal(bluetenHref("x", null), "/blueten/x");
  assert.equal(bluetenHref("x", undefined), "/blueten/x");
});

test("abgeloester Sorten-Slug leitet auf die behaltene Sorte, Query bleibt", () => {
  assert.equal(abgeloesteSorteWeiterleitung("/blueten/8-ball-kush-2", ""), "/blueten/8-ball-kush");
  assert.equal(abgeloesteSorteWeiterleitung("/blueten/8-ball-kush-2", "?ware=x"), "/blueten/8-ball-kush?ware=x");
  assert.equal(abgeloesteSorteWeiterleitung("/blueten/8-ball-kush", ""), null);
  assert.equal(abgeloesteSorteWeiterleitung("/blueten/constructor", ""), null);
});
