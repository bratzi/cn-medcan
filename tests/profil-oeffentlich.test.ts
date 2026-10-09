import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { OeffentlicheBewertungen } from "@/components/profil/OeffentlicheBewertungen";
import { de } from "@/lib/i18n/de";
import { netzTexte } from "@/lib/profil-oeffentlich";

/** Öffentliches Profil (Spec Profil 9): Texte, Liste, Seite ohne private Teile. */

test("netzTexte: dritte Person statt „mag ich“, Rest aus profil", () => {
  const t = netzTexte(de);
  assert.equal(t.magIch, "mag");
  assert.equal(t.magIchNicht, "mag nicht");
  assert.equal(t.nurMittelfeld, de.profilOeffentlich.nurMittelfeld);
  assert.equal(t.netzTitel, de.profil.netzTitel);
});

test("OeffentlicheBewertungen: Links auf den Eintrag, Note oder Hinweis", () => {
  const html = renderToStaticMarkup(
    createElement(OeffentlicheBewertungen, {
      bewertungen: [
        { id: "r1", slug: "nebel-22", handelsname: "Nebel 22", gesamtnote: 4.5, erstelltAm: new Date("2026-10-01") },
        { id: "r2", slug: "harz-1", handelsname: "Harz 1", gesamtnote: null, erstelltAm: new Date("2026-09-01") },
      ],
      anzahl: 2,
      texte: de.profilOeffentlich,
      w: de,
      sprache: "de",
    }),
  );
  assert.match(html, /href="\/blueten\/nebel-22#eintrag-r1"[^>]*>Nebel 22</);
  assert.match(html, /4,5 von 5 Blättern/);
  assert.match(html, /ohne Gesamtnote/);
  assert.doesNotMatch(html, /Die neuesten/);
});

test("OeffentlicheBewertungen: leer und gekürzt", () => {
  const leer = renderToStaticMarkup(
    createElement(OeffentlicheBewertungen, { bewertungen: [], anzahl: 0, texte: de.profilOeffentlich, w: de, sprache: "de" }),
  );
  assert.match(leer, /Noch keine freigegebene Bewertung\./);
  const eine = { id: "r1", slug: "a", handelsname: "A", gesamtnote: 3, erstelltAm: new Date() };
  const gekuerzt = renderToStaticMarkup(
    createElement(OeffentlicheBewertungen, { bewertungen: [eine], anzahl: 60, texte: de.profilOeffentlich, w: de, sprache: "de" }),
  );
  assert.match(gekuerzt, /Die neuesten 1\./);
});

test("Seite: falsche Kurz-Id fragt die Datenbank nicht", () => {
  const quelle = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  // Reihenfolge: erst istKurzId, dann ladeOeffentlichesProfil.
  assert.ok(quelle.indexOf("istKurzId(") > 0 && quelle.indexOf("istKurzId(") < quelle.indexOf("ladeOeffentlichesProfil("));
  assert.match(quelle, /index: false/);
  assert.doesNotMatch(quelle, /aktuellesProfil|ladeEmpfehlungen|auswertungen/);
});

test("Query: nur eingeschaltete Profile, nur freigegebene Bewertungen, Liste begrenzt, kein Neurechnen", () => {
  const quelle = readFileSync("lib/query/profil-oeffentlich.ts", "utf8");
  assert.match(quelle, /profilOeffentlich: true/);
  assert.match(quelle, /freigegeben: true/);
  assert.match(quelle, /take: OEFFENTLICHE_BEWERTUNGEN/);
  assert.doesNotMatch(quelle, /aktuellesProfil|ladeEmpfehlungen|auswertungen\(/);
});
