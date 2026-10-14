import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (p: string) => readFileSync(p, "utf8");

test("LikeKnopf: Client-Insel, aria-pressed, optimistisch mit Rücksprung, 44px Trefferfläche", () => {
  const q = lies("components/reaktionen/LikeKnopf.tsx");
  assert.match(q, /^"use client";/);
  assert.match(q, /aria-pressed=/);
  assert.match(q, /useOptimistic|setAnzahl\(vorher\)/);
  assert.match(q, /min-h-11/);
  assert.match(q, /focus-visible:/);
});

test("LikeKnopf steht an Bewertung, Blüte und öffentlichem Profil", () => {
  for (const p of ["components/review/BuchDoppelseite.tsx", "app/[lang]/profil/[kurzId]/page.tsx", "app/[lang]/blueten/[slug]/page.tsx"]) {
    assert.match(lies(p), /<LikeKnopf/, p);
  }
});

test("Zahlen kommen aus dem Zähler, eine Abfrage je Seite; Anker bewertung-<id>", () => {
  assert.match(lies("app/[lang]/blueten/[slug]/page.tsx"), /likeZahlenFuer\("BEWERTUNG"/);
  assert.match(lies("app/[lang]/reviews/seite.tsx"), /likeZahlenFuer\("BEWERTUNG"/);
  assert.match(lies("components/review/BewertungsBuch.tsx"), /likes\?\.get\(review\.id\)/);
  assert.match(lies("components/review/BuchDoppelseite.tsx"), /id=\{`bewertung-\$\{eintrag\.id\}`\}/);
  assert.match(lies("lib/buch.ts"), /bewertung-/);
});

test("/profil: Reihe Gemocht und gefolgt mit Id gemocht, Kopfzahlen aus dem Zähler", () => {
  const reihen = lies("app/[lang]/profil/profil-reihen.tsx");
  assert.match(reihen, /export async function ReiheGemocht/);
  assert.equal((reihen.match(/id="gemocht"/g) ?? []).length, 1);
  assert.match(lies("app/[lang]/profil/page.tsx"), /<ReiheGemocht/);
  assert.match(lies("app/[lang]/profil/laden.ts"), /reaktionsZahlenLaden = cache/);
  const abfrage = lies("lib/query/reaktionen.ts");
  assert.match(abfrage, /zaehler\.aggregate/);
  assert.doesNotMatch(abfrage, /like\.count/);
});

test("Eigene Likes: ein Sammler je Seite, kein Abruf im Herz selbst", () => {
  const knopf = lies("components/reaktionen/LikeKnopf.tsx");
  assert.doesNotMatch(knopf, /ladeEigeneLikes/);
  assert.match(knopf, /useEigeneLikes/);
  const sammler = lies("components/reaktionen/EigeneLikes.tsx");
  assert.match(sammler, /^"use client";/);
  assert.equal((sammler.match(/ladeEigeneLikes\(/g) ?? []).length, 1);
  assert.match(sammler, /HAEPPCHEN = 90/);
  for (const p of ["app/[lang]/blueten/[slug]/page.tsx", "app/[lang]/reviews/seite.tsx", "app/[lang]/profil/[kurzId]/page.tsx", "components/story/NeuesterEintrag.tsx"]) {
    assert.match(lies(p), /<EigeneLikes>/, p);
  }
});

test("Zähler lesen in Häppchen statt bei 90 abzuschneiden; selbst und weg melden sich", () => {
  const q = lies("lib/query/reaktionen.ts");
  assert.match(q, /inHaeppchen\(ids\)/);
  assert.doesNotMatch(q, /ids\.slice\(0, MAX_IDS\)[\s\S]{0,40}karte\.set/);
  const knopf = lies("components/reaktionen/LikeKnopf.tsx");
  assert.match(knopf, /text\.selbst/);
  assert.match(knopf, /text\.weg/);
  assert.doesNotMatch(lies("components/review/SortenKopf.tsx"), /LikeKnopf|like\?/);
});
