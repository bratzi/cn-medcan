import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type { GeschmacksKategorie } from "@/db/enums";
import type { SortenAroma } from "@/lib/empfehlung";
import {
  auswertungen,
  leereProfilWerte,
  noteOderErsatz,
  profilAnzeige,
  profilAusDaten,
  profilDaten,
  profilVeraltet,
  PROFIL_GUELTIG_MS,
} from "@/lib/profil";
import type { AuswertungsZeile } from "@/lib/profil-typen";

const sorte = (strainId: string, terpene: [string, GeschmacksKategorie][]): SortenAroma => ({
  strainId,
  terpene: terpene.map(([name, geschmack], i) => ({ name, geschmack, rang: i + 1 })),
});
const ZITRUS = sorte("zitrus", [["Limonen", "ZITRUS"], ["Myrcen", "ERDIG"]]);
const HOLZ = sorte("holz", [["Humulen", "HOLZIG"], ["beta-Caryophyllen", "WUERZIG"]]);

test("noteOderErsatz: Gesamtnote, sonst Mittel der fünf Noten", () => {
  const noten = { aussehen: 4, geruch: 4, geschmack: 5, wirkung: 3, konsistenz: 4 };
  assert.equal(noteOderErsatz({ gesamtnote: 2.5, ...noten }), 2.5);
  assert.equal(noteOderErsatz({ gesamtnote: null, ...noten }), 4);
});

test("profilAnzeige: mag ich positiv, mag ich nicht negativ, stärkste Achse 1", () => {
  const w = profilAnzeige(
    [
      { strainId: "zitrus", gesamtnote: 5, terpene: {}, geschmack: {} },
      { strainId: "holz", gesamtnote: 1, terpene: {}, geschmack: {} },
    ],
    [ZITRUS, HOLZ],
  );
  assert.ok(w.geschmack.ZITRUS > 0);
  assert.ok(w.geschmack.HOLZIG < 0);
  const betraege = Object.values(w.geschmack).map(Math.abs);
  assert.equal(Math.max(...betraege), 1);
  assert.ok(betraege.every((x) => x <= 1));
  assert.equal(w.anzahl, 2);
  assert.equal(w.gewichtet, 2);
  assert.equal(w.terpenNetz.limonen, 1);
  assert.ok(w.terpenNetz.humulen < 0);
});

test("profilAnzeige: Terpen-Netz hat genau die zehn festen Achsen, fremde Terpene fallen weg", () => {
  const viel = sorte("viel", ["Myrcen", "Guajol"].map((n): [string, GeschmacksKategorie] => [n, "SUESS"]));
  const wenig = sorte("wenig", ["Nerolidol"].map((n): [string, GeschmacksKategorie] => [n, "ERDIG"]));
  const w = profilAnzeige(
    [
      { strainId: "viel", gesamtnote: 5, terpene: {}, geschmack: {} },
      { strainId: "wenig", gesamtnote: 0.5, terpene: {}, geschmack: {} },
    ],
    [viel, wenig],
  );
  assert.equal(Object.keys(w.terpenNetz).length, 10);
  assert.ok(w.terpenNetz.myrcen > 0);
  assert.ok(w.terpenNetz.nerolidol < 0);
  assert.equal("guajol" in w.terpenNetz, false);
});

test("profilAnzeige: nur Mittelfeld ergibt Nullen, aber den Zähler", () => {
  const w = profilAnzeige([{ strainId: "zitrus", gesamtnote: 3, terpene: {}, geschmack: {} }], [ZITRUS]);
  assert.ok(Object.values(w.geschmack).every((x) => x === 0));
  assert.ok(Object.values(w.terpenNetz).every((x) => x === 0));
  assert.equal(w.anzahl, 1);
  assert.equal(w.gewichtet, 0);
});

test("profilDaten und profilAusDaten: Hin und zurück, kaputter Text wird leer", () => {
  const w = profilAnzeige([{ strainId: "zitrus", gesamtnote: 4.5, terpene: {}, geschmack: {} }], [ZITRUS]);
  assert.deepEqual(profilAusDaten(profilDaten(w)), w);
  const kaputt = profilAusDaten({ geschmack: "{kaputt", terpene: "nein", anzahl: 4, gewichtet: 2 });
  assert.deepEqual(kaputt, { ...leereProfilWerte(), anzahl: 4, gewichtet: 2 });
  const fremd = profilAusDaten({ geschmack: '{"ZITRUS":0.5,"UNBEKANNT":1,"ERDIG":"x"}', terpene: '[{"name":"Myrcen","wert":0.4},{"name":3}]', anzahl: 1, gewichtet: 1 });
  assert.equal(fremd.geschmack.ZITRUS, 0.5);
  assert.equal(fremd.geschmack.ERDIG, 0);
  // Alte Listenform: das Netz entsteht aus der Liste, neu normiert.
  assert.equal(fremd.terpenNetz.myrcen, 1);
});

test("profilVeraltet: fehlt oder älter als 24 h", () => {
  const jetzt = Date.parse("2026-10-07T12:00:00Z");
  assert.equal(profilVeraltet(null, jetzt), true);
  assert.equal(profilVeraltet(new Date(jetzt - PROFIL_GUELTIG_MS + 1000), jetzt), false);
  assert.equal(profilVeraltet(new Date(jetzt - PROFIL_GUELTIG_MS - 1000), jetzt), true);
});

const zeile = (slug: string, gesamtnote: number | null, extra: Partial<AuswertungsZeile> = {}): AuswertungsZeile => ({
  slug,
  handelsname: slug.toUpperCase(),
  erstelltAm: new Date("2026-10-01T00:00:00Z"),
  gesamtnote,
  aussehen: 4,
  geruch: 4,
  geschmack: 4,
  wirkung: 4,
  konsistenz: 4,
  community: null,
  ...extra,
});

