import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Öffentliches Profil: Profilkopf ohne Aktionen, Netz und Bewertungen untereinander, keine Reiter", () => {
  const q = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.match(q, /<ProfilKopf/);
  assert.match(q, /aktionen=\{\[\]\}/);
  assert.doesNotMatch(q, /ProfilReiter|ProfilRahmen|ProfilSeitenleiste|ansicht=|ansichtAus|Schnitte|CommunityVergleich|Lieblingsvertreiber/);
  assert.ok(q.indexOf('id="netz"') < q.indexOf('id="bewertungen"'));
});
test("Öffentliches Profil ohne Bewertungen zeigt den Leersatz (Review Focus)", () => {
  const q = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.match(q, /texte\.netzLeer/);
});
