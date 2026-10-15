/**
 * Liest die Kultivare der Remote-Datenbank (nur lesend) und schreibt die
 * `UPDATE kultivare SET slug = …`-Zeilen ans Ende von migrations/0024_sorte_im_fokus.sql.
 * Ein vorhandener Slug-Block wird ersetzt, der Lauf ist wiederholbar.
 *
 *   npx tsx scripts/kultivar-slugs.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { kultivarSlugs } from "../lib/kultivar-slug";

const DATEI = "migrations/0024_sorte_im_fokus.sql";
const MARKE = "-- Slugs (erzeugt von scripts/kultivar-slugs.ts)";

// shell: true (npx.cmd unter Windows) zerlegt Argumente, daher der Befehl als ein String mit Anführungszeichen.
const roh = execSync(
  'npx wrangler d1 execute cn-medcan-db --remote --json --command "SELECT id,name FROM kultivare"',
  { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
);
const kultivare = (JSON.parse(roh)[0].results as { id: string; name: string }[]);
const slugs = kultivarSlugs(kultivare);

const zeilen = [...slugs.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, slug]) => `UPDATE kultivare SET slug = '${slug}' WHERE id = '${id}' AND slug IS NULL;`);

const sql = readFileSync(DATEI, "utf8");
const basis = sql.includes(MARKE) ? sql.slice(0, sql.indexOf(MARKE)) : sql.replace(/\s*$/, "\n");
writeFileSync(DATEI, `${basis}${MARKE}\n${zeilen.join("\n")}\n`);
console.log(`${zeilen.length} Slugs geschrieben`);
