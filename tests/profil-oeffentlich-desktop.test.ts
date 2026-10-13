import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Öffentliches Profil: Seitenleiste und nur öffentliche Reiter", () => {
  const q = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  for (const teil of ["<ProfilRahmen", "<ProfilSeitenleiste", "<ProfilReiter"]) assert.ok(q.includes(teil), teil);
  assert.match(q, /\["uebersicht", "bewertungen"\]/);
  assert.doesNotMatch(q, /Schnitte|CommunityVergleich|Lieblingshersteller|Lieblingsvertreiber/);
  assert.match(q, /aktionen=\{\[\]\}/);
});

test("Öffentliches Profil ohne Bewertungen zeigt den Leersatz (Review Focus)", () => {
  const q = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.match(q, /texte\.netzLeer/);
});
