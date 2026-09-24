/**
 * Prueft app/globals.css gegen die Farbtabellen der Spec 4.1.
 *
 *   npm run farben
 *
 * Bricht mit Exit 1 ab, wenn ein Grundwert abweicht, ausserhalb von sRGB
 * liegt, eine Rolle auf die falsche Grundfarbe zeigt, die beiden
 * Dunkel-Bloecke auseinanderlaufen oder ein Paar den Mindestkontrast
 * unterschreitet. Wer hier eine Tabelle aendert, aendert die Spec mit.
 */
import { readFileSync } from "node:fs";

import { imGamut, kontrast, oklchZuLinearSrgb, parseOklch, relativeLuminanz } from "./farben/oklch.mjs";

const GRUNDFARBEN = {
  "neutral-0": "0.99 0.003 165",
  "neutral-50": "0.965 0.004 165",
  "neutral-100": "0.935 0.006 165",
  "neutral-150": "0.905 0.007 165",
  "neutral-200": "0.86 0.008 165",
  "neutral-400": "0.615 0.012 165",
  "neutral-500": "0.52 0.012 165",
  "neutral-600": "0.47 0.012 165",
  "neutral-800": "0.3 0.011 165",
  "neutral-900": "0.2 0.009 165",
  "neutral-950": "0.165 0.008 165",
  "neutral-1000": "0.13 0.007 165",
  "blatt-100": "0.9 0.035 170",
  "blatt-400": "0.74 0.12 170",
  "blatt-500": "0.6 0.115 170",
  "blatt-600": "0.5 0.096 170",
  "blatt-700": "0.42 0.081 170",
  "blatt-900": "0.3 0.05 170",
  "spray-400": "0.72 0.15 305",
  "spray-500": "0.52 0.2 305",
  "danger-400": "0.7 0.15 25",
  "danger-500": "0.52 0.18 25",
  "warning-400": "0.8 0.13 80",
  "warning-500": "0.62 0.13 75",
  "success-400": "0.74 0.14 140",
  "success-500": "0.5 0.12 140",
};

/** Rolle -> [hell, dunkel] */
const ROLLEN = {
  surface: ["neutral-100", "neutral-950"],
  "surface-raised": ["neutral-50", "neutral-900"],
  "surface-sunken": ["neutral-150", "neutral-1000"],
  border: ["neutral-200", "neutral-800"],
  "border-strong": ["neutral-400", "neutral-500"],
  text: ["neutral-900", "neutral-50"],
  "text-muted": ["neutral-600", "neutral-400"],
  accent: ["blatt-600", "blatt-400"],
  "accent-hover": ["blatt-700", "blatt-500"],
  "accent-fg": ["neutral-0", "neutral-1000"],
  "accent-subtle": ["blatt-100", "blatt-900"],
  spray: ["spray-500", "spray-400"],
  "spray-fg": ["neutral-0", "neutral-1000"],
  "focus-ring": ["blatt-600", "blatt-400"],
  danger: ["danger-500", "danger-400"],
  success: ["success-500", "success-400"],
  warning: ["warning-500", "warning-400"],
  "danger-fg": ["neutral-0", "neutral-1000"],
  "success-fg": ["neutral-0", "neutral-1000"],
  "warning-fg": ["neutral-1000", "neutral-1000"],
};

/** [Vordergrund, Hintergrund, Mindestwert] */
const PAARE = [
  ["text", "surface", 4.5],
  ["text", "surface-raised", 4.5],
  ["text-muted", "surface", 4.5],
  ["text-muted", "surface-raised", 4.5],
  ["text-muted", "surface-sunken", 4.5],
  ["accent", "surface", 4.5],
  ["accent", "surface-raised", 4.5],
  ["accent-fg", "accent", 4.5],
  ["accent-fg", "accent-hover", 4.5],
  ["focus-ring", "surface", 3],
  ["border-strong", "surface", 3],
  ["border-strong", "surface-raised", 3],
  ["spray", "surface", 4.5],
  ["spray-fg", "spray", 4.5],
  ["danger", "surface", 4.5],
  ["danger-fg", "danger", 4.5],
  ["success", "surface", 4.5],
  ["success-fg", "success", 4.5],
  ["warning", "surface", 3],
  ["warning-fg", "warning", 4.5],
  ["text", "accent-subtle", 4.5],
  // Badges: 13-px-Text auf ihrer Flaeche (components/ui/Badge.tsx).
  ["success", "surface-raised", 4.5],
  ["danger", "surface-raised", 4.5],
  // warning- und accent-Badge: Text in Tinte (text/surface-raised, text/accent-subtle oben);
  // den Zustand tragen Rahmen, Flaeche und Marker. warning/accent erreichen 4.5 hell nicht.
];

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const fehler = [];

