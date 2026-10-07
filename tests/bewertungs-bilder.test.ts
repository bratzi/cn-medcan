import "./server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BewertungsBilder } from "@/components/review/BewertungsBilder";
import { budpicMeldungen } from "@/lib/budpic-anzeige";
import { de } from "@/lib/i18n/de";

const ID = (n: number) => `${n}f2b8c1e-0a4d-4e6b-9c1a-2d5e7f809abc`;
const zeige = (vorhanden: { id: string; breite: number; hoehe: number; status: "OFFEN" | "FREIGEGEBEN" | "ABGELEHNT" }[], istBetreiber = false) =>
  renderToStaticMarkup(
    createElement(BewertungsBilder, {
      vorhanden,
      vorgemerkt: [],
      setVorgemerkt: () => {},
      onBeschaeftigt: () => {},
      istBetreiber,
      gesperrt: false,
      meldungen: budpicMeldungen(de),
      texte: de.bewerten,
      onGeaendert: () => {},
    }),
  );

test("Bilder: Überschrift, Hinweis mit Höchstzahl, Prüfhinweis nur für die Community", () => {
  const html = zeige([]);
  assert.match(html, /Bilder zur Bewertung/);
  assert.match(html, /Bis zu 3 Bilder/);
  assert.match(html, /erst nach unserer Prüfung/);
  assert.doesNotMatch(zeige([], true), /erst nach unserer Prüfung/);
});

test("Bilder: vorhandene mit Status; offene über die private Vorschau, abgelehnte ohne Bild", () => {
  const html = zeige([
    { id: ID(1), breite: 800, hoehe: 600, status: "FREIGEGEBEN" },
    { id: ID(2), breite: 800, hoehe: 600, status: "OFFEN" },
    { id: ID(3), breite: 800, hoehe: 600, status: "ABGELEHNT" },
  ]);
  assert.match(html, new RegExp(`src="/api/bild/${ID(1)}"`));
  assert.match(html, new RegExp(`src="/api/bild/offen/${ID(2)}"`));
  assert.doesNotMatch(html, new RegExp(`/api/bild/(offen/)?${ID(3)}`));
  assert.match(html, /Freigegeben/);
  assert.match(html, /Wartet auf Freigabe/);
  assert.match(html, /Abgelehnt/);
});

test("Bilder: Wählen bis zur Hydrierung gesperrt, bei drei belegten gar nicht da", () => {
  assert.match(zeige([]), /<button[^>]*disabled[^>]*>Bilder wählen<\/button>/);
  const voll = zeige([1, 2, 3].map((n) => ({ id: ID(n), breite: 1, hoehe: 1, status: "OFFEN" as const })));
  assert.doesNotMatch(voll, /Bilder wählen/);
});
