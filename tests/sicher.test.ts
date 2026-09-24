import { test } from "node:test";
import assert from "node:assert/strict";

import { sicher } from "@/lib/sicher";

test("ohne Fehler kommt der geladene Wert", async () => {
  assert.equal(await sicher(async () => "geladen", "ersatz", "test"), "geladen");
});

test("bei einem Fehler kommt der Ersatzwert, die Seite bleibt stehen", async () => {
  const fehler = console.error;
  console.error = () => undefined;
  try {
    assert.equal(await sicher(async () => Promise.reject(new Error("D1 weg")), "ersatz", "test"), "ersatz");
  } finally {
    console.error = fehler;
  }
});
