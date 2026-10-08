import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Feld } from "@/components/kapitel/Feld";
import { FeldSkelett } from "@/components/kapitel/FeldSkelett";
import { Kapitelkopf } from "@/components/kapitel/Kapitelkopf";
import { KapitelRaster } from "@/components/kapitel/KapitelRaster";
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

test("KapitelRaster: Feldbuch-Raster dahinter, 4 und 10 Spalten", () => {
  const h = html(createElement(KapitelRaster, null, "x"));
  assert.match(h, /feldbuch-raster/);
  assert.match(h, /grid-cols-4/);
  assert.match(h, /min-\[1080px\]:grid-cols-10/);
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

test("Kapitelkopf: Name als h1 gedruckt, bricht um, Schlagwort aria-hidden", () => {
  const h = html(
    createElement(Kapitelkopf, {
      name: "A".repeat(60),
      avatarId: null,
      seite: "Profil",
      schlagwort: "dein Geschmack",
      ton: "gruen",
    }),
  );
  assert.match(h, /<h1[^>]*kapitel-name[^>]*>A{60}<\/h1>/);
  assert.match(h, /wrap-break-word/);
  assert.match(h, /font-buch/);
  assert.match(h, /aria-hidden="true"[^>]*>dein Geschmack</);
  // Der Seitenname steht gedruckt im Kopf (keine Reiter mehr, Nutzer 2026-10-09).
  assert.match(h, /text-h2[^"]*">Profil</);
});

