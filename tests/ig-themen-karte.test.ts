import { test } from "node:test";
import assert from "node:assert/strict";
import { igThemenKarteHtml, type IgThema } from "@/lib/ig-themen-karte";

const t: IgThema = { art: "terpen", kicker: "Terpen im Porträt", titel: "Limonen & Co", text: "Riecht nach <Zitrusschale>.", punkte: ["Vorkommen: Zitronenschale", "Aroma: Zitrus"], farbe: "#f2d129" };

test("Themenkarte maskiert und enthält alle Teile", () => {
  const h = igThemenKarteHtml(t, "https://x.dev");
  assert.ok(h.startsWith("<!doctype html>"));
  assert.ok(h.includes("Limonen &amp; Co"));
  assert.ok(h.includes("&lt;Zitrusschale&gt;"));
  assert.ok(h.includes("Terpen im Porträt"));
  assert.ok(h.includes("Vorkommen: Zitronenschale"));
  assert.ok(h.includes("#f2d129"));
  assert.ok(h.includes("width:1080px") && h.includes("height:1350px"));
  assert.ok(h.includes("https://x.dev/marke/pinsel-of.webp"));
});

test("ohne Punkte und Farbe keine Lücken", () => {
  const h = igThemenKarteHtml({ ...t, punkte: [], farbe: undefined }, "https://x.dev");
  assert.ok(!h.includes("undefined") && !h.includes("null") && !h.includes("<ul>"));
});

test("ungültige Farbe fällt auf Blattgrün zurück", () => {
  const h = igThemenKarteHtml({ ...t, farbe: "red;}body{x" }, "https://x.dev");
  assert.ok(!h.includes("red;}"));
});