/** Inhalt des Blocks, der auf `selektor {` folgt, mit Klammerzaehlung. */
function block(selektor) {
  const start = css.indexOf(selektor);
  if (start === -1) return null;
  const auf = css.indexOf("{", start);
  let tiefe = 0;
  for (let i = auf; i < css.length; i++) {
    if (css[i] === "{") tiefe++;
    if (css[i] === "}") tiefe--;
    if (tiefe === 0) return css.slice(auf + 1, i);
  }
  return null;
}

function variablen(text) {
  const werte = new Map();
  for (const [, name, wert] of text.matchAll(/--color-([\w-]+):\s*([^;]+);/g)) werte.set(name, wert.trim());
  return werte;
}

const theme = block("@theme");
const dunkelMedia = block(':root:not([data-theme="light"])');
const dunkelAttribut = block(':root[data-theme="dark"]');
if (!theme || !dunkelMedia || !dunkelAttribut) {
  console.error("globals.css: @theme oder einer der beiden Dunkel-Bloecke fehlt.");
  process.exit(1);
}
const hell = variablen(theme);
const dunkelA = variablen(dunkelMedia);
const dunkelB = variablen(dunkelAttribut);

const linear = new Map();
for (const [name, soll] of Object.entries(GRUNDFARBEN)) {
  const [l, c, h] = soll.split(" ").map(Number);
  const ist = hell.get(name);
  const gelesen = ist ? parseOklch(ist) : null;
  if (!gelesen) fehler.push(`Grundfarbe ${name} fehlt oder ist kein oklch(): ${ist ?? "nicht gefunden"}`);
  else if (gelesen.some((wert, i) => Math.abs(wert - [l, c, h][i]) > 1e-9))
    fehler.push(`Grundfarbe ${name}: ${ist}, Spec: oklch(${soll})`);
  const rgb = oklchZuLinearSrgb(l, c, h);
  if (!imGamut(rgb)) fehler.push(`Grundfarbe ${name} liegt ausserhalb von sRGB`);
  linear.set(name, rgb);
}

function zeigtAuf(werte, rolle) {
  const treffer = /^var\(--color-([\w-]+)\)$/.exec(werte.get(rolle) ?? "");
  return treffer ? treffer[1] : null;
}

for (const [rolle, [sollHell, sollDunkel]] of Object.entries(ROLLEN)) {
  if (zeigtAuf(hell, rolle) !== sollHell) fehler.push(`hell: --color-${rolle} soll auf ${sollHell} zeigen, ist ${hell.get(rolle) ?? "nicht gesetzt"}`);
  for (const [name, werte] of [["dunkel (Media)", dunkelA], ["dunkel (data-theme)", dunkelB]]) {
    if (zeigtAuf(werte, rolle) !== sollDunkel) fehler.push(`${name}: --color-${rolle} soll auf ${sollDunkel} zeigen, ist ${werte.get(rolle) ?? "nicht gesetzt"}`);
  }
}

const zeilen = [];
for (const [vorne, hinten, minimum] of PAARE) {
  for (const [modus, index] of [["hell", 0], ["dunkel", 1]]) {
    const a = relativeLuminanz(linear.get(ROLLEN[vorne][index]));
    const b = relativeLuminanz(linear.get(ROLLEN[hinten][index]));
    const wert = kontrast(a, b);
    zeilen.push(`${`${vorne} / ${hinten}`.padEnd(34)} ${modus.padEnd(7)} ${wert.toFixed(2).padStart(6)}  (min ${minimum})`);
    if (wert < minimum) fehler.push(`${modus}: ${vorne} auf ${hinten} = ${wert.toFixed(2)}, verlangt ${minimum}`);
  }
}

console.log(zeilen.join("\n"));
if (fehler.length > 0) {
  console.error(`\n${fehler.length} Verstoss/Verstoesse:\n- ${fehler.join("\n- ")}`);
  process.exit(1);
}
console.log("\nFarben in Ordnung: Grundwerte, Gamut, Rollen hell/dunkel, Kontraste.");
