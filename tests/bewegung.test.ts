import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { SCHREIBEN_AB, SCHREIBEN_BIS } from "@/components/story/bewegung/schreiben";

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

test("jede Video-Schleife hat einen Schalter zum Anhalten (WCAG 2.2.2)", () => {
  const ohneSchalter = ["app", "components"]
    .flatMap(dateien)
    .filter((pfad) => !pfad.endsWith(join("medien", "Loop.tsx")))
    .filter((pfad) => /<Loop\b/.test(readFileSync(pfad, "utf8")))
    .filter((pfad) => !/data-loop-schalter|<LoopSchalter/.test(readFileSync(pfad, "utf8")));
  assert.deepEqual(ohneSchalter, []);
  assert.match(readFileSync(join("components", "story", "bewegung", "loops.ts"), "utf8"), /data-loop-schalter/);
});

test("Wortmarke im Auftakt schreibt sich per CSS, nur bei erlaubter Bewegung, ohne Schnitt am Ende", () => {
  const bloecke = [...css.matchAll(/@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/g)].map(
    (treffer) => treffer[1],
  );
  const block = bloecke.find((inhalt) => inhalt.includes(".auftakt-marke"));
  assert.ok(block, "Schreib-Einstieg fehlt oder steht ohne Bewegungsschutz");
  assert.match(block, /\.auftakt-marke \[data-marke-zeile\]\s*\{\s*animation:\s*schreiben [^;]*\bbackwards;/);
  assert.match(block, /\.auftakt-unterzeile\s*\{\s*animation:\s*schreiben [^;]*\bbackwards;/);
  assert.doesNotMatch(block, /forwards|\bboth\b/);
  assert.match(css, /@keyframes schreiben\s*\{/);
});

test("Schreiben: dieselben Ränder in GSAP und CSS, am Ende kein Schnitt", () => {
  assert.ok(css.includes(`clip-path: ${SCHREIBEN_AB.clipPath};`), "Startrand fehlt in @keyframes schreiben");
  assert.ok(css.includes(`clip-path: ${SCHREIBEN_BIS.clipPath};`), "Endrand fehlt in @keyframes schreiben");
  assert.equal(SCHREIBEN_BIS.clearProps, "clipPath");
  assert.ok(SCHREIBEN_BIS.duration >= 0.6 && SCHREIBEN_BIS.duration <= 0.9, `${SCHREIBEN_BIS.duration} s`);
});

test("Fuß-Wortmarke: der Trigger löst aus, sobald sie ins Bild kommt (sichtbar sind nur rund 0,6 em)", () => {
  const schluss = readFileSync(join("components", "story", "bewegung", "schluss.ts"), "utf8");
  const trigger = /data-story="fuss-marke"[\s\S]*?scrollTrigger:\s*\{([^}]*)\}/.exec(schluss);
  assert.ok(trigger, "Trigger der Fuß-Wortmarke fehlt");
  assert.match(trigger[1], /start:\s*"top bottom"/);
});

test("Randspalte ohne Schwenk und Pin: wand.ts ist weg (Spec TP3 8.3)", () => {
  assert.equal(existsSync(join("components", "story", "bewegung", "wand.ts")), false);
  const start = readFileSync(join("components", "story", "bewegung", "start.ts"), "utf8");
  assert.match(start, /\brandnotizen\b/);
  assert.doesNotMatch(start, /\bwand\b/);
  assert.doesNotMatch(css, /ist-schwenk|wand-reihe/);
});

test("Randzahlen haben ein eigenes Attribut, data-zaehler bleibt der Doppelseite", () => {
  const ablauf = readFileSync(join("components", "story", "bewegung", "randnotizen.ts"), "utf8");
  assert.match(ablauf, /"\[data-randzahl\]"/);
  assert.doesNotMatch(ablauf, /data-zaehler/);
  assert.doesNotMatch(readFileSync(join("components", "story", "Randspalte.tsx"), "utf8"), /data-zaehler/);
});
