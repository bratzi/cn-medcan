import "./server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("istRedaktionell folgt dem Jury-Flag", () => {
  const treffer = execSync('git grep -n "istRedaktionell:" -- app lib', { encoding: "utf8" });
  assert.match(treffer, /jury/);
  assert.doesNotMatch(treffer, /rolle === "ADMIN"/);
});

test("Startseite verweist auf den Jury-Beitrag", () => {
  assert.match(readFileSync("components/story/NeuesterEintrag.tsx", "utf8"), /\/jury\//);
});

test("Abzeichen und Wording: Jury statt Betreiber, wo die Herkunft einer Bewertung erklärt wird", () => {
  assert.equal(de.buch.betreiber, "Jury");
  assert.equal(en.buch.betreiber, "Jury");
  assert.match(de.rangliste.betreiber, /Jury/);
  assert.equal(de.buch.juryBeitrag, "Jury-Beitrag lesen");
  assert.equal(de.profilOeffentlich.juryAbzeichen, "Terpz-Jury");
});

test("Sortenseite und Profil binden die Jury ein", () => {
  assert.match(readFileSync("app/[lang]/blueten/[slug]/page.tsx", "utf8"), /ladeJuryBeitraegeZuBewertungen/);
  assert.match(readFileSync("components/review/BuchDoppelseite.tsx", "utf8"), /\/jury\/\$\{eintrag\.juryBeitrag\}/);
  const profil = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.match(profil, /ladeJuryProfil/);
  assert.match(profil, /\/jury\/\$\{b\.slug\}/);
});
