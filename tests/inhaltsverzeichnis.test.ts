import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Inhaltsverzeichnis } from "@/components/review/Inhaltsverzeichnis";
import type { EintragDaten } from "@/components/review/eintrag";
import { leereGeschmacksMatrix } from "@/lib/query/bewertung";
import { de } from "@/lib/i18n/de";

function eintrag(id: string, handelsname: string, note: number, chargenNr: string | null): EintragDaten {
  return {
    id,
    handelsname,
    slug: id,
    aussehen: note,
    geruch: note,
    geschmack: note,
    wirkung: note,
    konsistenz: note,
    geschmacksMatrix: leereGeschmacksMatrix(),
    feuchtigkeitProzent: null,
    notiz: null,
    instagramReelUrl: null,
    chargenNr,
    erstelltAm: new Date("2026-09-12T12:00:00Z"),
    istBetreiber: true,
    autorName: null,
    gesamtnote: null,
    terpene: [],
    terpenIntensitaet: {},
    beschaffenheit: {},
  };
}

test("je Eintrag eine Zeile mit Sprunglink, Note und Datum", () => {
  const html = renderToStaticMarkup(
    createElement(Inhaltsverzeichnis, {
      eintraege: [eintrag("a", "Nebelharz 22", 4.2, "CH-1"), eintrag("b", "Zitronensegel 18", 3.8, null)],
      w: de,
      sprache: "de",
    }),
  );
  assert.equal(html.match(/<li/g)?.length, 2);
  assert.match(html, /href="\/blueten\/a#eintrag-a"/);
  assert.match(html, />4,2</);
  assert.match(html, /12\.09\.2026/);
  assert.match(html, /<span class="numeric">Charge CH-1<\/span>/);
});

test("Punktlinie ist Dekoration, lange Namen brechen um", () => {
  const html = renderToStaticMarkup(
    createElement(Inhaltsverzeichnis, {
      eintraege: [eintrag("a", "Sehrlangerhandelsnameohneleerzeichenundmitvielenbuchstaben", 4, null)],
      w: de,
      sprache: "de",
    }),
  );
  assert.match(html, /<span aria-hidden="true" class="[^"]*border-dotted/);
  assert.match(html, /wrap-break-word/);
});
