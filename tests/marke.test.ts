import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
