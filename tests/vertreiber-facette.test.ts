import { test } from "node:test";
import assert from "node:assert/strict";

import { vertreiberFacette } from "@/lib/vertreiber-facette";

test("vertreiberFacette: eindeutige Namen bleiben, gleichnamige bekommen Land oder Rolle", () => {
  const liste = vertreiberFacette([
    { id: "a", name: "Aurora", land: "CA", rolle: "HERSTELLER", _count: { vertrieben: 3 } },
    { id: "b", name: "aurora ", land: "DE", rolle: "IMPORTEUR", _count: { vertrieben: 1 } },
    { id: "c", name: "Four 20 Pharma", land: null, rolle: "HERSTELLER", _count: { vertrieben: 28 } },
    { id: "d", name: "Doppel", land: null, rolle: "HERSTELLER", _count: { vertrieben: 2 } },
    { id: "e", name: "Doppel", land: null, rolle: "IMPORTEUR", _count: { vertrieben: 2 } },
  ]);
  assert.deepEqual(liste, [
    { id: "a", name: "Aurora (CA)", anzahl: 3 },
    { id: "b", name: "aurora (DE)", anzahl: 1 },
    { id: "c", name: "Four 20 Pharma", anzahl: 28 },
    { id: "d", name: "Doppel (HERSTELLER)", anzahl: 2 },
    { id: "e", name: "Doppel (IMPORTEUR)", anzahl: 2 },
  ]);
});
