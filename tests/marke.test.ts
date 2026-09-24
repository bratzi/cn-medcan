import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Unterzeile, Wortmarke } from "@/components/marke/Wortmarke";

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");
const css = lies("app/globals.css");

test("Kopierstift-Violett: Werte von Sprühviolett, neuer Name (Spec TP3 5)", () => {
  assert.match(css, /--color-violett-400:\s*oklch\(0\.72 0\.15 305\);/);
  assert.match(css, /--color-violett-500:\s*oklch\(0\.52 0\.2 305\);/);
  assert.match(css, /--color-kopierstift:\s*var\(--color-violett-500\);/);
  assert.equal(css.match(/--color-kopierstift:\s*var\(--color-violett-400\);/g)?.length, 2);
  assert.doesNotMatch(css, /--color-spray/);
});

test("Farbprüfung misst Kopierstift auf allen drei Papieren", () => {
  const skript = lies("scripts/farben-pruefen.mjs");
  for (const flaeche of ["surface", "surface-raised", "surface-sunken"]) {
    assert.match(skript, new RegExp(`\\["kopierstift", "${flaeche}", 4\\.5\\]`), flaeche);
  }
  assert.doesNotMatch(skript, /spray/);
});

const HAND_GRADE = ["marke", "umschlag", "notiz", "vermerk"] as const;

function token(name: string): string {
  const treffer = new RegExp(`--text-${name}:\\s*([^;]+);`).exec(css);
  assert.ok(treffer, `--text-${name} fehlt`);
  return treffer[1].trim();
}

