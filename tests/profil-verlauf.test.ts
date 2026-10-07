import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type { SortenAroma } from "@/lib/empfehlung";
import { profilAnzeige } from "@/lib/profil";
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
  const start = performance.now();
  profilVerlauf(reihe, sorten);
  assert.ok(performance.now() - start < 20);
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
