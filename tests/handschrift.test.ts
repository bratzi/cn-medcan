import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Randspalte } from "@/components/story/Randspalte";
import { StimmzettelSkelett } from "@/components/story/Skelette";
import { Kandidat, type KandidatProps } from "@/components/umfrage/Kandidat";
import type { Randnotiz } from "@/lib/query/community";
import type { UmfrageOptionAnsicht } from "@/lib/query/umfragen";

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");

function randspalte(...notizen: Randnotiz[]): string {
  return renderToStaticMarkup(createElement(Randspalte, { notizen }));
}

test("Randnotiz mit Zahl: Zahl gedruckt, Wort von Hand, vorgelesen als ein Satz", () => {
  const html = randspalte({ zahl: 1284, wort: "Stimmen" });
  assert.match(html, /<span class="sr-only">1\.284 Stimmen<\/span>/);
  assert.match(
    html,
    /<span aria-hidden="true" data-randzahl="" data-ziel="1284" class="numeric text-display text-text">1\.284<\/span>/,
  );
  assert.match(
    html,
    /<span aria-hidden="true" data-story="randnotiz" class="font-hand text-notiz text-kopierstift">Stimmen<\/span>/,
  );
});

test("Leitsatz: nur Handschrift, ohne Zahl, nichts versteckt", () => {
  const html = randspalte({ zahl: null, wort: "Schlag vor." });
  assert.match(
    html,
    /<span data-story="randnotiz" class="inline-block font-hand text-notiz text-kopierstift">Schlag vor\.<\/span>/,
  );
  assert.doesNotMatch(html, /aria-hidden|data-randzahl|sr-only/);
});

test("Große Zahlen brechen um statt überzulaufen", () => {
  const html = randspalte({ zahl: 1234567, wort: "Stimmen" });
  assert.match(html, /1\.234\.567/);
  assert.match(html, /<li class="flex min-w-0 flex-wrap /);
});

test("Wissen bündeln: Randspalte ab lg, kein Schwenk, keine Wand", () => {
  const quelle = lies("components/story/WissenBuendeln.tsx");
  assert.match(quelle, /lg:grid-cols-\[minmax\(0,2fr\)_minmax\(0,1fr\)\]/);
  assert.match(quelle, /<Suspense fallback=\{<RandspaltenSkelett \/>\}>/);
  assert.doesNotMatch(quelle, /bg-surface-sunken|Textur|wand|font-wand/);
});

test("Schleife: die Community schreibt von Hand, das Buch druckt", () => {
  const quelle = lies("components/story/GemeinsamLernen.tsx");
  assert.match(quelle, /\{ text: "Ihr schlagt vor\.", hand: true }/);
  assert.match(quelle, /\{ text: "Ihr stimmt ab\.", hand: true }/);
  assert.match(quelle, /\{ text: "Ich teste\.", hand: false }/);
  assert.match(quelle, /"font-hand text-notiz text-kopierstift"/);
  assert.doesNotMatch(quelle, /font-wand|wand:|Sedgwick/);
});

test("Abstimmung: „Wähl mit.“ von Hand, ohne Wasserzeichen und Drip", () => {
  const quelle = lies("components/story/Abstimmung.tsx");
  assert.match(quelle, /<p data-story="waehl-mit" className="font-hand text-notiz text-kopierstift">\s*Wähl mit\.\s*<\/p>/);
  assert.doesNotMatch(quelle, /wasserzeichen|Textur|font-wand|rotate/);
  assert.match(lies("components/story/bewegung/abstimmung.ts"), /SCHREIBEN_AB/);
});

test("Skelett des Stimmzettels hat die Form des Stimmzettels", () => {
  const html = renderToStaticMarkup(createElement(StimmzettelSkelett));
  assert.match(html, /role="status"/);
  assert.match(html, /data-skelett=""/);
  assert.match(html, /border border-border-strong bg-surface-raised shadow-md/);
  assert.ok((html.match(/bg-surface-sunken/g)?.length ?? 0) >= 4);
});

function option(teil: Partial<UmfrageOptionAnsicht> = {}): UmfrageOptionAnsicht {
  return {
    id: "o1",
    strainId: "s1",
    handelsname: "Nebelharz 22 (fiktiv)",
    slug: "nebelharz-22",
    reihenfolge: 1,
    herkunft: "COMMUNITY",
    istGewinner: false,
    stimmen: 3,
    ergebnisReviewId: null,
    ...teil,
  };
}

function kandidat(teil: Partial<KandidatProps> = {}): string {
  const props: KandidatProps = { option: option(), gesamt: 5, gewaehlt: false, zeigeStimmen: true, ...teil };
  return renderToStaticMarkup(createElement("ul", null, createElement(Kandidat, props)));
}

test("Community-Platz: Vermerk „von euch“ von Hand, der Name gedruckt", () => {
  const html = kandidat();
  assert.match(html, /<span data-story="vermerk" class="font-hand text-vermerk text-kopierstift">von euch<\/span>/);
  assert.doesNotMatch(html, /class="stempel"/);
  const name = /<a [^>]*>Nebelharz 22 \(fiktiv\)<\/a>/.exec(html)?.[0] ?? "";
  assert.match(name, /\bfont-buch\b/);
  assert.doesNotMatch(name, /font-hand/);
});

test("Gesetzter Platz: Stempel, kein Vermerk, keine Handschrift", () => {
  const html = kandidat({ option: option({ herkunft: "GESETZT", stimmen: null }) });
  assert.match(html, /class="stempel"/);
  assert.doesNotMatch(html, /von euch|font-hand/);
});

test("Eigene Stimme: handgeschriebenes x vor dem Namen, nur als Bild, dazu das Badge", () => {
  const html = kandidat({ gewaehlt: true });
  assert.match(
    html,
    /<span aria-hidden="true" data-story="vermerk" class="font-hand text-vermerk text-kopierstift">x<\/span><a /,
  );
  assert.match(html, /Deine Stimme/);
});

test("Ohne eigene Stimme kein x", () => {
  assert.doesNotMatch(kandidat({ gewaehlt: false }), />x</);
});

test("Das x hängt an derselben Bedingung wie die Zähler: nie in der Vorschlagsphase", () => {
  assert.match(
    lies("components/umfrage/UmfrageKarte.tsx"),
    /const gewaehlteOption = zeigeStimmen && zustand\.art === "ABGESTIMMT" \? zustand\.optionId : null;/,
  );
});

test("/umfragen: Community-Überschriften von Hand, ohne Nebel und ohne Drehung", () => {
  const quelle = lies("app/umfragen/page.tsx");
  assert.match(quelle, /const HAND_TITEL = "font-hand text-notiz text-kopierstift";/);
  assert.equal(quelle.match(/className=\{cn\(HAND_TITEL, "self-start"\)\}/g)?.length, 2);
  assert.doesNotMatch(quelle, /Textur|font-wand|WAND_TITEL|rotate/);
});
