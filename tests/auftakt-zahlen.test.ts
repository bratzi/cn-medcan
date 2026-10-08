import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { auftaktEintraege, zuAuftaktZahlen, hatAuftaktZahlen } from "@/lib/query/auftakt-zahlen";

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");

test("Zeile aus D1 wird zu Zahlen, egal ob number, bigint oder string", () => {
  assert.deepEqual(zuAuftaktZahlen([{ sorten: 412, bewertungen: 37n, stimmen: "1284" }]), {
    sorten: 412,
    bewertungen: 37,
    stimmen: 1284,
  });
});

test("fehlende oder kaputte Werte werden 0", () => {
  const null3 = { sorten: 0, bewertungen: 0, stimmen: 0 };
  assert.deepEqual(zuAuftaktZahlen([]), null3);
  assert.deepEqual(zuAuftaktZahlen(undefined), null3);
  assert.deepEqual(zuAuftaktZahlen(null), null3);
  assert.deepEqual(zuAuftaktZahlen([{ sorten: "viele", bewertungen: -1, stimmen: null }]), null3);
});

test("leere Datenbank: keine Leiste, eine Zahl über 0: Leiste", () => {
  assert.equal(hatAuftaktZahlen({ sorten: 0, bewertungen: 0, stimmen: 0 }), false);
  assert.equal(hatAuftaktZahlen({ sorten: 0, bewertungen: 0, stimmen: 1 }), true);
});

test("Abfrage: eine queryRaw mit drei Unterabfragen, keine Transaktion", () => {
  const quelle = lies("lib/query/start-zahlen.ts");
  assert.match(quelle, /import "server-only"/);
  assert.match(quelle, /\$queryRaw/);
  assert.doesNotMatch(quelle, /\$transaction|\.count\(/);
  assert.match(quelle, /FROM strains WHERE aktiv = 1/);
  assert.match(quelle, /FROM reviews WHERE freigegeben = 1/);
  assert.match(quelle, /FROM stimmen\)/);
});

test("Einträge deutsch: Tausenderpunkt, Mehrzahl, feste Reihenfolge", () => {
  assert.deepEqual(auftaktEintraege({ sorten: 412, bewertungen: 37, stimmen: 1284 }, de.start.auftakt.zahlen, "de"), [
    { schluessel: "sorten", zahl: 412, text: "412", wort: "Sorten im Katalog" },
    { schluessel: "bewertungen", zahl: 37, text: "37", wort: "Bewertungen im Buch" },
    { schluessel: "stimmen", zahl: 1284, text: "1.284", wort: "Stimmen abgegeben" },
  ]);
});

test("Einträge englisch: Tausenderkomma, Einzahl bei 1", () => {
  const eintraege = auftaktEintraege({ sorten: 1, bewertungen: 1, stimmen: 1284 }, en.start.auftakt.zahlen, "en");
  assert.deepEqual(eintraege.map((e) => e.wort), ["strain in the catalogue", "review in the book", "votes cast"]);
  assert.equal(eintraege[2].text, "1,284");
});

test("Einzahl deutsch bei 1", () => {
  const eintraege = auftaktEintraege({ sorten: 1, bewertungen: 1, stimmen: 1 }, de.start.auftakt.zahlen, "de");
  assert.deepEqual(eintraege.map((e) => e.wort), ["Sorte im Katalog", "Bewertung im Buch", "Stimme abgegeben"]);
});

test("Komponente: Fehlerfang, Endwert im HTML, eigenes Zählermerkmal", () => {
  const quelle = lies("components/story/AuftaktZahlen.tsx");
  assert.match(quelle, /unstable_rethrow\(fehler\);\s*console\.error/);
  assert.match(quelle, /hatAuftaktZahlen/);
  assert.match(quelle, /data-story="zahlen"/);
  assert.match(quelle, /data-story-einstieg=""/);
  assert.match(quelle, /data-auftakt-zaehler=""/);
  assert.match(quelle, /data-ziel=\{eintrag\.zahl\}/);
  assert.match(quelle, /\{eintrag\.text\}/);
  assert.doesNotMatch(quelle, /data-zaehler/);
});

