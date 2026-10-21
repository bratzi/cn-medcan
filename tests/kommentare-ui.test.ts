import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const lies = (p: string) => readFileSync(p, "utf8");

test("Kommentarfeld: Grenze 1000, HWG-Hinweis, Fehler als Live-Region", () => {
  const f = lies("components/reaktionen/KommentarFeld.tsx");
  assert.match(f, /maxLength=\{MAX_KOMMENTAR\}/);
  assert.match(f, /role="alert"|aria-live="polite"/);
  assert.match(f, /hinweisHwg/);
});

test("Pinnwand nur bei öffentlichem Profil", () => {
  assert.match(lies("app/[lang]/profil/[kurzId]/page.tsx"), /profilOeffentlich[\s\S]{0,200}<Kommentare[\s\S]{0,80}ziel="PROFIL"/);
});

test("Bewertungen auf der Blütenseite tragen Kommentare (Buch trägt die Seiten, BewertungsBuch setzt sie ein)", () => {
  assert.match(lies("components/review/BewertungsBuch.tsx"), /<Kommentare[\s\S]{0,80}ziel="BEWERTUNG"/);
});

test("Texte de und en vorhanden", () => {
  for (const p of ["lib/i18n/de.ts", "lib/i18n/en.ts"]) assert.match(lies(p), /hinweisHwg/, p);
});

test("Kommentare: Client, lädt erst beim Aufklappen, Löschen und Melden mit 44px", () => {
  const k = lies("components/reaktionen/Kommentare.tsx");
  assert.match(k, /^"use client";/);
  assert.match(k, /onToggle/);
  assert.match(k, /min-h-11/);
  assert.match(k, /whitespace-pre-line break-words/);
  assert.match(k, /cursorKodieren/);
  assert.match(k, /<details/);
});

test("Zähler der Kommentare kommt mit den Likes aus derselben Abfrage", () => {
  assert.match(lies("app/[lang]/blueten/[slug]/sorten-inhalt.tsx"), /reaktionenFuer\("BEWERTUNG"/);
  assert.match(lies("components/review/BuchDoppelseite.tsx"), /#bewertung-|bewertung-\$\{eintrag\.id\}/);
});
