import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Logo } from "@/components/marke/Logo";
import { Unterzeile } from "@/components/marke/Wortmarke";

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

test("Handschrift: Pinselschrift Mr Dafoe mit Rückfall, nur 400, keine synthetischen Schnitte (Nutzer 2026-10-07)", () => {
  assert.match(css, /--font-hand:\s*var\(--font-pinsel\),[^;]*cursive;/);
  for (const name of HAND_GRADE) {
    assert.match(css, new RegExp(String.raw`--text-${name}--font-weight:\s*400;`), name);
  }
  assert.match(css, /\.font-hand\s*\{[^}]*font-synthesis:\s*none/);
  const layout = lies("app/[lang]/layout.tsx");
  assert.match(layout, /Mr_Dafoe\(\{[\s\S]*?variable: "--font-pinsel"[\s\S]*?weight: "400"[\s\S]*?adjustFontFallback: true/);
  assert.doesNotMatch(layout, /Inspiration/);
});

test("Handschrift wie das Logo: Blattgrün, keine Verläufe Grün-Lila mehr", () => {
  assert.match(css, /\.farbverlauf\s*\{[^}]*color:\s*var\(--color-accent\);[^}]*\}/);
  assert.doesNotMatch(/\.farbverlauf\s*\{[^}]*\}/.exec(css)?.[0] ?? "", /gradient/);
  // Der Schriftverlauf Grün-Lila-Grün (55 %) ist weg; Linien und Balken dürfen weiter verlaufen.
  assert.doesNotMatch(css, /var\(--color-kopierstift\) 55%, var\(--color-accent\)/);
});

const ohneTags = (html: string) => html.replace(/<[^>]+>/g, "");

test("Logo: Pinselschrift aus zwei Masken, Farben aus Tokens, ein Bild mit Namen (Nutzer 2026-10-07)", () => {
  const html = renderToStaticMarkup(createElement(Logo, { className: "w-18" }));
  assert.match(html, /^<span role="img" aria-label="Book of Terpz" class="marke-pinsel w-18"><\/span>$/);
  // Schrift in accent, "of" in kopierstift; Formen als Masken, nie Primitives oder Hex.
  // Die letzte Regel je Pseudo-Element: die erste ist die gemeinsame für ::before und ::after.
  const regel = (sel: string) => [...css.matchAll(new RegExp(String.raw`\.marke-pinsel::${sel}\s*\{[^}]*\}`, "g"))].at(-1)?.[0] ?? "";
  assert.match(regel("before"), /marke\/pinsel\.webp/);
  assert.match(regel("before"), /background:\s*var\(--color-accent\)/);
  assert.match(regel("after"), /marke\/pinsel-of\.webp/);
  assert.match(regel("after"), /background:\s*var\(--color-kopierstift\)/);
  for (const datei of ["public/marke/pinsel.webp", "public/marke/pinsel-of.webp"]) assert.ok(statSync(datei).size > 0, datei);
  assert.match(lies("components/layout/Kopf.tsx"), /<Logo className="w-18" \/>/);
});

test("Logo durchsichtig: nur Tönung, kein Glaseffekt, kein zusätzliches Element; Kopf bleibt deckend", () => {
  const html = renderToStaticMarkup(createElement(Logo, { durchsichtig: true, className: "w-10" }));
  assert.equal(html, '<span role="img" aria-label="Book of Terpz" class="marke-pinsel marke-durchsichtig w-10"></span>');
  assert.match(css, /\.marke-durchsichtig::before\s*\{[^}]*color-mix\(in oklab, var\(--color-accent\) 72%, transparent\)/);
  assert.match(css, /\.marke-durchsichtig::after\s*\{[^}]*color-mix\(in oklab, var\(--color-kopierstift\) 76%, transparent\)/);
  assert.doesNotMatch(css, /marke-glas|pinsel-licht|pinsel-schatten/);
  assert.doesNotMatch(lies("components/layout/Kopf.tsx"), /<Logo durchsichtig/);
});

test("Unterzeile: gedruckt, natürliche Schreibung, Versalien per CSS", () => {
  const html = renderToStaticMarkup(createElement(Unterzeile));
  assert.match(html, /^<p /);
  assert.equal(ohneTags(html), "Terpen für Terpen");
  assert.match(html, /\buppercase\b/);
  assert.match(html, /\btracking-gesperrt\b/);
  assert.doesNotMatch(html, /font-hand/);
});

test("Auftakt: die h1 ist das Logo, durchsichtig, schreibt sich, nie per Einstieg versteckt", () => {
  const quelle = lies("components/story/Auftakt.tsx");
  const h1 = /<h1[^>]*>\s*<Logo durchsichtig className="[^"]+" \/>\s*<\/h1>/.exec(quelle)?.[0];
  assert.ok(h1, "die h1 enthält nicht genau das Logo");
  assert.match(h1, /className="auftakt-marke /);
  assert.doesNotMatch(h1, /data-story-einstieg/);
  assert.match(quelle, /<Unterzeile className="auftakt-unterzeile/);
  assert.doesNotMatch(quelle, /text-accent|groesse="buehne"|<Wortmarke/);
});

test("Fuß: das Logo liegt im Fuß hinter dem Inhalt, kein Tag, kein zweiter Name", () => {
  const fuss = lies("components/layout/Fuss.tsx");
  assert.match(
    fuss,
    /<span aria-hidden="true" data-story="fuss-marke" className="fuss-marke [^"]*absolute[^"]*-z-10[^"]*">\s*<Logo className="[^"]+" \/>\s*<\/span>/,
  );
  assert.equal(fuss.match(/<Logo /g)?.length, 1);
  assert.doesNotMatch(fuss, /fuss-tag|font-wand|>\s*gb\s*<|<Wortmarke/);
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

test("Plakatschrift skaliert auf Telefonen mit, statt an der Untergrenze zu kleben (Nutzer 2026-10-03)", () => {
  // Bei 360 px Breite muss die Wortmarke samt Seitenrand in die Zeile passen.
  const treffer = css.match(/--text-plakat:\s*clamp\((\d+(?:\.\d+)?)rem,/);
  assert.ok(treffer, "clamp für --text-plakat gefunden");
  assert.ok(Number(treffer![1]) <= 4, `Untergrenze ${treffer![1]}rem ist für 360 px zu groß`);
});

test("Der Hero hält mobil Abstand zum Displayrand", () => {
  const auftakt = lies("components/story/Auftakt.tsx");
  assert.doesNotMatch(auftakt, /flex-\[2\] flex-col items-center justify-center gap-4 px-4 /);
  assert.match(auftakt, /px-6 /);
});
