import "server-only";

import { cache } from "react";

import { sicherZaehlen, type AdminZaehler } from "@/lib/admin-aufgaben";
import { getPrisma } from "@/lib/prisma";

/** Alle offenen Zahlen in einem Promise.all, nur count (Spec Daten/Zähler). Je Anfrage einmal. Fällt nie, bei Fehler {}. */
export const ladeAdminZaehler = cache(async (): Promise<AdminZaehler> => {
  try {
    const prisma = await getPrisma();
    const jetzt = Date.now();
    const ab = new Date(jetzt - 14 * 24 * 60 * 60 * 1000).toISOString();
    const [bewertungen, mitglieder, gemeldet, budpics, vorschlaege, jury, instagram] = await Promise.all([
      // Gleiche Regel wie offeneBewertungen in lib/query/reviews.ts.
      sicherZaehlen(() => prisma.review.count({ where: { freigegeben: false, istRedaktionell: false } })),
      sicherZaehlen(() => prisma.mitglied.count({ where: { freigegeben: false } })),
      sicherZaehlen(() => prisma.kommentar.count({ where: { status: "GEMELDET" } })),
      sicherZaehlen(() => prisma.budpic.count({ where: { status: "OFFEN" } })),
      sicherZaehlen(() => prisma.sortenVorschlag.count({ where: { status: "OFFEN" } })),
      sicherZaehlen(() => prisma.juryBeitrag.count({ where: { status: "EINGEREICHT" } })),
      // Fehlgeschlagen oder überfällig (geplant, Termin verstrichen). geplantAm ist ein ISO-Text, daher lexikografischer Vergleich.
      sicherZaehlen(() =>
        prisma.publoraPost.count({
          where: {
            OR: [
              { status: "failed", geplantAm: { gte: ab } },
              { status: "scheduled", geplantAm: { gte: ab, lt: new Date(jetzt).toISOString() } },
            ],
          },
        }),
      ),
    ]);
    return { bewertungen, mitglieder, gemeldet, budpics, vorschlaege, jury, instagram };
  } catch (fehler) {
    console.error("ladeAdminZaehler", fehler);
    return {};
  }
});