/** Kleinster Wert eines Grads in rem: fester Wert oder erstes Argument von clamp(). */
function mindestRem(wert: string): number {
  const treffer = /^(?:clamp\()?\s*([\d.]+)rem/.exec(wert);
  assert.ok(treffer, `kein rem-Wert: ${wert}`);
  return Number(treffer[1]);
}

test("Handschrift-Grade nie unter 32 px (Spec TP3 4)", () => {
  for (const name of HAND_GRADE) assert.ok(mindestRem(token(name)) >= 2, `${name}: ${token(name)}`);
  assert.equal(token("marke"), "2.5rem");
  assert.equal(token("umschlag"), "clamp(5rem, 1rem + 17vw, 20rem)");
  assert.equal(token("notiz"), "clamp(2rem, 1.25rem + 3vw, 4.5rem)");
  assert.equal(token("vermerk"), "2rem");
});

test("Handschrift: Inspiration mit Rückfall, nur 400, keine synthetischen Schnitte", () => {
  assert.match(css, /--font-hand:\s*var\(--font-inspiration\),[^;]*cursive;/);
  for (const name of HAND_GRADE) {
    assert.match(css, new RegExp(`--text-${name}--font-weight:\\s*400;`), name);
  }
  assert.match(css, /\.font-hand\s*\{[^}]*font-synthesis:\s*none/);
  assert.match(
    lies("app/layout.tsx"),
    /Inspiration\(\{[\s\S]*?variable: "--font-inspiration"[\s\S]*?weight: "400"[\s\S]*?adjustFontFallback: true/,
  );
});

const ohneTags = (html: string) => html.replace(/<[^>]+>/g, "");

test("Wortmarke im Kopf: Handschrift in Kopierstift, echter Text", () => {
  const html = renderToStaticMarkup(createElement(Wortmarke, { groesse: "kopf" }));
  assert.match(html, /\bfont-hand\b/);
  assert.match(html, /\btext-marke\b/);
  assert.match(html, /\btext-kopierstift\b/);
  assert.equal(ohneTags(html), "Grünes Buch");
  assert.doesNotMatch(html, /font-buch|aria-hidden|uppercase|text-accent|gb/);
});

test("Wortmarke als Umschlag: zwei Zeilen, ein zugänglicher Name", () => {
  const html = renderToStaticMarkup(createElement(Wortmarke, { groesse: "umschlag" }));
  assert.equal(html.match(/data-marke-zeile=""/g)?.length, 2);
  assert.match(html, /\btext-umschlag\b/);
  assert.equal(ohneTags(html), "Grünes Buch");
});

test("Wortmarke einzeilig (Fuß): bricht nicht um", () => {
  const html = renderToStaticMarkup(createElement(Wortmarke, { groesse: "umschlag", einzeilig: true }));
  assert.match(html, /\bwhitespace-nowrap\b/);
  assert.equal(html.match(/class="inline-block"/g)?.length, 2);
});

test("Unterzeile: gedruckt, natürliche Schreibung, Versalien per CSS", () => {
  const html = renderToStaticMarkup(createElement(Unterzeile));
  assert.match(html, /^<p /);
  assert.equal(ohneTags(html), "Charge für Charge");
  assert.match(html, /\buppercase\b/);
  assert.match(html, /\btracking-gesperrt\b/);
  assert.doesNotMatch(html, /font-hand/);
});

test("Auftakt: h1 ist der grüne Serif-Titel, die Wortmarke signiert darunter, nie per Einstieg versteckt", () => {
  const quelle = lies("components/story/Auftakt.tsx");
  const h1 = /<h1[\s\S]*?<\/h1>/.exec(quelle)?.[0];
  assert.ok(h1, "keine h1 im Auftakt");
  assert.match(h1, /font-buch text-riesig text-accent/);
  assert.doesNotMatch(h1, /data-story-einstieg|Wortmarke/);
  assert.match(quelle, /<div aria-hidden="true" className="auftakt-marke [^"]*">\s*<Wortmarke groesse="signatur" \/>/);
  assert.match(quelle, /<Unterzeile className="auftakt-unterzeile /);
  assert.doesNotMatch(quelle, /uppercase|groesse="buehne"/);
});

test("Wortmarke als Signatur: einzeilig, Notiz-Grad, schreibt sich", () => {
  const html = renderToStaticMarkup(createElement(Wortmarke, { groesse: "signatur" }));
  assert.equal(html.match(/data-marke-zeile=""/g)?.length, 2);
  assert.match(html, /\btext-notiz\b/);
  assert.doesNotMatch(html, /text-umschlag/);
  assert.equal(ohneTags(html), "Grünes Buch");
});

test("Fuß: die Wortmarke läuft angeschnitten aus, kein Tag, kein zweiter Name", () => {
  const fuss = lies("components/layout/Fuss.tsx");
  assert.match(
    fuss,
    /<span aria-hidden="true" data-story="fuss-marke" className="fuss-marke block select-none text-umschlag">\s*<Wortmarke groesse="umschlag" einzeilig \/>\s*<\/span>/,
  );
  assert.equal(fuss.match(/<Wortmarke /g)?.length, 1);
  assert.doesNotMatch(fuss, /fuss-tag|font-wand|>\s*gb\s*</);
  assert.match(css, /\.fuss-marke\s*\{[^}]*margin-bottom:\s*-0\.35em/);
  assert.doesNotMatch(css, /\.fuss-tag/);
  assert.match(lies("components/story/bewegung/schluss.ts"), /data-story="fuss-marke"/);
});

function quellen(ordner: string): string[] {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    if (statSync(pfad).isDirectory()) return name === "generated" ? [] : quellen(pfad);
    return /\.(ts|tsx|css)$/.test(name) ? [pfad] : [];
  });
}

const QUELLEN = ["app", "components", "lib"].flatMap(quellen);

test("keine Reste von Wand und Graffiti in app, components, lib (Spec TP3 15.2)", () => {
  const treffer = QUELLEN.flatMap((pfad) =>
    readFileSync(pfad, "utf8")
      .split("\n")
      .flatMap((zeile, index) =>
        /font-wand|sedgwick|spray|textur|text-tag\b|text-auftakt|text-wortmarke|gb-/i.test(zeile)
          ? [`${pfad}:${index + 1}: ${zeile.trim()}`]
          : [],
      ),
  );
  assert.deepEqual(treffer, []);
});

test("Handschrift nur in den Handschrift-Graden: nie unter 32 px (Spec TP3 15.3)", () => {
  const GRAD = /text-(marke|umschlag|notiz|vermerk)\b/;
  const treffer = QUELLEN.filter((pfad) => /\.tsx?$/.test(pfad) && !pfad.endsWith(join("marke", "Wortmarke.tsx")))
    .flatMap((pfad) =>
      readFileSync(pfad, "utf8")
        .split("\n")
        .flatMap((zeile, index) => (zeile.includes("font-hand") && !GRAD.test(zeile) ? [`${pfad}:${index + 1}`] : [])),
    );
  assert.deepEqual(treffer, []);
});
