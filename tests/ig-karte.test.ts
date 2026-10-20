import { test } from "node:test";
import assert from "node:assert/strict";
import { igKarteHtml, kartenZitat } from "@/lib/ig-karte";
import type { IgReview } from "@/lib/ig-feed";

const r: IgReview = { id: "r1", url: "https://x.dev/blueten/s", karte: "https://x.dev/api/ig-karte/r1", bluete: "Apples & Bananas", vertreiber: "MGF <Via>", charge: "C1", gesamtnote: 4.5, aromen: ["ZITRUS", "SUESS"], notiz: "Zitrus vorne", bilder: [], datum: "2026-10-01T00:00:00.000Z" };

test("Zitat: kurz bleibt, lang wird an Wortgrenze gekürzt", () => {
  assert.equal(kartenZitat("Zitrus vorne"), "Zitrus vorne");
  const lang = "wort ".repeat(40).trim();
  const z = kartenZitat(lang)!;
  assert.ok(z.length <= 140);
  assert.ok(z.endsWith("…"));
  assert.ok(!z.slice(0, -1).endsWith(" "));
});

test("Zitat: Umbrüche werden Leerzeichen, leer und HWG ergeben null", () => {
  assert.equal(kartenZitat("a\r\n\r\nb"), "a b");
  assert.equal(kartenZitat(null), null);
  assert.equal(kartenZitat("   "), null);
  assert.equal(kartenZitat("hilft bei Migräne"), null);
});

test("HTML maskiert und enthält Kerndaten", () => {
  const h = igKarteHtml(r, "https://x.dev");
  assert.ok(h.startsWith("<!doctype html>"));
  assert.ok(h.includes("Apples &amp; Bananas"));
  assert.ok(h.includes("MGF &lt;Via&gt;"));
  assert.ok(!h.includes("<Via>"));
  assert.ok(h.includes("4,5"));
  assert.ok(h.includes("Zitrus") && h.includes("Süß"));
  assert.ok(h.includes("C1"));
  assert.ok(h.includes("https://x.dev/marke/pinsel.webp"));
  assert.ok(h.includes("width:1080px") && h.includes("height:1350px"));
});

test("fehlende Felder erzeugen keine Lücken", () => {
  const h = igKarteHtml({ ...r, gesamtnote: null, charge: null, vertreiber: null, notiz: null, aromen: [] }, "https://x.dev");
  assert.ok(!h.includes("null"));
  assert.ok(!h.includes("undefined"));
  assert.ok(!h.includes("Charge"));
});

test("Zitat: Wirkung, Rausch und Konsum nehmen es ganz heraus", () => {
  assert.equal(kartenZitat("Sehr süß. 25% THC, ballert einen nicht aus dem Leben."), null);
  assert.equal(kartenZitat("Sehr gutes Raucherlebnis"), null);
  assert.equal(kartenZitat("Gutes daily für den Tag"), null);
  assert.equal(kartenZitat("Mega gassy, zitronig."), "Mega gassy, zitronig.");
});
