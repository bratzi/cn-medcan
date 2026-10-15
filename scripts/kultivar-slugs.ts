/**
 * Liest die Kultivare der Remote-Datenbank (nur lesend) und schreibt die
 * `UPDATE kultivare SET slug = …`-Zeilen ans Ende von migrations/0024_sorte_im_fokus.sql.
 * Nur der Block zwischen BEGIN/END-Marke wird ersetzt, der Rest der Datei bleibt, der Lauf ist wiederholbar.
 *
 *   npx tsx scripts/kultivar-slugs.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { kultivarSlugs } from "../lib/kultivar-slug";

const DATEI = "migrations/0024_sorte_im_fokus.sql";
const ANFANG = "-- BEGIN Slugs (erzeugt von scripts/kultivar-slugs.ts)";
const ENDE = "-- END Slugs";

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
const block = `${ANFANG}\n${zeilen.join("\n")}\n${ENDE}\n`;
const von = sql.indexOf(ANFANG);
const bis = sql.indexOf(ENDE, von);
const neu =
  von >= 0 && bis >= 0
    ? sql.slice(0, von) + block + sql.slice(bis + ENDE.length).replace(/^\r?\n/, "")
    : `${sql.replace(/\s*$/, "\n")}${block}`;
writeFileSync(DATEI, neu);
console.log(`${zeilen.length} Slugs geschrieben`);
