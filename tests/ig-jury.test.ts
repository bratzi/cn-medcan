import { test } from "node:test";
import assert from "node:assert/strict";
import { collabHinweis, IG_PROFIL_ADRESSE, igMeldungPruefen, igUeberschreibbar, juryKarussell, juryZitat } from "@/lib/ig-jury";
import { karussellPruefen } from "@/lib/ig-karussell";
import { igCaptionPruefen } from "@/lib/ig-caption";

const b = { slug: "gelato", titel: "Gelato im Glas", anriss: "Süß und cremig.", zitat: "Erst Beere, dann Teig.", autor: { name: "Wal", instagram: "wal.terpz" }, bilder: ["https://x/api/bild/1"], review: { gesamtnote: 4, aromen: ["SUESS", "FRUCHTIG"] } };

test("juryKarussell besteht alle Prüfungen und nennt den Autor", () => {
  const { karussell, caption } = juryKarussell(b);
  assert.deepEqual(karussellPruefen(karussell), []);
  assert.deepEqual(igCaptionPruefen(caption), []);
  assert.match(caption, /@wal\.terpz/);
  assert.ok(karussell.slides.some((s) => s.grafik?.art === "blaetter"));
});

test("Collab-Hinweis: Handle bereinigt, sonst kein Handle hinterlegt", () => {
  assert.equal(collabHinweis({ name: "Wal", instagram: "@wal.terpz" }), "Collaborator von Hand hinzufügen: @wal.terpz");
  assert.equal(collabHinweis({ name: "Wal", instagram: null }), "Wal: kein Handle hinterlegt");
  assert.equal(collabHinweis({ name: "Wal", instagram: "kein handle!" }), "Wal: kein Handle hinterlegt");
});

test("ohne Bewertung und Handle: Buch-Icon statt Blätter, keine Aroma-Slide, keine Von-Zeile", () => {
  const { karussell, caption } = juryKarussell({ ...b, autor: { name: "Wal", instagram: null }, review: null });
  assert.deepEqual(karussellPruefen(karussell), []);
  assert.deepEqual(igCaptionPruefen(caption), []);
  assert.ok(!karussell.slides.some((s) => s.grafik?.art === "blaetter"));
  assert.ok(!karussell.slides.some((s) => s.typ === "inhalt" && s.titel === "Aroma"));
  assert.ok(!/Von @/.test(caption));
});

test("Aroma-Slide: höchstens fünf Icons, Punkte sind die Labels", () => {
  const { karussell } = juryKarussell({ ...b, review: { gesamtnote: 3, aromen: ["SUESS", "ZITRUS", "ERDIG", "DIESEL", "MINZIG", "HOLZIG"] } });
  const aroma = karussell.slides.find((s) => s.typ === "inhalt" && s.titel === "Aroma");
  assert.ok(aroma && aroma.typ === "inhalt");
  assert.deepEqual(aroma.punkte, ["Süß", "Zitrus", "Erdig", "Diesel", "Minzig"]);
  assert.equal(aroma.grafik?.art === "icons" && aroma.grafik.namen.length, 5);
});

test("langer Titel: Cover höchstens 60, Hook höchstens 125, Handle mit @ wird bereinigt", () => {
  const { karussell, caption } = juryKarussell({ ...b, titel: "T".repeat(120), autor: { name: "Wal", instagram: "@wal.terpz" } });
  assert.ok(karussell.slides[0].titel.length <= 60);
  assert.ok(caption.split("\n")[0].length <= 125);
  assert.match(caption, /Von @wal\.terpz\n/);
  assert.ok(!caption.includes("@@"));
});

test("juryZitat: erster Absatz ohne Markdown, höchstens 180 Zeichen", () => {
  assert.equal(juryZitat("## Titel\n\nErst **Beere**, dann *Teig*.\n\nZweiter Absatz."), "Erst Beere, dann Teig.");
  const z = juryZitat("wort ".repeat(100));
  assert.ok(z.length <= 180 && z.endsWith("…"));
  assert.equal(juryZitat(""), "");
});

test("Meldung: Status und Adresse werden geprüft", () => {
  assert.deepEqual(igMeldungPruefen({ slug: "a", igStatus: "FEHLER" }), []);
  assert.deepEqual(igMeldungPruefen({ slug: "a", igStatus: "GEPLANT" }), []);
  assert.deepEqual(igMeldungPruefen({ slug: "a", igStatus: "VEROEFFENTLICHT", igUrl: "https://www.instagram.com/p/abc/" }), []);
  assert.ok(igMeldungPruefen({ slug: "a", igStatus: "VEROEFFENTLICHT" }).length > 0);
  assert.ok(igMeldungPruefen({ slug: "a", igStatus: "VEROEFFENTLICHT", igUrl: "https://evil.example/p/abc" }).length > 0);
  assert.ok(igMeldungPruefen({ slug: "a", igStatus: "KEIN" }).length > 0);
  assert.ok(igMeldungPruefen({ slug: "", igStatus: "FEHLER" }).length > 0);
  assert.ok(igMeldungPruefen("x").length > 0);
});

test("veröffentlicht bleibt geschützt, alles andere ist überschreibbar" , () => {
  assert.equal(igUeberschreibbar("VEROEFFENTLICHT"), false);
  for (const s of ["KEIN", "FEHLER", "ENTWURF", "GEPLANT"]) assert.equal(igUeberschreibbar(s), true);
});

test("Fallback-Adresse nach Veröffentlichung besteht die Meldungsprüfung", () => {
  assert.deepEqual(igMeldungPruefen({ slug: "a", igStatus: "VEROEFFENTLICHT", igUrl: IG_PROFIL_ADRESSE }), []);
});
