import "server-only";

import { kalenderBauen, type Kalender } from "@/lib/admin-kalender";
import { getPrisma } from "@/lib/prisma";
import type { PostArt } from "@/lib/publora-sync";

/** Spiegel lesen; fehlt die Tabelle (vor Migration 0028), gilt der Kalender als veraltet. */
export async function ladeKalender(): Promise<Kalender> {
  try {
    const prisma = await getPrisma();
    const [zeilen, stand] = await Promise.all([
      prisma.publoraPost.findMany({ take: 500, orderBy: { geplantAm: "asc" } }),
      prisma.syncStand.findUnique({ where: { schluessel: "publora" } }),
    ]);
    return kalenderBauen(zeilen.map(({ abgerufenAm: _a, ...z }) => ({ ...z, art: z.art as PostArt })), stand?.stand ?? null);
  } catch (fehler) {
    console.error("ladeKalender fehlgeschlagen", fehler);
    return kalenderBauen([], null);
  }
}
