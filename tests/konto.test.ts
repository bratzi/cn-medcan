import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MeineStimmen } from "@/components/mitglied/MeineStimmen";
import { UmfrageJetzt } from "@/components/mitglied/UmfrageJetzt";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { kontoNotizen, stimmAusgang, type StimmZeile } from "@/lib/konto";
import type { UmfrageAnsicht } from "@/lib/query/umfragen";

test("stimmAusgang", () => {
  assert.equal(stimmAusgang("VORSCHLAG", false), "laeuft");
  assert.equal(stimmAusgang("ABSTIMMUNG", true), "laeuft");
  assert.equal(stimmAusgang("BEENDET", true), "gewonnen");
  assert.equal(stimmAusgang("BEENDET", false), "nichtGewonnen");
});

test("kontoNotizen: fünf, auch mit Nullen; Jahr als Zahl", () => {
  const n = kontoNotizen(
    { dabeiSeit: new Date("2025-03-01T00:00:00Z"), stimmen: 0, gewonnen: 0, vorgeschlagen: 0, ungelesen: 0 },
    de.mitglied.kapitel,
    "de",
  );
  assert.deepEqual(n.map((x) => x.zahl), ["2025", "0", "0", "0", "0"]);
  assert.deepEqual(n.map((x) => x.wort), ["dabei seit", "Stimmen", "gewonnen", "Vorschläge", "ungelesen"]);
  assert.equal(n[1].satz, "0 Stimmen abgegeben");
});

const umfrage = (phase: UmfrageAnsicht["phase"]): UmfrageAnsicht => ({
  id: "u1",
  titel: "Runde Oktober",
  beschreibung: null,
  phase,
  startAm: new Date("2026-10-01T00:00:00Z"),
  vorschlagBisAm: new Date("2026-10-10T00:00:00Z"),
  endetAm: null,
  communityPlaetze: 2,
  optionen: [
    { id: "o1", strainId: "s1", handelsname: "Sorte Eins", slug: "sorte-eins", reihenfolge: 1, herkunft: "COMMUNITY", istGewinner: false, stimmen: 3, ergebnisReviewId: null },
  ],
  stimmenGesamt: 3,
});

const jetzt = (p: Partial<Parameters<typeof UmfrageJetzt>[0]>) =>
  renderToStaticMarkup(
    createElement(UmfrageJetzt, {
      umfrage: umfrage("ABSTIMMUNG"),
      eigeneOptionId: null,
      freigegeben: true,
      texte: de.mitglied,
      phasen: de.umfrage.phasen,
      sprache: "de",
      ...p,
    }),
  );

test("UmfrageJetzt: ohne Stimme die Primäraktion", () => {
  const h = jetzt({});
  assert.match(h, /Du hast noch nicht abgestimmt/);
  assert.match(h, /Zur Abstimmung/);
  assert.match(h, /Abstimmung läuft/);
});

test("UmfrageJetzt: mit Stimme die Wahl gedruckt und der Vermerk von Hand", () => {
  const h = jetzt({ eigeneOptionId: "o1" });
  assert.match(h, /Sorte Eins/);
  assert.match(h, /font-hand text-vermerk[^>]*>deine Wahl/);
  assert.doesNotMatch(h, /Zur Abstimmung/);
});

test("UmfrageJetzt: nicht freigegeben ohne Primäraktion, mit Hinweis", () => {
  const h = jetzt({ freigegeben: false });
  assert.match(h, /sobald der Betreiber dein Konto freigegeben hat/);
  assert.doesNotMatch(h, /Zur Abstimmung/);
});

test("UmfrageJetzt: Vorschlagsphase mit Datum; keine Runde mit Link", () => {
  assert.match(jetzt({ umfrage: umfrage("VORSCHLAG") }), /Vorschläge bis 10\.10\.2026/);
  const h = jetzt({ umfrage: null });
  assert.match(h, /Gerade läuft keine Runde/);
  assert.match(h, /href="\/umfragen"/);
});

