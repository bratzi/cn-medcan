import "server-only";

import type { GeschmacksKategorie } from "@/db/enums";
import { IG_GESCHUETZT, igUeberschreibbar, juryZitat, type JuryFeedBeitrag } from "@/lib/ig-jury";
import { liebsteAromen } from "@/lib/profil-ansicht";
import { getPrisma } from "@/lib/prisma";
import { GESCHMACKS_ACHSEN, parseGeschmacksMatrix } from "@/lib/query/bewertung";

function aromenWerte(roh: string): Record<GeschmacksKategorie, number> {
  const matrix = parseGeschmacksMatrix(roh);
  return Object.fromEntries(GESCHMACKS_ACHSEN.map((a) => [a.enumWert, matrix[a.key]])) as Record<GeschmacksKategorie, number>;
}

/**
 * Veröffentlichte, sichtbare Jury-Beiträge, die noch nicht auf Instagram stehen (igStatus KEIN oder FEHLER),
 * älteste zuerst. Nur öffentliche Felder; Autor mit Handle nur bei öffentlichem Profil.
 */
export async function juryFeed(ursprung: string): Promise<JuryFeedBeitrag[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.juryBeitrag.findMany({
    where: {
      status: "VEROEFFENTLICHT",
      igStatus: { in: ["KEIN", "FEHLER"] },
      OR: [{ ausgabeId: null }, { ausgabe: { status: "VEROEFFENTLICHT" } }],
    },
    orderBy: { veroeffentlichtAm: "asc" },
    take: 10,
    select: {
      slug: true, titel: true, anriss: true, text: true,
      autor: { select: { anzeigename: true, instagramHandle: true, profilOeffentlich: true } },
      bilder: { select: { id: true }, orderBy: { position: "asc" }, take: 5 },
      review: { select: { gesamtnote: true, geschmacksMatrix: true } },
    },
  });
  return zeilen.map((z) => ({
    slug: z.slug,
    titel: z.titel,
    anriss: z.anriss,
    zitat: juryZitat(z.text),
    autor: { name: z.autor.anzeigename, instagram: z.autor.profilOeffentlich ? z.autor.instagramHandle : null },
    bilder: z.bilder.map((b) => `${ursprung}/api/bild/${b.id}`),
    review: z.review ? { gesamtnote: z.review.gesamtnote, aromen: liebsteAromen(aromenWerte(z.review.geschmacksMatrix), 5) } : null,
  }));
}

/**
 * Setzt Status und Adresse; ein bereits auf Instagram veröffentlichter Beitrag wird nie überschrieben.
 * "geschuetzt" = war schon veröffentlicht (nichts geändert), "fehlt" = kein veröffentlichter Beitrag.
 */
export async function juryIgSetzen(slug: string, igStatus: string, igUrl: string | null): Promise<"ok" | "geschuetzt" | "fehlt"> {
  const prisma = await getPrisma();
  const r = await prisma.juryBeitrag.updateMany({
    where: { slug, status: "VEROEFFENTLICHT", igStatus: { not: IG_GESCHUETZT } },
    data: { igStatus, igUrl },
  });
  if (r.count > 0) return "ok";
  const da = await prisma.juryBeitrag.findFirst({ where: { slug, status: "VEROEFFENTLICHT" }, select: { igStatus: true } });
  return da && !igUeberschreibbar(da.igStatus) ? "geschuetzt" : "fehlt";
}
