import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Aktivitaet } from "@/components/profil/Aktivitaet";
import { NotenVerteilung } from "@/components/profil/NotenVerteilung";
import { de } from "@/lib/i18n/de";
import { monatsReihe, notenVerteilung, profilNotizen } from "@/lib/profil-dashboard";
import type { AuswertungsZeile } from "@/lib/profil-typen";

const z = (gesamtnote: number | null, tag: string, community: AuswertungsZeile["community"] = null): AuswertungsZeile => ({
  slug: "s",
  handelsname: "S",
  erstelltAm: new Date(tag),
  gesamtnote,
  aussehen: 3,
  geruch: 3,
  geschmack: 3,
  wirkung: 3,
  konsistenz: 3,
  community,
});

test("monatsReihe: zwölf Monate, laufender zuletzt, UTC-Grenzen", () => {
  const jetzt = new Date("2026-10-01T00:30:00Z");
  const r = monatsReihe(
    [new Date("2026-09-30T23:30:00Z"), new Date("2026-10-01T00:10:00Z"), new Date("2025-10-15T12:00:00Z"), new Date("2025-09-30T12:00:00Z")],
    jetzt,
    "de",
  );
  assert.equal(r.length, 12);
  assert.equal(r[11].schluessel, "2026-10");
  assert.equal(r[11].laufend, true);
  assert.equal(r[11].anzahl, 1);
  assert.equal(r[10].anzahl, 1);
  assert.equal(r[0].schluessel, "2025-11");
  assert.equal(r.reduce((s, m) => s + m.anzahl, 0), 2, "Oktober 2025 und älter liegen außerhalb");
  assert.equal(r.filter((m) => m.laufend).length, 1);
});

test("monatsReihe: Jahreswechsel und Monatskürzel je Sprache", () => {
  const r = monatsReihe([], new Date("2026-01-15T12:00:00Z"), "en");
  assert.equal(r[0].schluessel, "2025-02");
  assert.equal(r[11].schluessel, "2026-01");
  assert.equal(r[11].kurz, "Jan");
});

test("notenVerteilung: fünf Stufen, gerundet, Ersatznote ohne Gesamtnote", () => {
  const v = notenVerteilung([z(4.5, "2026-01-01"), z(4.4, "2026-01-01"), z(1, "2026-01-01"), z(null, "2026-01-01")]);
  assert.deepEqual(v.map((s) => s.stufe), [1, 2, 3, 4, 5]);
  assert.equal(v[0].anzahl, 1);
  assert.equal(v[3].anzahl, 1);
  assert.equal(v[4].anzahl, 1);
  assert.equal(v[2].anzahl, 1, "ohne Gesamtnote zählt das Mittel 3 der Teilnoten");
});

test("profilNotizen: fünf Notizen; ohne Community-Abstand entfällt sie", () => {
  const zeilen = [z(4, "2026-10-02T10:00:00Z"), z(3, "2026-09-01T10:00:00Z")];
  const mit = profilNotizen({ zeilen, differenz: -0.4, hersteller: 2 }, de.profil.kapitel, "de");
  assert.deepEqual(mit.map((n) => n.wort), ["bewertet", "im Schnitt", "zur Community", "Hersteller", "zuletzt"]);
  assert.equal(mit[0].zahl, "2");
  assert.equal(mit[1].zahl, "3,5");
  assert.equal(mit[2].zahl, "−0,4");
  assert.equal(mit[4].zahl, "02.10.");
  const ohne = profilNotizen({ zeilen, differenz: null, hersteller: 2 }, de.profil.kapitel, "de");
  assert.equal(ohne.length, 4);
});

test("profilNotizen: Vorzeichen am gerundeten Wert, nie ±0,0", () => {
  const zeilen = [z(4, "2026-10-02T10:00:00Z")];
  for (const d of [-0.04, 0.04, 0]) {
    assert.equal(profilNotizen({ zeilen, differenz: d, hersteller: 1 }, de.profil.kapitel, "de")[2].zahl, "0,0");
  }
  assert.equal(profilNotizen({ zeilen, differenz: 0.4, hersteller: 1 }, de.profil.kapitel, "de")[2].zahl, "+0,4");
});

test("profilNotizen: ohne Bewertung nur „0 bewertet“", () => {
  const n = profilNotizen({ zeilen: [], differenz: null, hersteller: 0 }, de.profil.kapitel, "de");
  assert.deepEqual(n.map((x) => [x.zahl, x.wort]), [["0", "bewertet"]]);
});

test("Aktivitaet: Säulen mit data-saeule, Wert nur ab 1, Tabelle für Screenreader, Leersatz", () => {
  const monate = monatsReihe([new Date("2026-10-02T10:00:00Z")], new Date("2026-10-08T10:00:00Z"), "de");
  const h = renderToStaticMarkup(createElement(Aktivitaet, { monate, texte: de.profil }));
  assert.equal((h.match(/data-saeule/g) ?? []).length, 12);
  assert.match(h, /<table class="sr-only"/);
  assert.equal((h.match(/data-wert/g) ?? []).length, 1, "nur der Monat mit 1 trägt eine Wertzahl, keine 0");
  assert.match(h, /Okt 2026/);
  assert.doesNotMatch(h, /accent/);
  const leer = renderToStaticMarkup(createElement(Aktivitaet, { monate: monatsReihe([], new Date(), "de"), texte: de.profil }));
  assert.match(leer, /noch keine Bewertung/);
  assert.doesNotMatch(leer, /data-saeule/);
});

test("NotenVerteilung: Balken ohne Spur, Liste für Screenreader, Leersatz", () => {
  const h = renderToStaticMarkup(createElement(NotenVerteilung, { stufen: notenVerteilung([z(4, "2026-01-01")]), texte: de.profil }));
  assert.equal((h.match(/data-balken/g) ?? []).length, 1, "nur Stufen mit Anzahl bekommen einen Balken");
  assert.match(h, /Note 4: 1/);
  const leer = renderToStaticMarkup(createElement(NotenVerteilung, { stufen: notenVerteilung([]), texte: de.profil }));
  assert.match(leer, /ersten Bewertung/);
});

test("profilNotizen: Vorlesesätze in Einzahl und Mehrzahl", () => {
  const eine = [z(4, "2026-10-02T10:00:00Z")];
  const eins = profilNotizen({ zeilen: eine, differenz: null, hersteller: 1 }, de.profil.kapitel, "de");
  assert.equal(eins[0].satz, "1 Bewertung");
  assert.equal(eins.find((n) => n.wort === "Hersteller")?.satz, "Blüten von 1 Hersteller bewertet");
  const zwei = [z(4, "2026-10-02T10:00:00Z"), z(3, "2026-09-01T10:00:00Z")];
  const mehr = profilNotizen({ zeilen: zwei, differenz: null, hersteller: 2 }, de.profil.kapitel, "de");
  assert.equal(mehr[0].satz, "2 Bewertungen");
  assert.equal(mehr.find((n) => n.wort === "Hersteller")?.satz, "Blüten von 2 Herstellern bewertet");
});

test("Aktivitaet: Wertzahl ist Geschwister der Säule, nicht in ihr", () => {
  const monate = monatsReihe([new Date("2026-10-02T10:00:00Z")], new Date("2026-10-08T10:00:00Z"), "de");
  const h = renderToStaticMarkup(createElement(Aktivitaet, { monate, texte: de.profil }));
  assert.match(h, /data-saeule=""[^>]*><\/div><span data-wert=""[^>]*bottom:calc\(100% \+ 8px\)/);
});
