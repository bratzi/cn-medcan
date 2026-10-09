import { test } from "node:test";
import assert from "node:assert/strict";

import { kapitelAus, kapitelNotizen } from "@/lib/kapitel-start";
import { de } from "@/lib/i18n/de";
import { leereProfilWerte } from "@/lib/profil";
import { kapitelAnzeige, sitzungsAntwort } from "@/lib/startseite-sitzung";

const basis = {
  anzeigename: "GrünesBuch",
  avatarId: null,
  bewertet: 5,
  schnitt: 4.4333,
  dritte: { art: "vonEuch" as const, zahl: 21 },
  netz: { ...leereProfilWerte(), anzahl: 5, gewichtet: 4 },
  zuletzt: { slug: "remexian", handelsname: "Remexian 30/1 PGF CIS", gesamtnote: 4.5, erstelltAm: new Date("2026-10-08T10:00:00Z") },
};

test("kapitelAus rundet den Schnitt auf eine Stelle und macht das Datum JSON-fest", () => {
  const d = kapitelAus(basis);
  assert.equal(d.schnitt, 4.4);
  assert.equal(d.zuletzt?.datum, "2026-10-08T10:00:00.000Z");
});

test("kapitelAus: ohne Bewertung kein Netz und kein Zuletzt", () => {
  const d = kapitelAus({ ...basis, bewertet: 0, schnitt: null, zuletzt: null });
  assert.equal(d.netz, null);
  assert.equal(d.zuletzt, null);
});

test("kapitelAus: Netz ohne Gewicht zählt als kein Netz", () => {
  assert.equal(kapitelAus({ ...basis, netz: { ...leereProfilWerte(), anzahl: 2, gewichtet: 0 } }).netz, null);
});

test("kapitelNotizen: drei Notizen, ohne Schnitt zwei", () => {
  const t = de.start.kapitel;
  const voll = kapitelNotizen(kapitelAus(basis), t, "de");
  assert.deepEqual(voll.map((n) => n.wort), [t.bewertet, t.imSchnitt, t.vonEuch]);
  assert.equal(voll[1].zahl, "4,4");
  const ohne = kapitelNotizen(kapitelAus({ ...basis, schnitt: null }), t, "de");
  assert.deepEqual(ohne.map((n) => n.wort), [t.bewertet, t.vonEuch]);
});

test("kapitelNotizen: Mitglied zeigt gestimmt", () => {
  const n = kapitelNotizen(kapitelAus({ ...basis, dritte: { art: "gestimmt", zahl: 3 } }), de.start.kapitel, "de");
  assert.equal(n[2].wort, de.start.kapitel.gestimmt);
  assert.equal(n[2].zahl, "3");
});

test("kapitelNotizen: null gestimmt entfällt (Minor Dein Kapitel)", () => {
  const n = kapitelNotizen(kapitelAus({ ...basis, dritte: { art: "gestimmt", zahl: 0 } }), de.start.kapitel, "de");
  assert.ok(n.every((x) => x.wort !== de.start.kapitel.gestimmt));
});

test("Sitzung: Gast ohne Kapitel, Mitglied mit Kapitel, laden ohne Kapitel", () => {
  const kapitel = kapitelAus(basis);
  const gast = sitzungsAntwort({ mitglied: null, umfrageId: null, eigeneOptionId: null, empfehlungen: [], kapitel });
  assert.equal(gast.kapitel, null);
  const mitglied = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: null, eigeneOptionId: null, empfehlungen: [], kapitel });
  assert.deepEqual(kapitelAnzeige({ status: "fertig", daten: mitglied }), kapitel);
  assert.equal(kapitelAnzeige({ status: "laedt" }), null);
  assert.equal(kapitelAnzeige({ status: "fehler" }), null);
});
