import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Inhaltsverzeichnis } from "@/components/review/Inhaltsverzeichnis";
import type { EintragDaten } from "@/components/review/eintrag";
import { leereGeschmacksMatrix } from "@/lib/query/bewertung";

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
    terpene: [],
    terpenIntensitaet: {},
  };
}

test("je Eintrag eine Zeile mit Sprunglink, Note und Datum", () => {
  const html = renderToStaticMarkup(
    createElement(Inhaltsverzeichnis, {
      eintraege: [eintrag("a", "Nebelharz 22", 4.2, "CH-1"), eintrag("b", "Zitronensegel 18", 3.8, null)],
    }),
  );
  assert.equal(html.match(/<li/g)?.length, 2);
  assert.match(html, /href="\/produkte\/a#eintrag-a"/);
  assert.match(html, />4,2</);
  assert.match(html, /12\.09\.2026/);
  assert.match(html, /Charge <span class="numeric">CH-1<\/span>/);
});

test("Punktlinie ist Dekoration, lange Namen brechen um", () => {
  const html = renderToStaticMarkup(
    createElement(Inhaltsverzeichnis, {
      eintraege: [eintrag("a", "Sehrlangerhandelsnameohneleerzeichenundmitvielenbuchstaben", 4, null)],
    }),
  );
  assert.match(html, /<span aria-hidden="true" class="[^"]*border-dotted/);
  assert.match(html, /wrap-break-word/);
});
