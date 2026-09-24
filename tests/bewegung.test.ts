import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

test("Einstieg wird nur mit Skript und erlaubter Bewegung ausgeblendet, mit Notfall", () => {
  const block = /@media \(scripting: enabled\) and \(prefers-reduced-motion: no-preference\)\s*\{([\s\S]*?)\n\}/.exec(css);
  assert.ok(block, "Block @media (scripting: enabled) and (prefers-reduced-motion: no-preference) fehlt");
  assert.match(block[1], /\[data-story-einstieg\]\s*\{[^}]*opacity:\s*0/);
  assert.match(block[1], /animation:\s*einstieg-notfall\s+0s\s+linear\s+2\.5s\s+forwards/);
  assert.match(css, /@keyframes einstieg-notfall\s*\{\s*to\s*\{\s*opacity:\s*1;?\s*\}\s*\}/);
});

function dateien(ordner: string): string[] {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    if (statSync(pfad).isDirectory()) return name === "generated" ? [] : dateien(pfad);
    return /\.(ts|tsx)$/.test(name) ? [pfad] : [];
  });
}

test("gsap und lenis werden nur in components/story/bewegung importiert", () => {
  const erlaubt = join("components", "story", "bewegung");
  const verstoesse = ["app", "components", "lib"]
    .flatMap(dateien)
    .filter((pfad) => !pfad.startsWith(erlaubt))
    .filter((pfad) => /["'](gsap|lenis)(\/[\w]+)?["']/.test(readFileSync(pfad, "utf8")));
  assert.deepEqual(verstoesse, []);
});
