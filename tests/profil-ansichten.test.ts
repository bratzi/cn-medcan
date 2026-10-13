import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { monatsReihe } from "@/lib/profil-dashboard";

const q = () => readFileSync("app/[lang]/profil/page.tsx", "utf8");

test("Profilseite: Rahmen, Seitenleiste, Reiter, kein Kapitelkopf mehr", () => {
  const s = q();
  for (const teil of ["<ProfilRahmen", "<ProfilSeitenleiste", "<ProfilReiter", "ansichtAus("]) assert.ok(s.includes(teil), teil);
  assert.doesNotMatch(s, /<Kapitelkopf|<KapitelRaster|KopfBild/);
});

test("Profilseite: je Ansicht nur deren Reihen", () => {
  const s = q();
  assert.match(s, /ansicht === "uebersicht"/);
  assert.match(s, /ansicht === "aromen"/);
  assert.match(s, /ansicht === "bewertungen"/);
  assert.match(s, /ansicht === "vertreiber"/);
});

test("Spur kompakt: beginnt beim Monat der ersten Bewertung", () => {
  const heute = new Date("2026-10-13T00:00:00Z");
  const reihe = monatsReihe([new Date("2026-09-02T00:00:00Z"), new Date("2026-10-01T00:00:00Z")], heute, "de", { abErster: true });
  assert.equal(reihe.length, 2);
  assert.deepEqual(reihe.map((m) => m.anzahl), [1, 1]);
});

test("Spur kompakt ohne Bewertung: leere Reihe, kein Fehler (Review Focus)", () => {
  assert.deepEqual(monatsReihe([], new Date("2026-10-13T00:00:00Z"), "de", { abErster: true }), []);
});

test("Spur kompakt: laenger als zwoelf Monate her, hoechstens zwoelf", () => {
  const reihe = monatsReihe([new Date("2024-01-05T00:00:00Z")], new Date("2026-10-13T00:00:00Z"), "de", { abErster: true });
  assert.equal(reihe.length, 12);
  assert.equal(reihe.at(-1)?.laufend, true);
});
