import { cache } from "react";

import { getPrisma } from "@/lib/prisma";
import { profilAusDaten } from "@/lib/profil";
import { OEFFENTLICHE_BEWERTUNGEN, type OeffentlichesProfil } from "@/lib/profil-oeffentlich";

/**
 * Öffentliches Profil (Spec Profil 9): nur wenn eingeschaltet, sonst null (404).
 * Nie Vorschläge oder Auswertungen, nie unfreigegebene Bewertungen. Das Netz
 * kommt ungerechnet aus nutzer_profil: fremde Aufrufe lösen keine Rechnung aus
 * (CPU-Limit); der Stand erneuert sich beim Speichern und beim Besuch des Inhabers.
 * `cache()` je Render-Durchlauf: Metadaten und Seite teilen sich eine Abfrage.
 */
export const ladeOeffentlichesProfil = cache(async function ladeOeffentlichesProfil(
  kurzId: string,
): Promise<OeffentlichesProfil | null> {
  const prisma = await getPrisma();
  const m = await prisma.mitglied.findFirst({
    where: { kurzId, profilOeffentlich: true },
    select: {
      id: true,
      anzeigename: true,
      avatar: { select: { id: true } },
      profil: { select: { geschmack: true, terpene: true, anzahl: true, gewichtet: true } },
    },
  });
  if (!m) return null;
  const nurFrei = { autorId: m.id, freigegeben: true } as const;
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
    werte: m.profil ? profilAusDaten(m.profil) : null,
    bewertungen: zeilen.map((z) => ({
      id: z.id,
      slug: z.strain.slug,
      handelsname: z.strain.handelsname,
      gesamtnote: z.gesamtnote,
      erstelltAm: z.erstelltAm,
    })),
  };
});
