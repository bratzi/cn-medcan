import { test } from "node:test";
import assert from "node:assert/strict";
import { igCaption, igCaptionPruefen } from "@/lib/ig-caption";
import type { IgReview } from "@/lib/ig-feed";

const r: IgReview = { id: "r1", url: "https://x.dev/blueten/s", karte: "https://x.dev/api/ig-karte/r1", bluete: "Apples & Bananas", vertreiber: "MGF", charge: "C1", gesamtnote: 4.5, aromen: ["ZITRUS", "SUESS"], notiz: "Zitrus vorne", bilder: [], datum: "2026-10-01T00:00:00.000Z" };

test("Caption enthält Kerndaten, Link-Hinweis und Hashtags aus den Aromen", () => {
  const c = igCaption(r);
  assert.ok(c.startsWith("Apples & Bananas von MGF"));
  assert.ok(c.includes("4,5 von 5 Blättern"));
  assert.ok(c.includes("Zitrus, Süß"));
  assert.ok(c.includes("Charge C1"));
  assert.ok(c.includes("„Zitrus vorne“"));
  assert.ok(c.includes("Vorabzugang zum Portal: schreib uns per DM"));
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

test("Caption-Prüfung: gültig ergibt leere Liste", () => {
  const c = "Limonen riecht nach frischer Zitronenschale.\n\nWelches Terpen kommt als Nächstes?\n\n#bookofterpz #terpene #limonen";
  assert.deepEqual(igCaptionPruefen(c), []);
});

test("Caption-Prüfung: Wirkung, auch gebeugt, und Hashtag-Zahl", () => {
  assert.ok(igCaptionPruefen("Myrcen wirkt entspannend. #a #b #c").length > 0);
  assert.ok(igCaptionPruefen("Eine beruhigende Sorte. #a #b #c").length > 0);
  assert.ok(igCaptionPruefen("Hilft gegen Stress. #a #b #c").length > 0);
  assert.ok(igCaptionPruefen("Duftet nach Kiefer. #a #b").length > 0);
  assert.ok(igCaptionPruefen("Duftet nach Kiefer. #a #b #c #d #e #f").length > 0);
  assert.ok(igCaptionPruefen(`${"x".repeat(2201)} #a #b #c`).length > 0);
});

test("Bewertungs-Caption hat höchstens 5 Hashtags", () => {
  assert.ok((igCaption(r).match(/#/g) ?? []).length <= 5);
});

test("Handwerk: Hook in der ersten Zeile höchstens 125 Zeichen", () => {
  const f = igCaptionPruefen(`${"Duft ".repeat(30)}\n\nSchreib uns per DM\n\n#a #b #c`);
  assert.ok(f.some((x) => x.includes("125")));
});

test("Handwerk: Köder und KI-Floskeln werden abgelehnt", () => {
  for (const s of ["Doppeltipp, wenn du zustimmst!", "Markiere 3 Freunde.", "Was denkt ihr?", "Das Ergebnis? Ein Blatt mehr.", "Ein echter Gamechanger."]) {
    assert.ok(igCaptionPruefen(`Kiefer und Zitrus.\n\n${s}\n\n#a #b #c`).some((x) => x.includes("Floskel")), s);
  }
});

test("Handwerk: höchstens zwei Gedankenstriche", () => {
  const f = igCaptionPruefen("Kiefer – Zitrus – Erde – Holz.\n\n#a #b #c");
  assert.ok(f.some((x) => x.includes("Gedankenstrich")));
});
