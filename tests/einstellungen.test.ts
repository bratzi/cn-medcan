import { test } from "node:test";
import assert from "node:assert/strict";

import { EINSTELLUNG_SKRIPT, naechsterZeiger, sparVorgabe } from "@/lib/einstellungen";

test("Sparmodus: gespeicherte Wahl schlägt die Datensparvorgabe", () => {
  assert.equal(sparVorgabe("an", false), true);
  assert.equal(sparVorgabe("aus", true), false);
});

test("Sparmodus: ohne gespeicherte Wahl entscheidet saveData", () => {
  assert.equal(sparVorgabe(null, true), true);
  assert.equal(sparVorgabe(null, false), false);
  assert.equal(sparVorgabe("unsinn", false), false);
});

test("Zeiger wechselt reihum und fängt Unbekanntes als Standard ab", () => {
  assert.equal(naechsterZeiger("joint"), "standard");
  assert.equal(naechsterZeiger("standard"), "joint");
});

test("Kopf-Skript setzt beide Attribute und übersteht gesperrten Speicher", () => {
  assert.match(EINSTELLUNG_SKRIPT, /data-sparmodus/);
  assert.match(EINSTELLUNG_SKRIPT, /data-zeiger/);
  assert.match(EINSTELLUNG_SKRIPT, /^\(function\(\)\{try\{/);
});
