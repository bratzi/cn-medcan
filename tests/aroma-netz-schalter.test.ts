import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { profilNetzTexte } from "@/lib/aroma-netz-texte";
import { de } from "@/lib/i18n/de";
import { leereProfilWerte } from "@/lib/profil";

const basis = leereProfilWerte();
const zeige = (terpenNetz = basis.terpenNetz) =>
  renderToStaticMarkup(
    createElement(ProfilNetz, {
      werte: { ...basis, geschmack: { ...basis.geschmack, ZITRUS: 1 }, terpenNetz, anzahl: 4, gewichtet: 4 },
      texte: profilNetzTexte(de.profil),
      achsen: de.label.geschmack,
      sprache: "de",
    }),
  );

test("Schalter Geschmäcker | Terpene nur mit Terpenwerten (Review Focus 2)", () => {
  assert.doesNotMatch(zeige(), /role="radiogroup"/);
  const html = zeige({ ...basis.terpenNetz, linalool: 1 });
  assert.match(html, /role="radiogroup"/);
  assert.match(html, new RegExp(de.profil.modusGeschmack));
  assert.match(html, new RegExp(de.profil.modusTerpene));
});

test("Lesung nicht mehr mittig im Netz, sondern außen an der Marke", () => {
  const quelle = readFileSync("components/profil/AromaNetz.tsx", "utf8");
  assert.doesNotMatch(quelle, /netz-lesung[^"]*top-1\/2 left-1\/2/);
  assert.match(quelle, /lesungsLage\(/);
  const css = readFileSync("app/globals.css", "utf8");
  for (const seite of ["rechts", "links", "oben", "unten"]) assert.ok(css.includes(`.netz-lesung[data-seite="${seite}"]`), seite);
});

test("Ansichtstaste liegt in lib, damit das Netz nicht die ganze Aroma-Karte lädt", () => {
  assert.doesNotMatch(readFileSync("components/profil/AromaNetz.tsx", "utf8"), /components\/review\/AromaKarte/);
});