test("Auftakt: Zahlen im Suspense mit Skelett, Knopf ohne Einstieg", () => {
  const quelle = lies("components/story/Auftakt.tsx");
  assert.match(quelle, /<Suspense fallback=\{<AuftaktZahlenSkelett/);
  assert.match(quelle, /<AuftaktZahlen \/>/);
  const knopf = quelle.slice(quelle.indexOf("<Link"), quelle.indexOf("</Link>"));
  assert.doesNotMatch(knopf, /data-story-einstieg/);
});

test("Bewegung: Leiste bei 4,2 s, eigenes Merkmal, Endwerte beim Aufräumen", () => {
  const quelle = lies("components/story/bewegung/auftakt.ts");
  assert.match(quelle, /\[data-auftakt-zaehler\]/);
  assert.match(quelle, /'\[data-story="zahlen"\]'/);
  assert.match(quelle, /ZAHLEN_AB = 4\.2/);
  assert.match(quelle, /zahlFormat\(document\.documentElement\.lang, 0\)/);
  // Bestehende Marken bleiben (Nutzer 2026-09-25).
  assert.match(quelle, /'\[data-story="oberzeile"\]'[\s\S]*?1\.8,/);
  assert.match(quelle, /'\[data-story="intro"\]'[\s\S]*?3\.4,/);
});

test("Doppelseite greift nur [data-zaehler], der Auftakt nutzt es nicht", () => {
  assert.match(lies("components/story/bewegung/eintrag.ts"), /"\[data-zaehler\]"/);
  assert.doesNotMatch(lies("components/story/bewegung/auftakt.ts"), /\[data-zaehler\]/);
  assert.doesNotMatch(lies("components/story/AuftaktZahlen.tsx"), /data-zaehler=/);
});

test("Feinschliff: Abstände im 8px-Raster, Verlauf trägt die Schrift", () => {
  const quelle = lies("components/story/Auftakt.tsx");
  // Nur gerade Tailwind-Stufen (4px je Stufe) an Oberzeile und Intro.
  const oberzeile = quelle.slice(quelle.indexOf('data-story="oberzeile"'), quelle.indexOf('data-story="intro"'));
  const intro = quelle.slice(quelle.indexOf('data-story="intro"'), quelle.indexOf("</p>", quelle.indexOf('data-story="intro"')));
  for (const block of [oberzeile, intro]) {
    for (const [, stufe] of block.matchAll(/\b(?:sm:)?mt-(\d+)\b/g)) assert.equal(Number(stufe) % 2, 0, `mt-${stufe} liegt nicht im 8px-Raster`);
  }
  assert.match(quelle, /from-surface\/40 via-surface\/30 to-surface/);
});

test("Telefon: Zahlen und Wörter passen in drei Spalten (Review I1)", () => {
  const quelle = lies("components/story/AuftaktZahlen.tsx");
  // Mono bei 39 px ist für "1.284" breiter als eine Spalte bei 390 px: darunter eine Stufe kleiner.
  assert.match(quelle, /numeric text-h1 sm:text-display/);
  // Gesperrte Versalien sprengen die Spalte: auf Telefonen ohne Sperrung, mit Trennung.
  assert.match(quelle, /tracking-normal sm:tracking-gesperrt/);
  assert.match(quelle, /hyphens-auto/);
});

test("Zahlen stehen auf einer Linie, auch wenn ein Wort zweizeilig bricht (live 2026-10-08)", () => {
  // flex-col-reverse: justify-end schiebt die Zahl nach oben, Wörter hängen darunter.
  assert.match(lies("components/story/AuftaktZahlen.tsx"), /flex flex-col-reverse items-center justify-end gap-2/);
});

test("Telefon: 16 px Seitenpolster, damit BEWERTUNGEN bei 390 px ungetrennt passt (live 2026-10-08)", () => {
  // Gemessen: Wort 109 px, Spalte bei px-6 nur 104 px, bei px-4 114 px.
  assert.match(lies("components/story/Auftakt.tsx"), /flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8 sm:gap-12 sm:px-8/);
});
