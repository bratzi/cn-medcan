/**
 * Farbrechnung fuer die Token-Pruefung (Spec 4.1).
 *
 * OKLCH -> OKLab -> lineares sRGB nach Bjoern Ottosson. Luminanz und
 * Kontrast nach WCAG 2.2. Reine Funktionen, keine Abhaengigkeit.
 */

/** @returns {[number, number, number]} lineares sRGB, ungeklemmt */
export function oklchZuLinearSrgb(l, c, h) {
  const winkel = (h * Math.PI) / 180;
  const a = c * Math.cos(winkel);
  const b = c * Math.sin(winkel);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;

  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

/** Liegt die Farbe im sRGB-Wuerfel? Toleranz fuer Rundung der Matrix. */
export function imGamut(rgb, toleranz = 1e-4) {
  return rgb.every((kanal) => kanal >= -toleranz && kanal <= 1 + toleranz);
}

/** Relative Luminanz aus linearem sRGB (WCAG). */
export function relativeLuminanz([r, g, b]) {
  const klemme = (x) => Math.min(Math.max(x, 0), 1);
  return 0.2126 * klemme(r) + 0.7152 * klemme(g) + 0.0722 * klemme(b);
}

/** Kontrastverhaeltnis, Reihenfolge egal. */
export function kontrast(luminanzA, luminanzB) {
  const hell = Math.max(luminanzA, luminanzB);
  const dunkel = Math.min(luminanzA, luminanzB);
  return (hell + 0.05) / (dunkel + 0.05);
}

function gamma(x) {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
}

/** Lineares sRGB als Hex, zur Kontrolle gegen die Spec-Tabelle. */
export function linearZuHex(rgb) {
  return (
    "#" +
    rgb
      .map((x) => Math.round(Math.min(Math.max(gamma(x), 0), 1) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

const OKLCH_MUSTER = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/;

/** @returns {[number, number, number] | null} */
export function parseOklch(text) {
  const treffer = OKLCH_MUSTER.exec(text.trim());
  if (!treffer) return null;
  return [Number(treffer[1]), Number(treffer[2]), Number(treffer[3])];
}