const s = (p: Partial<StimmZeile>): StimmZeile => ({
  umfrageId: "u1",
  rundentitel: "Runde September",
  phase: "BEENDET",
  abgegebenAm: new Date("2026-09-05T10:00:00Z"),
  slug: "sorte-eins",
  handelsname: "Sorte Eins",
  bildPfad: null,
  istGewinner: true,
  ergebnisReviewId: "r1",
  ...p,
});

test("MeineStimmen: Ausgang als Badge mit Text, Link zur Bewertung nur bei Gewinn mit Bewertung", () => {
  const h = renderToStaticMarkup(
    createElement(MeineStimmen, {
      stimmen: [s({}), s({ umfrageId: "u2", istGewinner: false, ergebnisReviewId: null }), s({ umfrageId: "u3", phase: "ABSTIMMUNG" })],
      texte: de.mitglied,
      sprache: "de",
    }),
  );
  assert.match(h, />gewonnen</);
  assert.match(h, />nicht gewonnen</);
  assert.match(h, />läuft</);
  assert.equal((h.match(/Zur Bewertung/g) ?? []).length, 1);
  assert.match(h, /wrap-break-word/);
  assert.match(h, /href="\/blueten\/sorte-eins#eintrag-r1"/, "Zur Bewertung führt auf den Anker");
});

test("MeineStimmen: leer mit Weg zu den Umfragen", () => {
  const h = renderToStaticMarkup(createElement(MeineStimmen, { stimmen: [], texte: de.mitglied, sprache: "de" }));
  assert.match(h, /Noch keine Stimme abgegeben/);
  assert.match(h, /href="\/umfragen"/);
});

test("lib/query/konto: Stimmen mit take, Zahlen in einer Abfrage", () => {
  const q = readFileSync("lib/query/konto.ts", "utf8");
  assert.match(q, /take:\s*MEINE_STIMMEN/);
  assert.match(q, /SUM\(/);
  assert.match(q, /COUNT\(\*\)/);
});

test("kontoNotizen: Vorlesesätze in Einzahl und Mehrzahl, deutsch und englisch", () => {
  const e = (n: number) => ({ dabeiSeit: new Date("2025-03-01T00:00:00Z"), stimmen: n, gewonnen: n, vorgeschlagen: n, ungelesen: n });
  const eins = kontoNotizen(e(1), de.mitglied.kapitel, "de").map((x) => x.satz);
  assert.deepEqual(eins.slice(1), ["1 Stimme abgegeben", "1 deiner Stimmen hat gewonnen", "1 Blüte vorgeschlagen", "1 ungelesene Nachricht"]);
  const zwei = kontoNotizen(e(2), de.mitglied.kapitel, "de").map((x) => x.satz);
  assert.deepEqual(zwei.slice(1), ["2 Stimmen abgegeben", "2 deiner Stimmen haben gewonnen", "2 Blüten vorgeschlagen", "2 ungelesene Nachrichten"]);
  const en1 = kontoNotizen(e(1), en.mitglied.kapitel, "en").map((x) => x.satz);
  assert.deepEqual(en1.slice(1), ["1 vote cast", "1 of your votes won", "1 flower suggested", "1 unread message"]);
});

test("ProfilFormular: Speichern ist sekundär, die Primäraktion bleibt dem Stimmzettel", () => {
  const q = readFileSync("components/auth/ProfilFormular.tsx", "utf8");
  assert.match(q, /<Button type="submit" variante="secondary"/);
});

test("Seiten: Teilfehler werden geloggt statt still geschluckt", () => {
  const m = readFileSync("app/[lang]/mitglied/page.tsx", "utf8");
  const p = readFileSync("app/[lang]/profil/page.tsx", "utf8");
  assert.doesNotMatch(m, /\.catch\(\(\) =>/);
  assert.doesNotMatch(p, /\.catch\(\(\) =>/);
  assert.match(m, /oderNull<.*>\("eigeneStimme"\)/);
  assert.match(p, /oderNull<number>\("ungeleseneAnzahl"\)/);
});
