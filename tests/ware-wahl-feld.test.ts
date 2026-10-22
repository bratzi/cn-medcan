import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { WareWahlFeld, vertreiberGruppen } from "@/components/sorte/WareWahlFeld";
import { de } from "@/lib/i18n/de";
import { gruppiereWaren, waehleAktiveWare, type WareKarte } from "@/lib/query/sorte";

const p = (id: string, thcMin: number, thcMax: number) => ({ id, slug: `slug-${id}`, handelsname: `Ware ${id}`, thcMin, thcMax, cbdMin: 0, cbdMax: 1 });

const waren: WareKarte[] = [
  { vertreiberId: "v-b", vertreiberName: "Beta Pharma", produkte: [p("b1", 18, 22), p("b2", 24, 28)], anzahl: 5, gesamtnoteMittel: 3.8 },
  { vertreiberId: "v-a", vertreiberName: "Alpha GmbH", produkte: [p("a1", 20, 24)], anzahl: 0, gesamtnoteMittel: null },
];
const alleVertreiber = [
  { id: "v-d", name: "Delta AG" },
  { id: "v-a", name: "Alpha GmbH" },
  { id: "v-c", name: "Cara Pharma" },
  { id: "v-b", name: "Beta Pharma" },
];

test("gruppiereWaren: Reihenfolge nach Anzahl, dann Name, nie nach Note", () => {
  const zeilen = [
    { ...p("z1", 20, 24), vertreiberId: "v-z", vertreiberName: "Zeta", kultivarTyp: "HYBRID", genetik: null },
    { ...p("a1", 20, 24), vertreiberId: "v-a", vertreiberName: "Alpha", kultivarTyp: "HYBRID", genetik: null },
    { ...p("m1", 20, 24), vertreiberId: "v-m", vertreiberName: "Mu", kultivarTyp: "HYBRID", genetik: null },
  ];
  const kennwerte = new Map([
    ["v-m", { anzahl: 3, gesamtnoteMittel: 1 }],
    ["v-z", { anzahl: 1, gesamtnoteMittel: 5 }],
  ]);
  assert.deepEqual(gruppiereWaren(zeilen, kennwerte).map((w) => w.vertreiberId), ["v-m", "v-z", "v-a"]);
});

test("waehleAktiveWare: ?ware vor Vertreiber, sonst die meistbewertete", () => {
  assert.equal(waehleAktiveWare(waren, {})?.produkt.id, "b1");
  assert.equal(waehleAktiveWare(waren, { vertreiber: "v-a" })?.ware.vertreiberId, "v-a");
  assert.equal(waehleAktiveWare(waren, { ware: "slug-b2", vertreiber: "v-a" })?.produkt.id, "b2");
  assert.equal(waehleAktiveWare(waren, { ware: "gibts-nicht" })?.produkt.id, "b1");
  assert.equal(waehleAktiveWare([], {}), null);
});

test("WareWahlFeld: mehrere Vertreiber als Pflicht-Select, Varianten des gewählten, „Weiß ich nicht“ lässt strainId leer", () => {
  const mehrere = renderToStaticMarkup(
    createElement(WareWahlFeld, { waren, alleVertreiber, vorgewaehlt: { vertreiberId: "v-b", strainId: null }, texte: de.bluete.vertreiber, sprache: "de" }),
  );
  assert.match(mehrere, /<select[^>]*name="vertreiberId"[^>]*required/);
  assert.match(mehrere, /<option value="v-b" selected="">Beta Pharma<\/option>/);
  assert.match(mehrere, /<option value="v-a">Alpha GmbH<\/option>/);
  assert.match(mehrere, /Von welchem Vertreiber ist deine Blüte\?/);
  assert.match(mehrere, /name="strainId" value=""/);
  assert.match(mehrere, /aria-pressed="true"[^>]*>(?:<svg.*?<\/svg>)?Weiß ich nicht/);
  assert.match(mehrere, /THC 18/);
  assert.doesNotMatch(mehrere, /hersteller-titel/);

  const offen = renderToStaticMarkup(
    createElement(WareWahlFeld, { waren, alleVertreiber, vorgewaehlt: { vertreiberId: null, strainId: null }, texte: de.bluete.vertreiber, sprache: "de" }),
  );
  assert.match(offen, /<option value="" disabled="" selected="">Vertreiber wählen<\/option>/);
  assert.doesNotMatch(offen, /THC 18/);

  const einer = renderToStaticMarkup(
    createElement(WareWahlFeld, { waren: [waren[1]], alleVertreiber, vorgewaehlt: { vertreiberId: null, strainId: null }, texte: de.bluete.vertreiber, sprache: "de" }),
  );
  // Auch mit einem gelisteten Vertreiber bleibt die Wahl offen für alle (Nutzer 2026-10-22), vorgewählt ist er.
  assert.match(einer, /<select[^>]*name="vertreiberId"[^>]*required/);
  assert.match(einer, /<option value="v-a" selected="">Alpha GmbH<\/option>/);
  assert.doesNotMatch(einer, /Weiß ich nicht/);
  // Kein Bestätigungssatz unter der Wahl (Nutzer 2026-10-22).
  assert.doesNotMatch(einer, /Deine Blüte ist von/);

  const gewaehlt = renderToStaticMarkup(
    createElement(WareWahlFeld, { waren, alleVertreiber, vorgewaehlt: { vertreiberId: "v-b", strainId: "b2" }, texte: de.bluete.vertreiber, sprache: "de" }),
  );
  assert.match(gewaehlt, /name="strainId" value="b2"/);
});

test("WareWahlFeld: alle Vertreiber wählbar, gelistete zuerst, kein „Vertreiber unbekannt“", () => {
  const html = renderToStaticMarkup(
    createElement(WareWahlFeld, {
      waren: [...waren, { vertreiberId: "", vertreiberName: "", produkte: [p("u1", 20, 22)], anzahl: 0, gesamtnoteMittel: null }],
      alleVertreiber,
      vorgewaehlt: { vertreiberId: null, strainId: null },
      texte: de.bluete.vertreiber,
      sprache: "de",
      kultivarId: "k1",
    }),
  );
  assert.doesNotMatch(html, /Vertreiber unbekannt/);
  const gelistet = html.indexOf('label="Für diesen Strain gelistet"');
  const weitere = html.indexOf('label="Weitere Vertreiber"');
  assert.ok(gelistet > -1 && weitere > gelistet);
  // Gelistete nur einmal, im ersten Block; der Rest alphabetisch im zweiten.
  assert.equal(html.match(/value="v-a"/g)?.length, 1);
  assert.ok(html.indexOf('value="v-c"') > weitere);
  assert.ok(html.indexOf('value="v-d"') > html.indexOf('value="v-c"'));
  assert.match(html, /href="\/vorschlagen\?kultivar=k1"/);

  const fremd = renderToStaticMarkup(
    createElement(WareWahlFeld, { waren, alleVertreiber, vorgewaehlt: { vertreiberId: "v-d", strainId: null }, texte: de.bluete.vertreiber, sprache: "de" }),
  );
  assert.match(fremd, /<option value="v-d" selected="">Delta AG<\/option>/);
  assert.match(fremd, /noch nicht gelistet/);
});

test("vertreiberGruppen: gelistete nach Reihenfolge der Waren, weitere alphabetisch, ohne Leere", () => {
  const g = vertreiberGruppen(waren, alleVertreiber);
  assert.deepEqual(g.gelistet.map((v) => v.id), ["v-b", "v-a"]);
  assert.deepEqual(g.weitere.map((v) => v.id), ["v-c", "v-d"]);
});
