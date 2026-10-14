import { test } from "node:test";
import assert from "node:assert/strict";
import { igReview } from "@/lib/ig-feed";

const basis = { id: "r1", slug: "s", handelsname: "Lemon", vertreiber: "Adrex", charge: "C1", gesamtnote: 4.31, aromen: ["ZITRUS"], notiz: "Zitrus vorne", bilder: [{ id: "b1", status: "FREIGEGEBEN" }, { id: "b2", status: "OFFEN" }], erstelltAm: new Date("2026-10-01"), freigegeben: true, istRedaktionell: true, wirkung: 5 };
const ursprung = "https://x.dev";

test("nur freigegebene Betreiber-Reviews", () => {
  assert.equal(igReview({ ...basis, freigegeben: false }, ursprung), null);
  assert.equal(igReview({ ...basis, istRedaktionell: false }, ursprung), null);
});

test("nur freigegebene Bilder, keine Wirkung, Note gerundet", () => {
  const r = igReview(basis, ursprung)!;
  assert.deepEqual(r.bilder, ["https://x.dev/api/bild/b1"]);
  assert.equal("wirkung" in r, false);
  assert.equal(r.gesamtnote, 4.3);
  assert.equal(r.url, "https://x.dev/blueten/s");
});

test("Notiz mit Wirkversprechen fällt weg", () => {
  assert.equal(igReview({ ...basis, notiz: "hilft bei Migräne" }, ursprung)!.notiz, null);
});
