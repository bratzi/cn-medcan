import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

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
export const ohneKommentare = (quelle: string) =>
  quelle.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");

/** Transitiver Importbaum, Server-Action-Dateien (aktionen.ts) laufen nicht im Render. */
export function importbaum(start: string[]): Map<string, string> {
  const besucht = new Map<string, string>();
  const offen = [...start];
  while (offen.length) {
    const datei = offen.pop()!;
    if (besucht.has(datei) || /aktionen\.ts$/.test(datei) || AUSNAHMEN.has(datei)) continue;
    const quelle = readFileSync(datei, "utf8");
    besucht.set(datei, quelle);
    for (const treffer of quelle.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      const aufgeloest = loeseAuf(datei, treffer[1]);
      if (aufgeloest) offen.push(aufgeloest);
    }
  }
  return besucht;
}
