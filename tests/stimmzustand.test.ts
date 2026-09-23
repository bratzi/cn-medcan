import { test } from "node:test";
import assert from "node:assert/strict";

import { stimmZustand } from "@/components/umfrage/stimmzustand";

test("ohne Anmeldung: ANONYM", () => {
  assert.deepEqual(stimmZustand(null, null), { art: "ANONYM" });
});

test("angemeldet, nicht freigegeben: FREIGABE_OFFEN, auch wenn eine Stimme übergeben wird", () => {
  assert.deepEqual(stimmZustand({ freigegeben: false }, "opt-1"), { art: "FREIGABE_OFFEN" });
});

test("freigegeben ohne Stimme: STIMMBERECHTIGT", () => {
  assert.deepEqual(stimmZustand({ freigegeben: true }, null), { art: "STIMMBERECHTIGT" });
});

test("freigegeben mit Stimme: ABGESTIMMT mit der Option", () => {
  assert.deepEqual(stimmZustand({ freigegeben: true }, "opt-1"), { art: "ABGESTIMMT", optionId: "opt-1" });
});
