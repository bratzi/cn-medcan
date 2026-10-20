import assert from "node:assert/strict";
import { test } from "node:test";

import { filterDeaktiviert, weiter } from "@/lib/katalog/zustand";

const DATEN = { stand: "", fachkreis: false, waren: [], kultivare: [], vertreiber: [], terpene: [], apotheken: [] };

test("Fehler beim Laden: Filter aus, Startliste bleibt (kein bereit)", () => {
  const z = weiter(weiter({ art: "start" }, { typ: "laden" }), { typ: "fehlgeschlagen" });
  assert.equal(z.art, "fehler");
  assert.equal(filterDeaktiviert(z), true);
});

test("Erneut versuchen nach Fehler führt zu bereit", () => {
  const z = weiter(weiter({ art: "fehler" }, { typ: "laden" }), { typ: "geladen", daten: DATEN });
  assert.equal(z.art, "bereit");
  assert.equal(filterDeaktiviert(z), false);
});
