import "server-only";

import { cache } from "react";

import { sicherZaehlen, type AdminZaehler } from "@/lib/admin-aufgaben";
import { getPrisma } from "@/lib/prisma";

/** Alle offenen Zahlen in einem Promise.all, nur count (Spec Daten/Zähler). Je Anfrage einmal. */
export const ladeAdminZaehler = cache(async (): Promise<AdminZaehler> => {
  const prisma = await getPrisma();
  const [bewertungen, mitglieder, gemeldet, budpics, vorschlaege, jury, instagram] = await Promise.all([
    // Gleiche Regel wie offeneBewertungen in lib/query/reviews.ts.
    sicherZaehlen(() => prisma.review.count({ where: { freigegeben: false, istRedaktionell: false } })),
    sicherZaehlen(() => prisma.mitglied.count({ where: { freigegeben: false } })),
    sicherZaehlen(() => prisma.kommentar.count({ where: { status: "GEMELDET" } })),
    sicherZaehlen(() => prisma.budpic.count({ where: { status: "OFFEN" } })),
    sicherZaehlen(() => prisma.sortenVorschlag.count({ where: { status: "OFFEN" } })),
    sicherZaehlen(() => prisma.juryBeitrag.count({ where: { status: "EINGEREICHT" } })),
    // geplantAm ist ein ISO-Text, daher lexikografischer Vergleich.
    sicherZaehlen(() =>
      prisma.publoraPost.count({ where: { status: "failed", geplantAm: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() } } }),
    ),
  ]);
  return { bewertungen, mitglieder, gemeldet, budpics, vorschlaege, jury, instagram };
});
