import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Randnotizen } from "@/components/kapitel/Randnotizen";
import { ProfilKopf } from "@/components/profil/ProfilKopf";
import { de } from "@/lib/i18n/de";
import { kopfNotizen } from "@/lib/profil-kopf";

const n = (wort: string) => ({ zahl: "1", wort, satz: `Satz ${wort}` });
const konto = [n("dabei seit"), n("Stimmen"), n("gewonnen"), n("Vorschläge"), n("ungelesen")];

test("kopfNotizen: vier Profilzahlen und vier Kontozahlen, jede mit Sprungziel; dabei seit entfällt", () => {
  const z = kopfNotizen([n("bewertet"), n("im Schnitt"), n("Vertreiber"), n("zuletzt")], konto);
  assert.deepEqual(z.map((x) => x.wort), ["bewertet", "im Schnitt", "Vertreiber", "zuletzt", "Stimmen", "gewonnen", "Vorschläge", "ungelesen"]);
  assert.deepEqual(z.map((x) => x.href), [
    "#bewertungen-titel", "#topflop-titel", "#vertreiber-titel", "#bewertungen-titel",
    "#stimmen-titel", "#stimmen-titel", "#meine-vorschlaege-titel", "#nachrichten-titel",
  ]);
});

test("kopfNotizen: ohne Bewertung springt „0 bewertet“ zum Netz, nie ins Leere (Review Focus)", () => {
  const z = kopfNotizen([n("bewertet")], konto);
  assert.equal(z[0].href, "#netz-titel");
  assert.equal(z.length, 5);
});

test("kopfNotizen: Profil nicht ladbar, dann nur die Kontozahlen", () => {
  assert.deepEqual(kopfNotizen([], konto).map((x) => x.wort), ["Stimmen", "gewonnen", "Vorschläge", "ungelesen"]);
});

test("Randnotizen: mit href ein Link samt Vorlesesatz, als Leiste eine umbrechende Reihe ohne Container-Query", () => {
  const html = renderToStaticMarkup(createElement(Randnotizen, { notizen: [{ ...n("bewertet"), href: "#netz-titel" }], beschriftung: "Deine Zahlen", leiste: true }));
  assert.match(html, /<ul aria-label="Deine Zahlen" class="flex flex-wrap gap-x-8 gap-y-2">/);
  assert.doesNotMatch(html, /@container/);
  assert.match(html, /<a href="#netz-titel"[^>]*min-h-11[^>]*><span class="sr-only">Satz bewertet<\/span>/);
});

const basis = {
  name: "GrünesBuch",
  avatarId: null,
  rolle: "betreiber" as const,
  seit: new Date("2026-09-01T00:00:00Z"),
  notizen: [{ ...n("bewertet"), href: "#bewertungen-titel" }],
  aromen: ["Blumig", "Zitrus"],
  aktionen: [
    { href: "/blueten", text: "Blüte bewerten", art: "primary" as const },
    { href: "#einstellungen-titel", text: "Profil bearbeiten", art: "secondary" as const },
  ],
  texte: de.profil.seite,
  sprache: "de" as const,
};

test("ProfilKopf: Name als h1, Rolle, dabei seit, Aromen, Zahlen, eine Primäraktion, sticky ab 1080 px", () => {
  const html = renderToStaticMarkup(createElement(ProfilKopf, basis));
  assert.match(html, /<h1[^>]*>GrünesBuch<\/h1>/);
  assert.match(html, /Betreiber/);
  assert.match(html, /dabei seit September 2026/);
  assert.match(html, /Blumig/);
  assert.match(html, /href="#bewertungen-titel"/);
  assert.match(html, /min-\[1080px\]:sticky/);
  assert.equal((html.match(/href="#einstellungen-titel"/g) ?? []).length, 1);
});

test("ProfilKopf: langer Name bricht um statt die Leiste zu sprengen (Review Focus)", () => {
  const html = renderToStaticMarkup(createElement(ProfilKopf, { ...basis, name: "A".repeat(60) }));
  assert.match(html, /<h1 class="[^"]*wrap-break-word/);
});

test("Sprungziele landen unter Seitenkopf und Profilkopf", () => {
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /\[data-feld\] \[id\$="-titel"\] \{\s*scroll-margin-top: 6rem;/);
  assert.match(css, /@media \(width >= 67\.5rem\) \{\s*\[data-feld\] \[id\$="-titel"\] \{\s*scroll-margin-top: 16rem;/);
});

test("Profilkopf-Leiste: Zahl von Hand im Akzent (mindestens 32 px), Wort gedruckt (Nutzer 2026-10-14)", () => {
  const html = renderToStaticMarkup(createElement(Randnotizen, { notizen: [n("bewertet")], beschriftung: "Deine Zahlen", leiste: true }));
  assert.match(html, /class="font-hand text-vermerk text-logo[^"]*">1<\/span>/);
  assert.match(html, /class="text-caption text-text-muted[^"]*">bewertet<\/span>/);
});
