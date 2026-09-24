import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Randspalte } from "@/components/story/Randspalte";
import { StimmzettelSkelett } from "@/components/story/Skelette";
import type { Randnotiz } from "@/lib/query/community";

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
  assert.match(quelle, /\{ text: "Ihr schlagt vor\.", hand: true,/);
  assert.match(quelle, /\{ text: "Ihr stimmt ab\.", hand: true,/);
  assert.match(quelle, /\{ text: "Ich teste\.", hand: false,/);
  assert.match(quelle, /"font-hand text-vermerk text-kopierstift"/);
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
