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
  assert.match(block[1], /animation:\s*einstieg-notfall\s+0s\s+linear\s+8s\s+forwards/);
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

test("Logo im Auftakt schreibt sich per CSS, nur bei erlaubter Bewegung, ohne Schnitt am Ende", () => {
  const bloecke = [...css.matchAll(/@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/g)].map(
    (treffer) => treffer[1],
  );
  const block = bloecke.find((inhalt) => inhalt.includes(".auftakt-marke"));
  assert.ok(block, "Schreib-Einstieg fehlt oder steht ohne Bewegungsschutz");
  assert.match(block, /\.auftakt-marke \.marke-pinsel\s*\{\s*animation:\s*schreiben [^;]*\bbackwards;/);
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

test("Randzahlen haben ein eigenes Attribut", () => {
  const ablauf = readFileSync(join("components", "story", "bewegung", "randnotizen.ts"), "utf8");
  assert.match(ablauf, /"\[data-randzahl\]"/);
  assert.doesNotMatch(ablauf, /data-zaehler/);
  assert.doesNotMatch(readFileSync(join("components", "story", "Randspalte.tsx"), "utf8"), /data-zaehler/);
});

const bewegung = (datei: string) => readFileSync(join("components", "story", "bewegung", datei), "utf8");

test("Auftakt: der CSS-Notfall wird erst abgeschaltet, wenn die Timeline läuft", () => {
  const auftakt = bewegung("auftakt.ts");
  assert.doesNotMatch(auftakt, /\.set\(einstieg,\s*\{\s*animation:\s*"none",\s*opacity:\s*0/);
  assert.match(auftakt, /onStart:\s*\(\)\s*=>\s*\{\s*gsap\.set\(einstieg,\s*\{\s*animation:\s*"none"\s*\}\)/);
  assert.match(auftakt, /visibilityState === "visible"/);
  // Zoomwerte bleiben (Nutzer 2026-09-26).
  assert.match(auftakt, /scale:\s*1\.02/);
  assert.match(auftakt, /scale:\s*1\.05/);
});

test("Umschlag wird Seite: abschaltbar, Pin ohne Platzhalter, nur ab Tablet", () => {
  const auftakt = bewegung("auftakt.ts");
  assert.match(auftakt, /export const UMSCHLAG_WIRD_SEITE = (true|false);/);
  assert.match(auftakt, /mm\.add\(AB_TABLET/);
  assert.match(auftakt, /pin:\s*true,\s*pinSpacing:\s*false/);
  assert.match(bewegung("start.ts"), /\bumschlagWirdSeite\b/);
  const seite = readFileSync(join("components", "story", "TransparentMachen.tsx"), "utf8");
  assert.match(seite, /className="[^"]*\bfeldbuch-raster\b[^"]*\bz-10\b[^"]*\bbg-surface\b/);
  assert.match(css, /\[data-umschlag-seite\]\s*\{\s*box-shadow:/);
});

test("Ruhende Sektionen: CSS-Animationen halten außerhalb des Bildes an, der Kopf nie", () => {
  assert.match(bewegung("ruhe.ts"), /section\[data-story\]/);
  assert.match(bewegung("ruhe.ts"), /rootMargin: "200px 0px"/);
  assert.match(bewegung("start.ts"), /beobachteRuhe\(\)/);
  assert.match(
    css,
    /\[data-ruhend\],\s*\[data-ruhend\] \*,\s*\[data-ruhend\] \*::before,\s*\[data-ruhend\] \*::after\s*\{\s*animation-play-state: paused !important;/,
  );
  assert.doesNotMatch(readFileSync(join("components", "layout", "Kopf.tsx"), "utf8"), /data-story=/);
});

test("will-change nur während der Bewegung (Vorhang, Zeigerpunkte)", () => {
  assert.match(bewegung("vorhang.ts"), /onToggle:[\s\S]*?willChange = isActive \? "clip-path" : ""/);
  const punkte = bewegung("punkte.ts");
  assert.match(punkte, /willChange = aktiv \? "translate" : ""/);
  assert.match(punkte, /if \(!frame\) ebenenVorbereiten\(false\)/);
});

test("Totes schleife.ts ist weg", () => {
  assert.equal(existsSync(join("components", "story", "bewegung", "schleife.ts")), false);
  assert.doesNotMatch(bewegung("start.ts"), /\bschleife\b|"\.\/schleife"/);
});

test("Stimmbalken wachsen von links, Stimmenzahlen zählen mit eigenem Attribut hoch", () => {
  const kandidat = readFileSync(join("components", "umfrage", "Kandidat.tsx"), "utf8");
  assert.match(kandidat, /data-stimmbalken=""\s*className="[^"]*\borigin-left\b/);
  assert.match(kandidat, /data-stimmzahl="" data-ziel=\{option\.stimmen\}/);
  const ablauf = bewegung("abstimmung.ts");
  assert.match(ablauf, /\{ scaleX: 0, duration: 0\.9, ease: "power3\.out", stagger: 0\.08/);
  assert.match(ablauf, /"\[data-stimmzahl\]"/);
  assert.doesNotMatch(ablauf, /data-randzahl|data-zaehler/);
});

test("Stimmabgabe: Auswahl tritt während des Sendens zurück, reduziert ohne Skalierung", () => {
  const formular = readFileSync(join("components", "umfrage", "StimmFormular.tsx"), "utf8");
  assert.match(formular, /stimm-auswahl[\s\S]*?data-wartet=\{laeuft/);
  assert.match(css, /\.stimm-auswahl\s*\{\s*transition:\s*opacity 150ms cubic-bezier\(0\.23, 1, 0\.32, 1\),\s*scale 150ms cubic-bezier\(0\.23, 1, 0\.32, 1\);/);
  assert.match(css, /\.stimm-auswahl\[data-wartet\]\s*\{\s*opacity: 0\.6;\s*scale: 0\.98;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\/\*[^*]*\*\/\s*\.stimm-auswahl\[data-wartet\]\s*\{\s*scale: none;/);
});

test("Auftakt beim Hinausscrollen: das Logo wächst an seinem Platz statt nach oben zu gleiten (Nutzer 2026-10-07)", () => {
  const quelle = readFileSync("components/story/bewegung/auftakt.ts", "utf8");
  assert.match(quelle, /gsap\.fromTo\('\[data-story="titel"\]', \{ scale: 1 \}, \{ scale: 1\.15,/);
  assert.doesNotMatch(quelle, /yPercent: -30/);
});

test("Kapitel: Name deckt sich auf, Wörter schreiben sich, nur getauschte Knoten bleiben stehen", () => {
  const ablauf = bewegung("kapitel.ts");
  assert.match(ablauf, /'\[data-story="kapitel"\]'/);
  assert.match(ablauf, /SCHREIBEN_AB/);
  assert.match(ablauf, /isConnected/);
  assert.match(ablauf, /onEnter/);
  assert.match(ablauf, /once: true/);
  assert.doesNotMatch(ablauf, /\b(width|height|top|left)\s*:/);
  const start = bewegung("start.ts");
  assert.match(start, /import \{ kapitel \} from "\.\/kapitel"/);
  assert.match(start, /abstimmung,\n\s*kapitel,/);
});
