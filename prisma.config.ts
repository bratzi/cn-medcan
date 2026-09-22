import { config as ladeEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Zugangsdaten stehen in .env.local, nicht in .env.
ladeEnv({ path: ".env.local", quiet: true });

/**
 * Prisma 7 verwaltet die Verbindungs-URLs hier, nicht mehr im Schema.
 *
 * Wichtig, das ist die haeufigste Fehlerquelle bei Supabase:
 * - Migrationen und Introspection laufen ueber die DIREKTE Verbindung (Port 5432),
 *   weil der Transaction-Pooler kein DDL mit Prepared Statements vertraegt.
 * - Die Laufzeit verbindet ueber den Pooler (Port 6543) und bekommt die URL
 *   nicht hier, sondern ueber den Adapter in lib/prisma.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
