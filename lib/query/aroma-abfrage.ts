/**
 * Abfrage der Aroma-Karte der Startseite (Spec Redesign 16, Nutzer 2026-10-20: Katalog steuert
 * Bewertung). Ohne Sorte die meistbewertete Blüte überhaupt, mit Sorte (Kultivar-Slug) die
 * meistbewertete Blüte dieser Sorte. Immer nur freigegebene Bewertungen. Rein, damit testbar.
 */
export function aromaAbfrage(kultivarSlug: string | null) {
  return {
    where: {
      aktiv: true,
      terpene: { some: {} },
      reviews: { some: { freigegeben: true } },
      ...(kultivarSlug ? { kultivar: { slug: kultivarSlug } } : {}),
    } as { aktiv: true; terpene: { some: object }; reviews: { some: { freigegeben: true } }; kultivar?: { slug: string } },
    orderBy: { reviews: { _count: "desc" as const } },
    select: {
      handelsname: true,
      slug: true,
      kultivarName: true,
      kultivarTyp: true,
      genetik: true,
      thcMinProzent: true,
      thcMaxProzent: true,
      cbdMinProzent: true,
      cbdMaxProzent: true,
      kultivar: { select: { slug: true } },
      vertreiber: { select: { name: true } },
      herstellerBildPfad: true,
      terpene: {
        orderBy: { rang: "asc" as const },
        select: {
          rang: true,
          konzentrationProzent: true,
          terpen: { select: { name: true, aromaProfil: true, geschmack: true } },
        },
      },
      reviews: {
        where: { freigegeben: true as const },
        take: 50,
        select: {
          geschmacksMatrix: true,
          terpenIntensitaet: true,
          beschaffenheit: true,
          feuchtigkeitProzent: true,
          aussehen: true,
          geruch: true,
          geschmack: true,
          konsistenz: true,
        },
      },
      kennwerte: { select: { terpenMedian: true, geschmackMedian: true, gesamtnoteMedian: true, anzahl: true } },
    },
  };
}