test("auswertungen: Top drei, Flop aus dem Rest, schlechteste zuerst", () => {
  const a = auswertungen([zeile("a", 5), zeile("b", 1), zeile("c", 4), zeile("d", 2), zeile("e", 3), zeile("f", 4.5)]);
  assert.deepEqual(a.top.map((x) => x.slug), ["a", "f", "c"]);
  assert.deepEqual(a.flop.map((x) => x.slug), ["b", "d", "e"]);
  assert.equal(a.top[0].note, 5);
});

test("auswertungen: bei drei oder weniger kein Flop; leer ohne Schnitte", () => {
  assert.deepEqual(auswertungen([zeile("a", 5), zeile("b", 1)]).flop, []);
  const leer = auswertungen([]);
  assert.equal(leer.schnitte, null);
  assert.deepEqual(leer.top, []);
  assert.equal(leer.community.differenz, null);
});

test("auswertungen: fremdes Mittel, strenger negativ, ab zwei vergleichbaren", () => {
  const a = auswertungen([
    zeile("a", 3, { community: { mittel: 4.5, anzahl: 2 } }), // −1,5
    zeile("b", 4, { community: { mittel: 4, anzahl: 1 } }), // 0
    // keine fremde Note: kein Vergleich
    zeile("c", 5, { community: { mittel: null, anzahl: 0 } }),
    zeile("d", 5),
  ]);
  assert.equal(a.community.vergleichbar, 2);
  // (−1,5 + 0) / 2 = −0,75; Math.round(−7,5) ergibt −7 → −0,7.
  assert.equal(a.community.differenz, -0.7);
  assert.deepEqual(a.community.abweichungen[0], { slug: "a", handelsname: "A", eigene: 3, community: 4.5 });
  assert.equal(a.community.abweichungen.length, 2);
  assert.equal(auswertungen([zeile("b", 4, { community: { mittel: 4, anzahl: 1 } })]).community.differenz, null);
});

test("auswertungen: gerundet wird erst das Ergebnis, nicht je Sorte", () => {
  // Ungerundet: (0,04 + 0,04 + 0,14) / 3 ≈ 0,07 → 0,1 milder.
  // Je Sorte auf 4,0 / 4,0 / 3,9 zwischengerundet wären es 0,03 → „wie die Community“.
  const a = auswertungen([
    zeile("a", 4, { community: { mittel: 3.96, anzahl: 3 } }),
    zeile("b", 4, { community: { mittel: 3.96, anzahl: 3 } }),
    zeile("c", 4, { community: { mittel: 3.86, anzahl: 3 } }),
  ]);
  assert.equal(a.community.differenz, 0.1);
});

test("auswertungen: Schnitte je Kategorie mit Ersatznote, auf 0,1 gerundet", () => {
  const a = auswertungen([zeile("a", null, { wirkung: 5 }), zeile("b", 3, { aussehen: 3 })]);
  assert.deepEqual(a.schnitte, { aussehen: 3.5, geruch: 4, geschmack: 4, wirkung: 4.5, konsistenz: 4, gesamt: 3.6 });
});

test("Bewertung speichern schreibt das Profil fort und erneuert /profil", () => {
  const quelle = readFileSync("app/[lang]/blueten/[slug]/aktionen.ts", "utf8");
  assert.match(quelle, /await profilFortschreiben\(mitglied\.mitgliedId\)/);
  assert.doesNotMatch(quelle, /empfehlungenFortschreiben/);
  assert.match(quelle, /revalidiereSprachen\("\/profil"\)/);
});

test("FREMDE_NOTEN_SQL: ohne eigene, ohne Notenlose und Unfreigegebene, Seed zählt als fremd", async () => {
  const { default: Database } = await import("better-sqlite3");
  const { FREMDE_NOTEN_SQL } = await import("@/lib/profil");
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE reviews (strain_id TEXT, autor_id TEXT, gesamtnote REAL, freigegeben INTEGER)`);
  const neu = db.prepare(`INSERT INTO reviews VALUES (?, ?, ?, ?)`);
  neu.run("s1", "ich", 2, 1);
  neu.run("s1", "du", 4, 1);
  neu.run("s1", "er", null, 1);
  neu.run("s1", null, 5, 1);
  neu.run("s1", "sie", 1, 0);
  neu.run("s2", "ich", 3, 1);
  neu.run("s3", "du", 3, 1);
  const zeilen = db.prepare(FREMDE_NOTEN_SQL).all("ich", JSON.stringify(["s1", "s2"])) as { sid: string; m: number; n: number }[];
  assert.deepEqual(zeilen, [{ sid: "s1", m: 4.5, n: 2 }]);
});

test("oeffentlicheWerte: liest das Netz aus freigegebenen Bewertungen, kaputt oder fehlend ergibt null", async () => {
  const { oeffentlicheDaten, oeffentlicheWerte, leereProfilWerte } = await import("@/lib/profil");
  const w = leereProfilWerte();
  w.geschmack.FRUCHTIG = 0.8;
  w.terpenNetz.limonen = 1;
  w.anzahl = 2;
  w.gewichtet = 1;
  assert.deepEqual(oeffentlicheWerte(oeffentlicheDaten(w)), w);
  assert.equal(oeffentlicheWerte(null), null);
  assert.equal(oeffentlicheWerte("{kaputt"), null);
  assert.equal(oeffentlicheWerte("[]"), null);
});
