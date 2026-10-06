import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AromaKarte, KarteSofortKontext } from "@/components/review/AromaKarte";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";
import { MATRIX } from "./hilfen/eintrag";

const quelle = readFileSync(join(process.cwd(), "components/review/AromaKarte.tsx"), "utf8");

const karte = (kompakt: boolean) =>
  renderToStaticMarkup(
    createElement(
      KarteSofortKontext.Provider,
      { value: true },
      createElement(AromaKarte, {
        terpene: [],
        serien: [{ name: "Diese Bewertung", ton: "lila", matrix: MATRIX }],
        texte: aromaTexte(de, "de"),
        kompakt,
      }),
    ),
  );

test("Dicht: Legende und Ansichtsschalter stehen mit der Reiterleiste in einer Zeile", () => {
  const html = karte(true);
  assert.match(html, /<ul class="[^"]*\blg:order-2\b[^"]*\blg:ml-auto\b/);
  assert.doesNotMatch(html, /\blg:basis-full\b/);
  assert.match(html, /<div class="flex flex-wrap items-center justify-end gap-4 lg:order-3">/);
});

test("Nicht dicht: Formular und Startseite behalten ihre Kopfzeile", () => {
  const html = karte(false);
  assert.doesNotMatch(html, /\blg:order-[23]\b|\blg:ml-auto\b|\blg:h-32\b/);
  assert.match(html, /<div class="flex flex-wrap items-center justify-end gap-4">/);
});

test("Dicht: die Infotafel behält ihren festen Platz, ab lg 128 px statt 224 px", () => {
  assert.match(quelle, /"pointer-events-none grid h-56 justify-items-center overflow-hidden"/);
  assert.match(quelle, /"\*:max-h-56 \*:overflow-y-auto"/);
  assert.match(quelle, /kompakt && "lg:h-32 lg:\*:max-h-32"/);
  assert.match(karte(true), /\bh-56\b[^"]*\blg:h-32\b/);
  assert.doesNotMatch(karte(false), /\blg:h-32\b/);
});

test("Dicht: der Inhalt der Infotafel schrumpft auf Name, einen Satz in zwei Zeilen und eine Zeile Pillen", () => {
  assert.match(quelle, /kompakt && "lg:hidden"/);
  assert.match(quelle, /kompakt && "lg:line-clamp-2 lg:text-small"/);
  assert.match(quelle, /kompakt && "lg:max-h-8 lg:overflow-hidden"/);
  assert.equal(quelle.match(/kompakt=\{kompakt\}/g)?.length, 2, "beide Infotafeln bekommen kompakt");
});
