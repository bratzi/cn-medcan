import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { leereProfilWerte } from "@/lib/profil";
import { liebsteAromen } from "@/lib/profil-ansicht";

const leererGeschmack = () => leereProfilWerte().geschmack;

test("liebsteAromen: nur positive, stärkste zuerst", () => {
  const g = { ...leererGeschmack(), ZITRUS: 0.4, ERDIG: 1, DIESEL: -1 };
  assert.deepEqual(liebsteAromen(g), ["ERDIG", "ZITRUS"]);
  assert.deepEqual(liebsteAromen(leererGeschmack()), []);
});

test("Profil: Fallback des Profilkopfs kennt Rolle und Aktionen, Community füllt die Reihe ohne Schnitte", () => {
  const q = readFileSync("app/[lang]/profil/page.tsx", "utf8");
  assert.match(q, /<ProfilKopf \{\.\.\.kopf\} notizen=\{\[\]\} aromen=\{\[\]\} \/>/);
  assert.match(q, /aktionen: seitenAktionen\(s\)/);
  assert.match(q, /ohneCommunity: true/);
  const r = readFileSync("app/[lang]/profil/profil-reihen.tsx", "utf8");
  assert.match(r, /a\.schnitte \? SPALTEN\[6\] : SPALTEN\[12\]/);
});

test("Öffentliches Profil: neutrale Beschriftung der Zahlen", () => {
  const q = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.match(q, /zahlenLabel=\{s\.zahlenNeutral\}/);
});
