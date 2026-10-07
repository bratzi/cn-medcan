import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type { SortenAroma } from "@/lib/empfehlung";
import { profilAnzeige, profilNeuRechnen } from "@/lib/profil";
import { profilVerlauf, verlaufAusDaten, verlaufDaten, VERLAUF_HOECHSTENS, type VerlaufEingabe } from "@/lib/profil-verlauf";

// Sorten ohne Herstellerterpene: das Netz entsteht allein aus den Reglern.
const sorten: SortenAroma[] = [];
const tag = (n: number) => new Date(Date.UTC(2026, 8, n));
const b = (strainId: string, gesamtnote: number | null, geschmack: Record<string, number>, n: number): VerlaufEingabe => ({
  strainId,
  gesamtnote,
  terpene: {},
  geschmack,
  erstelltAm: tag(n),
});

test("profilVerlauf: ein Schritt je Bewertung, nach Datum, Zähler ab 1", () => {
  const reihe = [b("s2", 4.5, { erdig: 4 }, 3), b("s1", 5, { fruchtig: 5 }, 1)];
  const v = profilVerlauf(reihe, sorten);
  assert.deepEqual(v.map((s) => s.anzahl), [1, 2]);
  assert.equal(v[0].datum, tag(1).toISOString());
  assert.equal(v[0].geschmack.FRUCHTIG, 1);
  assert.equal(v[0].geschmack.ERDIG, 0);
  assert.ok(v[1].geschmack.ERDIG > 0);
});

test("profilVerlauf: letzter Schritt gleich dem Profilnetz", () => {
  const reihe = [b("s1", 5, { fruchtig: 5, suess: 2 }, 1), b("s2", 1.5, { erdig: 4 }, 2), b("s3", 4, { zitrus: 3 }, 3)];
  const letzter = profilVerlauf(reihe, sorten).at(-1)!;
  const netz = profilAnzeige(reihe, sorten).geschmack;
  for (const k of Object.keys(netz) as (keyof typeof netz)[]) assert.ok(Math.abs(letzter.geschmack[k] - netz[k]) <= 0.01, k);
});

test("profilVerlauf: Mittelfeld und fehlende Note lassen den Schritt gleich", () => {
  const v = profilVerlauf([b("s1", 5, { fruchtig: 5 }, 1), b("s2", 3, { erdig: 5 }, 2), b("s3", null, { erdig: 5 }, 3)], sorten);
  assert.deepEqual(v[1].geschmack, v[0].geschmack);
  assert.deepEqual(v[2].geschmack, v[0].geschmack);
});

test("profilVerlauf: höchstens 60 Schritte, die neuesten", () => {
  const reihe = Array.from({ length: 70 }, (_, i) => b(`s${i}`, 5, { fruchtig: 5 }, i + 1));
  const v = profilVerlauf(reihe, sorten);
  assert.equal(v.length, VERLAUF_HOECHSTENS);
  assert.equal(v[0].anzahl, 11);
  assert.equal(v.at(-1)!.anzahl, 70);
});

test("profilVerlauf: 1000 Bewertungen in unter 20 ms (CPU-Grenze 10 ms im Worker, hier großzügig)", () => {
  const reihe = Array.from({ length: 1000 }, (_, i) => b(`s${i}`, i % 2 ? 5 : 1, { fruchtig: i % 5, erdig: (i * 3) % 5 }, (i % 28) + 1));
  // Der kalte JIT-Lauf gehört nicht zur Messung (Review I1): einmal aufwärmen, dann das Minimum aus 5 Läufen.
  profilVerlauf(reihe, sorten);
  let schnellster = Infinity;
  for (let lauf = 0; lauf < 5; lauf++) {
    const start = performance.now();
    profilVerlauf(reihe, sorten);
    schnellster = Math.min(schnellster, performance.now() - start);
  }
  assert.ok(schnellster < 20, `schnellster Lauf ${schnellster.toFixed(1)} ms`);
});

test("profilVerlauf: linear, keine Schleife ruft profilAus oder profilAnzeige auf", () => {
  const q = readFileSync("lib/profil-verlauf.ts", "utf8");
  assert.doesNotMatch(q, /profilAus\(|profilAnzeige\(/);
  assert.match(q, /geschmacksBeitraege\(reihe, sorten\)/);
});

test("verlaufDaten/verlaufAusDaten: Hin und zurück, NULL und Kaputtes ergeben leere Liste", () => {
  const v = profilVerlauf([b("s1", 5, { fruchtig: 5 }, 1)], sorten);
  assert.deepEqual(verlaufAusDaten(verlaufDaten(v)), v);
  assert.deepEqual(verlaufAusDaten(null), []);
  assert.deepEqual(verlaufAusDaten("{kaputt"), []);
  assert.deepEqual(verlaufAusDaten('[{"anzahl":"x"}]'), []);
});

test("profilFortschreiben schreibt den Verlauf, ladeProfil liest ihn", () => {
  const q = readFileSync("lib/query/profil.ts", "utf8");
  assert.match(q, /verlauf: verlaufDaten\(profilVerlauf\(/);
  assert.match(q, /erstelltAm: true/);
  assert.match(q, /verlaufAusDaten\(/);
});

test("profilNeuRechnen: veraltet, fehlend oder leerer Verlauf trotz Bewertungen, sonst nie", () => {
  const jetzt = Date.UTC(2026, 9, 7, 12);
  const frisch = new Date(jetzt - 3600_000);
  const alt = new Date(jetzt - 25 * 3600_000);
  const stand = (berechnetAm: Date, anzahl: number, verlauf: number) => ({ berechnetAm, werte: { anzahl }, verlauf: { length: verlauf } });
  assert.equal(profilNeuRechnen(null, jetzt), true);
  assert.equal(profilNeuRechnen(stand(alt, 5, 5), jetzt), true);
  // Altprofil nach dem Deploy: Verlauf NULL, aber 30 Bewertungen.
  assert.equal(profilNeuRechnen(stand(frisch, 30, 0), jetzt), true);
  assert.equal(profilNeuRechnen(stand(frisch, 2, 0), jetzt), true);
  // Ein Bewertung ergibt keinen sinnvollen Verlauf, kein Neurechnen.
  assert.equal(profilNeuRechnen(stand(frisch, 1, 0), jetzt), false);
  assert.equal(profilNeuRechnen(stand(frisch, 0, 0), jetzt), false);
  // Gespeicherter, nicht leerer Verlauf unter 24 h: nie neu rechnen.
  assert.equal(profilNeuRechnen(stand(frisch, 30, 30), jetzt), false);
});

test("Mitglied mit 2 Mittelfeld-Bewertungen hat einen Verlauf mit 2 Schritten und rechnet nicht in einer Schleife", () => {
  const v = profilVerlauf([b("s1", 3, { erdig: 5 }, 1), b("s2", 3, { zitrus: 5 }, 2)], sorten);
  assert.equal(v.length, 2);
  const jetzt = Date.now();
  assert.equal(profilNeuRechnen({ berechnetAm: new Date(jetzt), werte: { anzahl: 2 }, verlauf: v }, jetzt), false);
});

test("aktuellesProfil rechnet über profilNeuRechnen", () => {
  const q = readFileSync("lib/query/profil.ts", "utf8");
  assert.match(q, /profilNeuRechnen\(gespeichert, Date\.now\(\)\)/);
});
