import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type { EigeneBewertung, SortenAroma } from "@/lib/empfehlung";
import { basisGeschmack, liveGeschmack, liveNetzBasis } from "@/lib/live-netz";
import { profilAnzeige } from "@/lib/profil";

const sorten: SortenAroma[] = [
  { strainId: "a", terpene: [{ name: "Limonen", geschmack: "ZITRUS", rang: 1 }] },
  { strainId: "b", terpene: [{ name: "Myrcen", geschmack: "ERDIG", rang: 1 }, { name: "Linalool", geschmack: "BLUMIG", rang: 2 }] },
];
const a: EigeneBewertung = { strainId: "a", gesamtnote: 4.5, terpene: { Limonen: 1 }, geschmack: { zitrus: 4 } };
const b: EigeneBewertung = { strainId: "b", gesamtnote: 4, terpene: { Myrcen: 1 }, geschmack: { erdig: 3, blumig: 2 } };

test("Live-Netz: dieselbe Rechnung wie das gespeicherte Profil (Nutzer 2026-10-09)", () => {
  const basis = liveNetzBasis([a, { ...b, gesamtnote: 1 }], sorten, "b");
  const { strainId: _id, ...eingabe } = b;
  void _id;
  assert.deepEqual(liveGeschmack(basis, eingabe), profilAnzeige([a, b], sorten).geschmack);
});

test("Live-Netz: ohne Gewicht (Mittelfeld) bleibt das Netz beim Stand ohne diese Bewertung", () => {
  const basis = liveNetzBasis([a], sorten, "b");
  assert.deepEqual(liveGeschmack(basis, { gesamtnote: 3, terpene: {}, geschmack: { erdig: 5 } }), basisGeschmack(basis));
  assert.deepEqual(basisGeschmack(basis), profilAnzeige([a], sorten).geschmack);
});

test("Bewertungsmaske: Fazit steht auch ohne Community-Werte, Live-Netz daneben", () => {
  const quelle = readFileSync("components/review/AromaErkundung.tsx", "utf8");
  assert.match(quelle, /eigenerSortenFazit !== null \|\| eigenerChargenFazit !== null \|\| netzLive !== null/);
  assert.match(quelle, /liveGeschmack\(liveNetz/);
  assert.match(quelle, /kontur=\{netzLive\.vorher\.mag\}/);
  const seite = readFileSync("app/[lang]/blueten/[slug]/page.tsx", "utf8");
  assert.match(seite, /ladeLiveNetzBasis\(mitglied\.mitgliedId, strain\.id\)\.catch/);
});
