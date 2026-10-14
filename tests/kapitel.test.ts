import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Feld } from "@/components/kapitel/Feld";
import { FeldSkelett } from "@/components/kapitel/FeldSkelett";
import { Randnotizen } from "@/components/kapitel/Randnotizen";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

test("Feld: Abschnitt mit Titel, data-feld und Spaltenklasse ab 1080 px", () => {
  const h = html(createElement(Feld, { id: "netz", titel: "Deine Aromen", satz: "Ein Satz.", spalten: 6 }, "Inhalt"));
  assert.match(h, /<section[^>]*data-feld/);
  assert.match(h, /aria-labelledby="netz-titel"/);
  assert.match(h, /<h2 id="netz-titel"[^>]*>Deine Aromen<\/h2>/);
  assert.match(h, /min-\[1080px\]:col-span-6/);
  assert.match(h, /col-span-4/);
  assert.doesNotMatch(h, /shadow/);
});

test("Feld als Stimmzettel trägt den Ebenenschatten", () => {
  assert.match(html(createElement(Feld, { id: "u", titel: "U", spalten: 6, stimmzettel: true }, "x")), /shadow-md/);
});

test("FeldSkelett: gleiche Spalten, aria-hidden", () => {
  const h = html(createElement(FeldSkelett, { spalten: 4, hoehe: "gross" }));
  assert.match(h, /aria-hidden="true"/);
  assert.match(h, /min-\[1080px\]:col-span-4/);
});

test("Randnotizen: Zahl gedruckt, Wort von Hand, Satz für Screenreader, gestaffelt", () => {
  const h = html(
    createElement(Randnotizen, {
      beschriftung: "Deine Zahlen",
      notizen: [
        { zahl: "12", wort: "bewertet", satz: "12 Bewertungen" },
        { zahl: "3,9", wort: "im Schnitt", satz: "Im Schnitt 3,9 von 5" },
      ],
    }),
  );
  assert.match(h, /aria-label="Deine Zahlen"/);
  assert.match(h, /class="sr-only">12 Bewertungen</);
  assert.match(h, /numeric[^"]*text-display/);
  assert.match(h, /font-hand text-notiz/);
  assert.match(h, /--i:1/);
});

test("Randnotiz-Wort schrumpft mit der Spalte statt mitten im Wort zu trennen (live 2026-10-13)", () => {
  const h = renderToStaticMarkup(
    createElement(Randnotizen, { notizen: [{ zahl: "5", wort: "Hersteller", satz: "5 Hersteller" }], beschriftung: "Zahlen" }),
  );
  assert.match(h, /<li[^>]*@container/);
  assert.match(readFileSync("app/globals.css", "utf8"), /\.kapitel-notiz-wort\s*\{\s*font-size:\s*min\(var\(--text-notiz\),\s*\d+cqi\)/);
});
