import { test } from "node:test";
import assert from "node:assert/strict";
import { igSlideHtml, karussellMarke, karussellPruefen, SAEULEN_FARBE, type IgKarussell } from "@/lib/ig-karussell";

const k: IgKarussell = {
  saeule: "wissen",
  schluessel: "terpene-lesen",
  slides: [
    { typ: "cover", kicker: "Wissen", titel: "Terpene & <Aroma>", grafik: { art: "icons", namen: ["myrcen"] } },
    { typ: "inhalt", titel: "Was sind Terpene?", text: "Duftstoffe der Pflanze.", punkte: ["Zitrus", "Kiefer"], grafik: { art: "icons", namen: ["ZITRUS", "KRAEUTRIG"] } },
    { typ: "cta", titel: "Mehr im Buch", text: "Alle Bewertungen zum Blättern.", grafik: { art: "blaetter", note: 4 } },
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
  assert.ok(mitte.includes("<figcaption>Zitrus</figcaption>") && mitte.includes("2 / 3"));
  assert.ok(!mitte.includes("undefined"));
});

test("karussellPruefen: kein Link in der Bio", () => {
  const slides = [...k.slides.slice(0, -1), { typ: "cta" as const, titel: "Mehr im Buch", text: "Alle Noten. LINK IN BIO." }];
  const fehler = karussellPruefen({ ...k, slides });
  assert.ok(fehler.some((f) => f.includes("keinen Link in der Bio")), fehler.join("; "));
});

test("Marke", () => {
  assert.equal(karussellMarke(k), "bot-k-wissen-terpene-lesen");
});

test("Handwerk: Kicker höchstens 30 Zeichen, höchstens ein Gedankenstrich je Slide", () => {
  const langerKicker = { ...k, slides: [{ typ: "cover" as const, kicker: "x".repeat(31), titel: "T" }, ...k.slides.slice(1)] };
  assert.ok(karussellPruefen(langerKicker).some((f) => f.includes("Kicker")));
  const striche = { ...k, slides: [k.slides[0], { typ: "inhalt" as const, titel: "Kiefer – Zitrus – Erde" }, ...k.slides.slice(2)] };
  assert.ok(karussellPruefen(striche).some((f) => f.includes("Gedankenstrich")));
});

test("Grafik: Pflicht je Slide, nur bekannte Icons, Blätter 0 bis 5", () => {
  const ohne = { ...k, slides: [k.slides[0], { typ: "inhalt" as const, titel: "Ohne Bild" }, k.slides[2]] };
  assert.ok(karussellPruefen(ohne).some((f) => f.includes("Grafik fehlt")));
  const fremd = { ...k, slides: [k.slides[0], { typ: "inhalt" as const, titel: "X", grafik: { art: "icons" as const, namen: ["einhorn"] } }, k.slides[2]] };
  assert.ok(karussellPruefen(fremd).some((f) => f.includes("Icon unbekannt")));
  const zuviel = { ...k, slides: [k.slides[0], { typ: "inhalt" as const, titel: "X", grafik: { art: "blaetter" as const, note: 6 } }, k.slides[2]] };
  assert.ok(karussellPruefen(zuviel).some((f) => f.includes("Blätter")));
  assert.match(igSlideHtml(k, 2, "https://x"), /Vorabzugang per DM/);
});
