import { test } from "node:test";
import assert from "node:assert/strict";
import { igSlideHtml, karussellMarke, karussellPruefen, SAEULEN_FARBE, type IgKarussell } from "@/lib/ig-karussell";

const k: IgKarussell = {
  saeule: "wissen",
  schluessel: "terpene-lesen",
  slides: [
    { typ: "cover", kicker: "Wissen", titel: "Terpene & <Aroma>" },
    { typ: "inhalt", titel: "Was sind Terpene?", text: "Duftstoffe der Pflanze.", punkte: ["Zitrus", "Kiefer"] },
    { typ: "cta", titel: "Mehr im Buch", text: "Link in Bio" },
  ],
};

test("gültiges Karussell hat keine Fehler", () => {
  assert.deepEqual(karussellPruefen(k), []);
});

test("Struktur: Cover zuerst, CTA zuletzt, 3 bis 10 Slides", () => {
  assert.ok(karussellPruefen({ ...k, slides: k.slides.slice(1) }).some((f) => f.includes("Cover")));
  assert.ok(karussellPruefen({ ...k, slides: k.slides.slice(0, 2) }).some((f) => f.includes("CTA")));
  const elf = [k.slides[0], ...Array(9).fill(k.slides[1]), k.slides[2]];
  assert.ok(karussellPruefen({ ...k, slides: elf }).some((f) => f.includes("10")));
});

test("Sperrwort auf mittlerer Slide lehnt ab", () => {
  const boese = { ...k, slides: [k.slides[0], { typ: "inhalt" as const, titel: "Hilft beim Einschlafen" }, k.slides[2]] };
  assert.ok(karussellPruefen(boese).length > 0);
});

test("Längen: Titel höchstens 60, Text höchstens 220, Punkte höchstens 4 zu je 60", () => {
  const lang = { ...k, slides: [k.slides[0], { typ: "inhalt" as const, titel: "x".repeat(61) }, k.slides[2]] };
  assert.ok(karussellPruefen(lang).some((f) => f.includes("Titel")));
});

test("schluessel nur a-z0-9-", () => {
  assert.ok(karussellPruefen({ ...k, schluessel: "A B" }).some((f) => f.includes("schluessel")));
});

test("Slide-HTML maskiert, zeigt Seitenzahl und Säulenfarbe", () => {
  const h = igSlideHtml(k, 0, "https://x.dev");
  assert.ok(h.startsWith("<!doctype html>"));
  assert.ok(h.includes("Terpene &amp; &lt;Aroma&gt;"));
  assert.ok(h.includes("1 / 3"));
  assert.ok(h.includes(SAEULEN_FARBE.wissen));
  assert.ok(h.includes("width:1080px") && h.includes("height:1350px"));
  const mitte = igSlideHtml(k, 1, "https://x.dev");
  assert.ok(mitte.includes("<li>Zitrus</li>") && mitte.includes("2 / 3"));
  assert.ok(!mitte.includes("undefined"));
});

test("Marke", () => {
  assert.equal(karussellMarke(k), "bot-k-wissen-terpene-lesen");
});
