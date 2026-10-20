import "server-only";

import { cache } from "react";

import { getPrisma } from "@/lib/prisma";
import { monatSchluessel } from "@/lib/sotm/kalender";
import { sotmAus, type SotmAnsicht } from "@/lib/query/sotm-ansicht";

export { sotmAus, type SotmAnsicht };

/**
 * Strain of the Month des Monats: Gewinner-Option der BEENDETEN Runde mit
 * `monat` = Monat von `jetzt`. Laeuft die Runde noch, liefert die Anzeige
 * `aktiveUmfrage()` (lib/query/umfragen.ts).
 *
 * Drei Queries: Runde samt Gewinner, Community-Aggregat, Betreiber-Review.
 * Zaehlung seit Monatsbeginn (UTC), nur freigegeben, Community ohne Redaktion.
 */
export const aktuellerSotm = cache(async (jetzt: Date = new Date()): Promise<SotmAnsicht | null> => {
  const prisma = await getPrisma();
  const monat = monatSchluessel(jetzt);

  const runde = await prisma.umfrage.findFirst({
    where: { monat, phase: "BEENDET" },
    select: {
      optionen: {
        where: { istGewinner: true },
        orderBy: { reihenfolge: "asc" },
        take: 1,
        select: {
          strain: {
            select: {
              id: true,
              slug: true,
              handelsname: true,
              herstellerBildPfad: true,
              aktiv: true,
              kultivar: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  const gewinner = runde?.optionen[0]?.strain;
  if (!gewinner) return null;

  const monatsbeginn = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth(), 1));
  const [community, betreiber] = await Promise.all([
    prisma.review.aggregate({
      where: { strainId: gewinner.id, freigegeben: true, istRedaktionell: false, erstelltAm: { gte: monatsbeginn } },
      _count: { _all: true },
      _avg: { gesamtnote: true },
    }),
    prisma.review.findFirst({
      where: { strainId: gewinner.id, freigegeben: true, istRedaktionell: true },
      orderBy: [{ erstelltAm: "desc" }, { id: "asc" }],
      select: { gesamtnote: true },
    }),
  ]);

  return sotmAus({
    monat,
    strain: gewinner,
    mitglieder: { anzahl: community._count._all, schnitt: community._avg.gesamtnote },
    betreiber,
  });
});
