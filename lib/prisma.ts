import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma laeuft ausschliesslich serverseitig und verbindet mit der
 * Service-Rolle - Row Level Security greift dabei NICHT.
 * Alles, was pro Nutzer gefiltert werden muss, laeuft ueber lib/supabase/server.ts.
 * Siehe .claude/skills/edge-stack-master.md, Abschnitt RLS-Grenze.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL fehlt. Supabase Transaction-Pooler (Port 6543) in .env.local eintragen."
    );
  }
  // Transaction-Pooler unterstuetzt keine Prepared Statements.
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

/** Singleton pro Isolate - nicht pro Request neu instanziieren. */
export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}
