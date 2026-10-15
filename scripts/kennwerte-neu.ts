/**
 * Schreibt kultivar_vertreiber_kennwerte (Spec 2026-10-15) einmalig für alle Paare aus Sorte und Vertreiber
 * mit freigegebenen Bewertungen neu, in derselben Rechnung wie kennwerteFortschreiben (lib/kennwerte.ts):
 * Anzahl der freigegebenen Bewertungen, Mittel der Gesamtnote auf eine Nachkommastelle.
 * kennwerteFortschreiben selbst braucht die Worker-Bindung, deshalb wie scripts/kultivar-slugs.ts über wrangler.
 * Wiederholbar (Upsert).
 *
 *   npx tsx scripts/kennwerte-neu.ts            # Remote-D1
 *   npx tsx scripts/kennwerte-neu.ts --local    # lokale D1
 */
import { execSync } from "node:child_process";

const ziel = process.argv.includes("--local") ? "--local" : "--remote";

const SQL =
  "INSERT INTO kultivar_vertreiber_kennwerte (kultivar_id, vertreiber_id, anzahl, gesamtnote_mittel, aktualisiert_am) " +
  "SELECT kultivar_id, vertreiber_id, COUNT(*), ROUND(AVG(gesamtnote), 1), CURRENT_TIMESTAMP FROM reviews " +
  "WHERE freigegeben = 1 AND kultivar_id IS NOT NULL AND vertreiber_id IS NOT NULL GROUP BY kultivar_id, vertreiber_id " +
  "ON CONFLICT(kultivar_id, vertreiber_id) DO UPDATE SET anzahl = excluded.anzahl, " +
  "gesamtnote_mittel = excluded.gesamtnote_mittel, aktualisiert_am = excluded.aktualisiert_am";

// shell: true (npx.cmd unter Windows) zerlegt Argumente, daher der Befehl als ein String mit Anführungszeichen.
const roh = execSync(`npx wrangler d1 execute cn-medcan-db ${ziel} --json --command "${SQL}"`, {
  encoding: "utf8",
  maxBuffer: 16 * 1024 * 1024,
});
const meta = JSON.parse(roh)[0]?.meta;
console.log(`kultivar_vertreiber_kennwerte: ${meta?.changes ?? "?"} Zeilen geschrieben`);
