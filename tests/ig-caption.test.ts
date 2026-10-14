import { test } from "node:test";
import assert from "node:assert/strict";
import { igCaption } from "@/lib/ig-caption";
import type { IgReview } from "@/lib/ig-feed";

const r: IgReview = { id: "r1", url: "https://x.dev/blueten/s", karte: "https://x.dev/api/ig-karte/r1", bluete: "Apples & Bananas", vertreiber: "MGF", charge: "C1", gesamtnote: 4.5, aromen: ["ZITRUS", "SUESS"], notiz: "Zitrus vorne", bilder: [], datum: "2026-10-01T00:00:00.000Z" };

test("Caption enthält Kerndaten, Link-Hinweis und Hashtags aus den Aromen", () => {
  const c = igCaption(r);
  assert.ok(c.startsWith("Apples & Bananas von MGF"));
  assert.ok(c.includes("4,5 von 5 Blättern"));
  assert.ok(c.includes("Zitrus, Süß"));
  assert.ok(c.includes("Charge C1"));
  assert.ok(c.includes("„Zitrus vorne“"));
  assert.ok(c.includes("Ganze Bewertung: Link in Bio"));
  assert.ok(c.includes("#bookofterpz") && c.includes("#zitrus") && c.includes("#suess"));
});

test("fehlende Felder: keine Lücken, kein null", () => {
  const c = igCaption({ ...r, vertreiber: null, gesamtnote: null, charge: null, notiz: null, aromen: [] });
  assert.ok(c.startsWith("Apples & Bananas\n"));
  assert.ok(!c.includes("null") && !c.includes("undefined"));
  assert.ok(!c.includes("Charge") && !c.includes("Blättern") && !c.includes("„"));
});

test("Notiz mit Wirkversprechen erscheint nicht", () => {
  assert.ok(!igCaption({ ...r, notiz: "hilft bei Migräne" }).includes("Migräne"));
});
