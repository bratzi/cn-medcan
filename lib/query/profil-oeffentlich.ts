import { cache } from "react";

import { getPrisma } from "@/lib/prisma";
import { oeffentlicheWerte } from "@/lib/profil";
import { OEFFENTLICHE_BEWERTUNGEN, type OeffentlichesProfil } from "@/lib/profil-oeffentlich";

/**
 * Öffentliches Profil (Spec Profil 9): nur wenn eingeschaltet, sonst null (404).
 * Nur freigegebene Mitglieder (Review W2: sonst wäre es ein unmoderierter Aushang).
 * Nie Vorschläge oder Auswertungen, nie unfreigegebene Bewertungen, auch nicht im
 * Netz: das kommt aus `nutzer_profil.oeffentlich`, nur aus freigegebenen gerechnet
 * (Review W1), ungerechnet gelesen (CPU-Limit). Inaktive Sorten fehlen wie im Katalog.
 * `cache()` je Render-Durchlauf: Metadaten und Seite teilen sich eine Abfrage.
 */
export const ladeOeffentlichesProfil = cache(async function ladeOeffentlichesProfil(
  kurzId: string,
): Promise<OeffentlichesProfil | null> {
  const prisma = await getPrisma();
  const m = await prisma.mitglied.findFirst({
    where: { kurzId, profilOeffentlich: true, freigegeben: true },
    select: {
      id: true,
      anzeigename: true,
      avatar: { select: { id: true } },
      profil: { select: { oeffentlich: true } },
    },
  });
  if (!m) return null;
  const nurFrei = { autorId: m.id, freigegeben: true, strain: { aktiv: true } } as const;
  const [anzahl, zeilen] = await Promise.all([
    prisma.review.count({ where: nurFrei }),
    prisma.review.findMany({
      where: nurFrei,
      orderBy: { erstelltAm: "desc" },
      take: OEFFENTLICHE_BEWERTUNGEN,
      select: { id: true, gesamtnote: true, erstelltAm: true, strain: { select: { slug: true, handelsname: true } } },
    }),
  ]);
  return {
    anzeigename: m.anzeigename,
    avatarId: m.avatar?.id ?? null,
    anzahl,
    werte: oeffentlicheWerte(m.profil?.oeffentlich ?? null),
    bewertungen: zeilen.map((z) => ({
      id: z.id,
      slug: z.strain.slug,
      handelsname: z.strain.handelsname,
      gesamtnote: z.gesamtnote,
      erstelltAm: z.erstelltAm,
    })),
  };
});
