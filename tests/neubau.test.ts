import { test } from "node:test";
import assert from "node:assert/strict";

import { NEUBAU_JE_TAG, neubauAnstossen } from "@/lib/neubau-kern";

const heute = () => "2026-10-22";

test("unter dem Deckel: sendet", async () => {
  let gesendet = 0;
  const r = await neubauAnstossen({ zaehle: async () => 3, sende: async () => ((gesendet++), new Response("{}")), heute });
  assert.equal(r, "gesendet");
  assert.equal(gesendet, 1);
});

test("über dem Deckel: sendet nicht", async () => {
  let gesendet = 0;
  const r = await neubauAnstossen({ zaehle: async () => NEUBAU_JE_TAG + 1, sende: async () => ((gesendet++), new Response("{}")), heute });
  assert.equal(r, "deckel");
  assert.equal(gesendet, 0);
});

test("Hook-Fehler: kein Wiederholen, meldet fehler", async () => {
  let versuche = 0;
  const r = await neubauAnstossen({ zaehle: async () => 1, sende: async () => ((versuche++), new Response("x", { status: 500 })), heute });
  assert.equal(r, "fehler");
  assert.equal(versuche, 1);
});
