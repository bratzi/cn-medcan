import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const lies = (datei: string) => readFileSync(datei, "utf8");

/**
 * Spec 2026-10-01 (statische Seiten), 4.3: Jede statische Seite schaltet selbst um
 * (force-static plus revalidate), kein generateStaticParams. Gerendert wird beim ersten
 * Aufruf, nicht im Build: der Build hat weder D1 noch Secrets.
 */
const STATISCH: Record<string, string> = {
  "app/[lang]/page.tsx": "300",
  "app/[lang]/reviews/page.tsx": "300",
  "app/[lang]/impressum/page.tsx": "86400",
  "app/[lang]/datenschutz/page.tsx": "86400",
  "app/[lang]/zugang/page.tsx": "false",
};

test("Statische Seiten schalten selbst um", () => {
  for (const [datei, revalidate] of Object.entries(STATISCH)) {
    const quelle = lies(datei);
    assert.match(quelle, /export const dynamic = "force-static";/, datei);
    assert.match(quelle, new RegExp(`export const revalidate = ${revalidate};`), datei);
    assert.doesNotMatch(quelle, /generateStaticParams|force-dynamic/, datei);
  }
});

const VERBOTEN = /lib\/session|aktuellesMitglied|istFachkreis|cookies\(|headers\(/;
const ENDUNGEN = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function loeseAuf(von: string, ziel: string): string | null {
  let basis: string;
  if (ziel.startsWith("@/")) basis = ziel.slice(2);
  else if (ziel.startsWith(".")) basis = join(dirname(von), ziel);
  else return null;
  basis = basis.split("\\").join("/");
  for (const endung of ENDUNGEN) {
    const kandidat = normalize(basis + endung).split("\\").join("/");
    if (existsSync(kandidat) && statSync(kandidat).isFile()) return kandidat;
  }
  return null;
}

/**
 * Bekannte Ausnahme: lib/query/budpics.ts enthält budpicZugang() mit Sitzung, der statische Baum
 * (Katalog.tsx) importiert aber nur ladeFreieBudpics. Wird budpicZugang dort je aufgerufen, ist diese
 * Ausnahme falsch und zu entfernen.
 */
const AUSNAHMEN = new Set(["lib/query/budpics.ts"]);

/** Kommentare dürfen `lib/session` nennen, nur Code zählt. */
const ohneKommentare = (quelle: string) => quelle.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");

/** Transitiver Importbaum, Server-Action-Dateien (aktionen.ts) laufen nicht im Render. */
function importbaum(start: string[]): Map<string, string> {
  const besucht = new Map<string, string>();
  const offen = [...start];
  while (offen.length) {
    const datei = offen.pop()!;
    if (besucht.has(datei) || /aktionen\.ts$/.test(datei) || AUSNAHMEN.has(datei)) continue;
    const quelle = lies(datei);
    besucht.set(datei, quelle);
    for (const treffer of quelle.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      const aufgeloest = loeseAuf(datei, treffer[1]);
      if (aufgeloest) offen.push(aufgeloest);
    }
  }
  return besucht;
}

test("Statische Seiten lesen keine Sitzung (auch transitiv)", () => {
  const baum = importbaum([...Object.keys(STATISCH), "app/[lang]/layout.tsx"]);
  assert.ok(baum.size > Object.keys(STATISCH).length, "Importbaum wurde nicht aufgelöst");
  for (const [datei, quelle] of baum) {
    assert.doesNotMatch(ohneKommentare(quelle), VERBOTEN, datei);
  }
});
