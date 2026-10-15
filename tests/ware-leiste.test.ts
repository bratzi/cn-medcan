import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { WareLeiste } from "@/components/sorte/WareLeiste";
import { WareWahlFeld } from "@/components/sorte/WareWahlFeld";
import { de } from "@/lib/i18n/de";
import { gruppiereWaren, waehleAktiveWare, type WareKarte } from "@/lib/query/sorte";

const p = (id: string, thcMin: number, thcMax: number) => ({ id, slug: `slug-${id}`, handelsname: `Ware ${id}`, thcMin, thcMax, cbdMin: 0, cbdMax: 1 });

const waren: WareKarte[] = [
  { vertreiberId: "v-b", vertreiberName: "Beta Pharma", produkte: [p("b1", 18, 22), p("b2", 24, 28)], anzahl: 5, gesamtnoteMittel: 3.8 },
  { vertreiberId: "v-a", vertreiberName: "Alpha GmbH", produkte: [p("a1", 20, 24)], anzahl: 0, gesamtnoteMittel: null },
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

test("waehleAktiveWare: ?ware vor ?vertreiber, sonst die meistbewertete", () => {
  assert.equal(waehleAktiveWare(waren, {})?.produkt.id, "b1");
  assert.equal(waehleAktiveWare(waren, { vertreiber: "v-a" })?.ware.vertreiberId, "v-a");
  assert.equal(waehleAktiveWare(waren, { ware: "slug-b2", vertreiber: "v-a" })?.produkt.id, "b2");
  assert.equal(waehleAktiveWare(waren, { ware: "gibts-nicht" })?.produkt.id, "b1");
  assert.equal(waehleAktiveWare([], {}), null);
});

test("WareLeiste: Karten in Reihenfolge, gewählte markiert, Links ohne Sprung", () => {
  const html = renderToStaticMarkup(
    createElement(WareLeiste, { waren, aktiveVertreiberId: "v-a", slug: "mac-1", texte: de.bluete.vertreiber, sprache: "de" }),
  );
  assert.ok(html.indexOf("Beta Pharma") < html.indexOf("Alpha GmbH"));
  assert.match(html, /href="\/blueten\/mac-1\?vertreiber=v-b"/);
  assert.equal(html.split('aria-current="true"').length - 1, 1);
  const alpha = html.split("<li").find((teil) => teil.includes("Alpha GmbH")) ?? "";
  assert.match(alpha, /aria-current="true"/);
  assert.match(html, /Note 3,8 von 5/);
});

test("WareWahlFeld: Stärken nur bei mehr als einem Produkt, „Weiß ich nicht“ lässt strainId leer", () => {
  const mehrere = renderToStaticMarkup(
    createElement(WareWahlFeld, { waren, vorgewaehlt: { vertreiberId: "v-b", strainId: null }, texte: de.bluete.vertreiber, sprache: "de" }),
  );
  assert.match(mehrere, /name="vertreiberId" value="v-b"/);
  assert.match(mehrere, /name="strainId" value=""/);
  assert.match(mehrere, /Weiß ich nicht/);
  assert.match(mehrere, /aria-pressed="true"[^>]*>(?:<svg.*?<\/svg>)?Weiß ich nicht/);
  assert.match(mehrere, /THC 18/);

  const einer = renderToStaticMarkup(
    createElement(WareWahlFeld, { waren, vorgewaehlt: { vertreiberId: "v-a", strainId: null }, texte: de.bluete.vertreiber, sprache: "de" }),
  );
  assert.doesNotMatch(einer, /Weiß ich nicht/);
  assert.match(einer, /name="vertreiberId" value="v-a"/);

  const gewaehlt = renderToStaticMarkup(
    createElement(WareWahlFeld, { waren, vorgewaehlt: { vertreiberId: "v-b", strainId: "b2" }, texte: de.bluete.vertreiber, sprache: "de" }),
  );
  assert.match(gewaehlt, /name="strainId" value="b2"/);
});
