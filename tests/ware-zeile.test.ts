import assert from "node:assert/strict";
import test from "node:test";

import { wareZeile } from "@/lib/ware-zeile";

const texte = { ueber: "über {vertreiber}" };

test("wareZeile: genaue Ware nennt Vertreiber und Handelsname", () => {
  assert.equal(
    wareZeile({ vertreiberName: "Four 20 Pharma", wareGenau: true, handelsname: "MAC 1 22/1" }, texte),
    "über Four 20 Pharma · MAC 1 22/1",
  );
});

test("wareZeile: ungenaue Ware nennt nur den Vertreiber", () => {
  assert.equal(wareZeile({ vertreiberName: "Four 20 Pharma", wareGenau: false, handelsname: "MAC 1 22/1" }, texte), "über Four 20 Pharma");
});

test("wareZeile: ohne Vertreiber leer", () => {
  assert.equal(wareZeile({ vertreiberName: null, wareGenau: true, handelsname: "MAC 1 22/1" }, texte), "");
});
