import { defineConfig } from "prisma/config";

/**
 * Reine Arbeitsdatei fuer `prisma migrate diff`.
 *
 * D1 selbst hat keine Verbindungs-URL - die Datenbank kommt als Binding in
 * den Worker. Die Schema-Engine verlangt aber auch fuer einen Diff aus dem
 * Nichts (`--from-empty`) zwingend eine Datasource; fehlt sie, bricht sie
 * still ab: Exit-Code 0, leere Ausgabe, keine Fehlermeldung. Deshalb steht
 * hier ein lokaler SQLite-Pfad. In diese Datei wird nie geschrieben, sie ist
 * nur das Ziel, gegen das der Diff rechnet - sie darf sogar fehlen.
 */
const DIFF_ZIEL = "file:./db/.migrate-diff.sqlite";

/**
 * Cloudflare D1 hat keine Verbindungs-URL: die Datenbank kommt als Binding
 * in den Worker. Deshalb steht hier kein `datasource`-Block - Prisma
 * braucht fuer D1 keine Zugangsdaten, und `.env.local` enthaelt keine mehr.
 *
 * `prisma migrate dev` gibt es auf diesem Pfad nicht. Migrationen laufen
 * hybrid ueber `prisma migrate diff` und `wrangler d1 migrations apply`,
 * siehe db/README.md.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: DIFF_ZIEL,
  },
  migrations: {
    // Seed-Skript (Prisma 7 registriert es hier, nicht in package.json).
    seed: "npx tsx prisma/seed.ts",
  },
});
