import { test } from "node:test";
import assert from "node:assert/strict";
import { hwgTreffer } from "@/lib/hwg-filter";
import { kommentarPruefen, meldegrundPruefen, MAX_KOMMENTAR } from "@/lib/kommentar-eingabe";

test("Filter fängt Wirkversprechen, auch groß und mit Umlauten", () => {
  for (const s of ["Hilft bei Migräne", "HILFT BEI Übelkeit", "heilt alles", "gut gegen Schmerzen", "my go-to for anxiety", "cures insomnia", "nimm das bei Depression", "hilft bei Migräne", "half gegen Schmerzen", "Linderung pur", "wirkt lindernd", "depressive Phasen"]) assert.ok(hwgTreffer(s), s);
});

test("Filter lässt Aroma und Teilwörter in Ruhe", () => {
  for (const s of ["sehr hilfreich beschrieben", "riecht nach Zitrus, Diesel im Abgang", "Schmerzensgeld ist kein Thema", "Therapiehund? nein, Katze", "Duft nach Linde und Honig", "kein Hilfsmittel, nur Genuss"]) assert.equal(hwgTreffer(s), null, s);
});

test("Kommentar: getrimmt, 1 bis 1000 Zeichen, HWG", () => {
  assert.deepEqual(kommentarPruefen("  schön fruchtig  "), { ok: true, text: "schön fruchtig" });
  assert.deepEqual(kommentarPruefen("   "), { ok: false, fehler: "leer" });
  assert.deepEqual(kommentarPruefen(7), { ok: false, fehler: "leer" });
  assert.deepEqual(kommentarPruefen("x".repeat(MAX_KOMMENTAR + 1)), { ok: false, fehler: "lang" });
  assert.deepEqual(kommentarPruefen("hilft bei Schlafstörung"), { ok: false, fehler: "hwg" });
});

test("Meldegrund höchstens 200 Zeichen, leer wird null", () => {
  assert.equal(meldegrundPruefen(""), null);
  assert.equal(meldegrundPruefen("a".repeat(300))?.length, 200);
});
