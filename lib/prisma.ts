import { PrismaD1 } from "@prisma/adapter-d1";

import { getEnv } from "@/lib/cloudflare";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Prisma laeuft ausschliesslich serverseitig, nie in einer Client Component.
 *
 * Zugriffskontrolle: D1 kennt kein Row Level Security. Jede Zeile, die der
 * Worker lesen darf, liest er. Die fachliche Sichtbarkeitsgrenze - das
 * HWG-Gate auf Preisen und Bestaenden - liegt deshalb in der Abfrageschicht,
 * siehe bestandSichtbarkeit() in lib/query/strains.ts. Ein vergessener
 * Filter faellt nicht als Fehler auf, sondern als stilles Datenleck: neue
 * Abfragen auf nutzerbezogene Daten gehen ueber die dortigen Helfer, nicht
 * an ihnen vorbei.
 */

type GlobalerCache = {
  prismaClient?: PrismaClient;
  prismaBinding?: D1Database;
};

const globalerCache = globalThis as unknown as GlobalerCache;

/**
 * Prisma-Client fuer das D1-Binding.
 *
 * Anders als beim Postgres-Adapter kann das kein Modul-Singleton sein: das
 * Binding existiert erst im Request-Kontext, auf Modulebene gibt es es noch
 * nicht. Gecacht wird trotzdem pro Isolate - aber nur, solange dasselbe
 * Binding-Objekt kommt. Ein Wechsel (anderer Worker-Kontext, Preview gegen
 * eine andere Datenbank) erzeugt einen neuen Client, statt still gegen die
 * falsche Datenbank zu arbeiten.
 */
export async function getPrisma(): Promise<PrismaClient> {
  const env = await getEnv();
  const binding = env.DB;
  if (!binding) {
    throw new Error(
      "D1-Binding DB fehlt. In wrangler.jsonc unter `d1_databases` eintragen " +
        "und anschliessend `npm run cf-typegen` ausfuehren."
    );
  }

  if (globalerCache.prismaClient && globalerCache.prismaBinding === binding) {
    return globalerCache.prismaClient;
  }

  const client = new PrismaClient({ adapter: new PrismaD1(binding) });
  globalerCache.prismaClient = client;
  globalerCache.prismaBinding = binding;
  return client;
}
