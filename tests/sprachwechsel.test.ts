import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { zielNachSprachwechsel } from "@/lib/i18n/sprachwechsel";

const ORIGIN = "https://cn-medcan.w-helwich.workers.dev";

test("Sprachwechsel führt auf die Seite zurück, von der er kam", () => {
  assert.equal(zielNachSprachwechsel(`${ORIGIN}/blueten?typ=INDICA`, ORIGIN), "/blueten?typ=INDICA");
  assert.equal(zielNachSprachwechsel(`${ORIGIN}/`, ORIGIN), "/");
  assert.equal(zielNachSprachwechsel(`${ORIGIN}/impressum`, ORIGIN), "/impressum");
});

test("Sprachwechsel: fremder, kaputter oder fehlender Referer führt auf die Startseite", () => {
  assert.equal(zielNachSprachwechsel(null, ORIGIN), "/");
  assert.equal(zielNachSprachwechsel("https://fremd.example/x", ORIGIN), "/");
  assert.equal(zielNachSprachwechsel("kein url", ORIGIN), "/");
  assert.equal(zielNachSprachwechsel(`${ORIGIN}//fremd.example`, ORIGIN), "/");
});

// Spec 2026-10-01, 4.1: refresh() der alten Server Action rendert nach dem Rewrite noch
// die alte Sprache. Ein normales Formular an den Route Handler laedt die Seite neu.
test("Schalter schickt ein normales Formular an /api/sprache", () => {
  const schalter = readFileSync("components/layout/SprachSchalter.tsx", "utf8");
  assert.match(schalter, /<form method="post" action="\/api\/sprache"/);
  assert.doesNotMatch(schalter, /spracheSetzen/);
  assert.equal(existsSync("lib/i18n/aktionen.ts"), false);
  const route = readFileSync("app/api/sprache/route.ts", "utf8");
  assert.match(route, /NextResponse\.redirect\(new URL\(ziel, anfrage\.url\), 303\)/);
  assert.match(route, /httpOnly: true/);
});
