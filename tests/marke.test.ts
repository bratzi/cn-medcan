import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Logo } from "@/components/marke/Logo";
import { Unterzeile, Wortmarke } from "@/components/marke/Wortmarke";

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");
const css = lies("app/globals.css");

test("Kopierstift-Violett: Werte von Sprühviolett, neuer Name (Spec TP3 5)", () => {
  assert.match(css, /--color-violett-400:\s*oklch\(0\.72 0\.15 305\);/);
  assert.match(css, /--color-violett-500:\s*oklch\(0\.52 0\.2 305\);/);
  assert.match(css, /--color-kopierstift:\s*var\(--color-violett-500\);/);
  assert.equal(css.match(/--color-kopierstift:\s*var\(--color-violett-400\);/g)?.length, 3);
  assert.doesNotMatch(css, /--color-spray/);
});

test("Farbprüfung misst Kopierstift auf allen drei Papieren", () => {
  const skript = lies("scripts/farben-pruefen.mjs");
  for (const flaeche of ["surface", "surface-raised", "surface-sunken"]) {
    assert.match(skript, new RegExp(`\\["kopierstift", "${flaeche}", 4\\.5\\]`), flaeche);
  }
  assert.doesNotMatch(skript, /spray/);
});

const HAND_GRADE = ["marke", "umschlag", "notiz", "vermerk", "plakat", "kulisse"] as const;

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

test("Logo im Kopf: Book of klein oben, Terpz im Fokus, Konturen, Verlauf und Glanz", () => {
  const html = renderToStaticMarkup(createElement(Logo, { className: "text-marke" }));
  assert.match(html, /\bfont-hand\b/);
  assert.match(html, /\btext-marke\b/);
  // Zugänglicher Name genau einmal, alles Sichtbare ist Bild.
  assert.match(html, /<span class="sr-only">Book of Terpz<\/span>/);
  const sichtbar = html.replace(/<span class="sr-only">[^<]*<\/span>/, "");
  assert.equal(sichtbar.match(/aria-hidden="true"/g)?.length, 5);
  // Vier Konturen wie im Auftakt, Glanz auf beiden Zeilen des Schriftzugs.
  for (const n of [1, 2, 3, 4]) assert.match(html, new RegExp(`marke-kontur marke-kontur-${n}`));
  assert.equal(html.match(/\bglanz-wort\b/g)?.length, 2);
  // "Book of" kleiner als "Terpz", und zwar oben.
  assert.ok(html.indexOf("Book of", html.indexOf("glanz-wort") - 200) < html.lastIndexOf("Terpz"));
  assert.match(html, /text-\[0\.45em\]/);
  assert.doesNotMatch(html, /font-buch|uppercase|text-accent/);
  assert.match(lies("components/layout/Kopf.tsx"), /<Logo className="text-marke" \/>/);
});

test("Wortmarke als Umschlag: zwei Zeilen, ein zugänglicher Name", () => {
  const html = renderToStaticMarkup(createElement(Wortmarke, { groesse: "umschlag" }));
  assert.equal(html.match(/data-marke-zeile=""/g)?.length, 2);
  assert.match(html, /\btext-umschlag\b/);
  assert.equal(ohneTags(html), "Book of Terpz");
});

test("Wortmarke einzeilig (Fuß): bricht nicht um", () => {
  const html = renderToStaticMarkup(createElement(Wortmarke, { groesse: "umschlag", einzeilig: true }));
  assert.match(html, /\bwhitespace-nowrap\b/);
  assert.equal(html.match(/class="inline-block"/g)?.length, 2);
});

test("Unterzeile: gedruckt, natürliche Schreibung, Versalien per CSS", () => {
  const html = renderToStaticMarkup(createElement(Unterzeile));
  assert.match(html, /^<p /);
  assert.equal(ohneTags(html), "Terpen für Terpen");
  assert.match(html, /\buppercase\b/);
  assert.match(html, /\btracking-gesperrt\b/);
  assert.doesNotMatch(html, /font-hand/);
});

test("Auftakt: die h1 ist die Wortmarke als Plakat, nie per Einstieg versteckt", () => {
  const quelle = lies("components/story/Auftakt.tsx");
  const h1 = /<h1[^>]*>\s*<Wortmarke groesse="plakat" \/>\s*<\/h1>/.exec(quelle)?.[0];
  assert.ok(h1, "die h1 enthält nicht genau die Plakat-Wortmarke");
  assert.match(h1, /className="auftakt-marke /);
  assert.doesNotMatch(h1, /data-story-einstieg/);
  assert.match(quelle, /<Unterzeile className="auftakt-unterzeile/);
  assert.doesNotMatch(quelle, /text-accent|groesse="buehne"/);
});

test("Wortmarke als Plakat: einzeilig, Plakat-Grad, schreibt sich", () => {
  const html = renderToStaticMarkup(createElement(Wortmarke, { groesse: "plakat" }));
  assert.equal(html.match(/data-marke-zeile=""/g)?.length, 2);
  assert.match(html, /\btext-plakat\b/);
  assert.match(html, /\bwhitespace-nowrap\b/);
  assert.equal(ohneTags(html), "Book of Terpz");
});

test("Fuß: die Wortmarke liegt im Fuß hinter dem Inhalt, kein Tag, kein zweiter Name", () => {
  const fuss = lies("components/layout/Fuss.tsx");
  assert.match(
    fuss,
    /<span aria-hidden="true" data-story="fuss-marke" className="fuss-marke [^"]*absolute[^"]*-z-10[^"]*">\s*<Wortmarke groesse="plakat" \/>\s*<\/span>/,
  );
  assert.equal(fuss.match(/<Wortmarke /g)?.length, 1);
  assert.doesNotMatch(fuss, /fuss-tag|font-wand|>\s*gb\s*</);
  assert.match(css, /\.fuss-marke\s*\{[^}]*translate:\s*0 0\.08em/);
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
        /font-wand|sedgwick|spray|(?<!Canvas)textur|text-tag\b|text-auftakt|text-wortmarke|gb-/i.test(zeile)
          ? [`${pfad}:${index + 1}: ${zeile.trim()}`]
          : [],
      ),
  );
  assert.deepEqual(treffer, []);
});

test("Handschrift nur in den Handschrift-Graden: nie unter 32 px (Spec TP3 15.3)", () => {
  const GRAD = /text-(marke|umschlag|notiz|vermerk|plakat|kulisse|manifest|erzaehlung)\b/;
  // Wortmarke und Logo bekommen ihren Grad vom Aufrufer; "Book of" im Logo ist als Teil
  // des Zeichens bewusst kleiner (Nutzer 2026-09-26).
  const eigenerGrad = [join("marke", "Wortmarke.tsx"), join("marke", "Logo.tsx")];
  const treffer = QUELLEN.filter((pfad) => /\.tsx?$/.test(pfad) && !eigenerGrad.some((datei) => pfad.endsWith(datei)))
    .flatMap((pfad) =>
      readFileSync(pfad, "utf8")
        .split("\n")
        .flatMap((zeile, index) => (zeile.includes("font-hand") && !GRAD.test(zeile) ? [`${pfad}:${index + 1}`] : [])),
    );
  assert.deepEqual(treffer, []);
});
