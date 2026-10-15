import { test } from "node:test";
import assert from "node:assert/strict";
import { igHighlightHtml } from "@/lib/ig-highlight";
import { SAEULEN_FARBE } from "@/lib/ig-karussell";

test("Highlight-Cover: 1080x1920, maskiert, Säulenfarbe", () => {
  const h = igHighlightHtml("FAQ & <Co>", "portal", "https://x.dev");
  assert.ok(h.includes("width:1080px") && h.includes("height:1920px"));
  assert.ok(h.includes("FAQ &amp; &lt;Co&gt;"));
  assert.ok(h.includes(SAEULEN_FARBE.portal));
});
