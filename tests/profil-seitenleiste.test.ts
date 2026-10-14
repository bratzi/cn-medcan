import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProfilReiter } from "@/components/profil/ProfilReiter";
import { ProfilSeitenleiste } from "@/components/profil/ProfilSeitenleiste";
import { de } from "@/lib/i18n/de";
import { ansichtAus, liebsteAromen } from "@/lib/profil-ansicht";
import { leereProfilWerte } from "@/lib/profil";

const leererGeschmack = () => leereProfilWerte().geschmack;

test("ansichtAus: bekannte Werte, sonst Übersicht (Review Focus)", () => {
  assert.equal(ansichtAus("aromen"), "aromen");
  assert.equal(ansichtAus("xyz"), "uebersicht");
  assert.equal(ansichtAus(["aromen", "bewertungen"]), "aromen");
  assert.equal(ansichtAus(undefined), "uebersicht");
});

test("liebsteAromen: nur positive, stärkste zuerst", () => {
  const g = { ...leererGeschmack(), ZITRUS: 0.4, ERDIG: 1, DIESEL: -1 };
  assert.deepEqual(liebsteAromen(g), ["ERDIG", "ZITRUS"]);
  assert.deepEqual(liebsteAromen(leererGeschmack()), []);
});

const leiste = (name: string) =>
  renderToStaticMarkup(
    createElement(ProfilSeitenleiste, {
      name,
      avatarId: null,
      rolle: "betreiber",
      seit: new Date("2026-09-01T00:00:00Z"),
      notizen: [{ zahl: "6", wort: "bewertet", satz: "6 Bewertungen" }],
      aromen: ["Erdig", "Zitrus"],
      aktionen: [{ href: "/blueten", text: "Blüte bewerten", art: "primary" }],
      texte: de.profil.seite,
      sprache: "de",
    }),
  );

test("Seitenleiste: Name als h1, Rolle, dabei seit, Zahlen, Aromen, Aktion", () => {
  const html = leiste("GrünesBuch");
  assert.match(html, /<h1[^>]*>GrünesBuch<\/h1>/);
  assert.match(html, /Betreiber/);
  assert.match(html, /dabei seit September 2026/);
  assert.match(html, /6 Bewertungen/);
  assert.match(html, /Erdig/);
  assert.match(html, /href="\/blueten"/);
  assert.doesNotMatch(html, /text-kulisse|kapitel-tiefe/);
});

test("Seitenleiste: langer Name bricht um (Review Focus)", () => {
  assert.match(leiste("A".repeat(40)), /<h1[^>]*wrap-break-word/);
});

test("Reiter: Links, aktiver mit aria-current, Übersicht ohne Query", () => {
  const html = renderToStaticMarkup(
    createElement(ProfilReiter, {
      basis: "/profil",
      aktiv: "aromen",
      beschriftung: "Bereiche des Profils",
      reiter: [
        { ansicht: "uebersicht", text: "Übersicht" },
        { ansicht: "aromen", text: "Aromen" },
      ],
    }),
  );
  assert.match(html, /<nav[^>]*aria-label="Bereiche des Profils"/);
  assert.match(html, /href="\/profil"[^>]*>Übersicht/);
  assert.match(html, /href="\/profil\?ansicht=aromen"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/profil\?ansicht=aromen"/);
});

test("Seitenleiste: eigene Beschriftung der Zahlen, leere Notizen ohne Liste, Identität ohne aside", () => {
  const basis = {
    name: "Anna",
    avatarId: null,
    rolle: "mitglied" as const,
    seit: null,
    aromen: [],
    aktionen: [],
    texte: de.profil.seite,
    sprache: "de" as const,
  };
  const mit = renderToStaticMarkup(
    createElement(ProfilSeitenleiste, { ...basis, notizen: [{ zahl: "1", wort: "bewertet", satz: "1 Bewertung" }], zahlenLabel: de.profil.seite.zahlenNeutral }),
  );
  assert.match(mit, /aria-label="Zahlen"/);
  assert.doesNotMatch(mit, /Deine Zahlen/);
  assert.doesNotMatch(renderToStaticMarkup(createElement(ProfilSeitenleiste, { ...basis, notizen: [] })), /<ul/);
});

test("ProfilRahmen: Spalte scrollt in sich und ist keine unbeschriftete aside", () => {
  const q = readFileSync("components/profil/ProfilRahmen.tsx", "utf8");
  assert.match(q, /min-\[1080px\]:sticky/);
  assert.match(q, /min-\[1080px\]:max-h-\[calc\(100svh-var\(--kopf-h,4rem\)-4rem\)\]/);
  assert.match(q, /min-\[1080px\]:overflow-y-auto/);
  assert.match(q, /min-\[1080px\]:overscroll-contain/);
  assert.doesNotMatch(q, /<aside/);
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
