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
    // TODO(Merge Strang B): prisma.publoraPost existiert erst mit Task 2; dann auf
    // prisma.publoraPost.count({ where: { status: "failed", geplantAm: { gte: <jetzt minus 14 Tage als ISO> } } }) umstellen.
    sicherZaehlen(async () => 0),
  ]);
  return { bewertungen, mitglieder, gemeldet, budpics, vorschlaege, jury, instagram };
});
