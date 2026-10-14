import { getPrisma } from "@/lib/prisma";
import { aktuellesMitglied } from "@/lib/session";
import { darfLoeschen } from "@/lib/kommentar-rechte";
import type { KommentarZiel } from "@/db/enums";

/**
 * Kommentare lesen (Spec 2026-10-14). Nur SICHTBAR, älteste zuerst, 20 je Seite.
 * Der Cursor `vor` ist die ISO-Zeit des letzten bisher gezeigten Eintrags.
 */
export const KOMMENTARE_JE_SEITE = 20;

export type KommentarAnsicht = {
  id: string;
  text: string;
  erstelltAm: string;
  /** kurzId nur bei öffentlichem Profil, sonst null. */
  autor: { name: string; avatarId: string | null; kurzId: string | null };
  darfLoeschen: boolean;
};

export type KommentarZeile = {
  id: string;
  text: string;
  erstelltAm: Date;
  autorId: string;
  autor: { anzeigename: string; profilOeffentlich: boolean; kurzId: string | null; avatar: { id: string } | null };
};

export const KOMMENTAR_SELECT = {
  id: true,
  text: true,
  erstelltAm: true,
  autorId: true,
  autor: { select: { anzeigename: true, profilOeffentlich: true, kurzId: true, avatar: { select: { id: true } } } },
} as const;

/** Was die Aktionen von einem Kommentar wissen müssen (Autor, Ziel, Status). */
export const KOMMENTAR_KOPF = { autorId: true, zielArt: true, zielId: true, status: true } as const;

/** Was beim Schreiben von einer Bewertung gebraucht wird. */
export const REVIEW_ZIEL = { freigegeben: true, autorId: true, strain: { select: { kultivarId: true } } } as const;

export function zuAnsicht(z: KommentarZeile, darf: boolean): KommentarAnsicht {
  return {
    id: z.id,
    text: z.text,
    erstelltAm: z.erstelltAm.toISOString(),
    autor: {
      name: z.autor.anzeigename,
      avatarId: z.autor.avatar?.id ?? null,
      kurzId: z.autor.profilOeffentlich ? z.autor.kurzId : null,
    },
    darfLoeschen: darf,
  };
}

/** Inhaber des Ziels: Autor der Bewertung bzw. Profilinhaber. Leer, wenn es keinen gibt. */
export async function inhaberVon(ziel: KommentarZiel, zielId: string): Promise<string> {
  if (ziel === "PROFIL") return zielId;
  const prisma = await getPrisma();
  const review = await prisma.review.findUnique({ where: { id: zielId }, select: { autorId: true } });
  return review?.autorId ?? "";
}

export async function ladeKommentare(
  ziel: KommentarZiel,
  zielId: string,
  vor?: string,
): Promise<{ eintraege: KommentarAnsicht[]; weitere: boolean }> {
  const prisma = await getPrisma();
  const ab = vor ? new Date(vor) : null;
  const zeilen = await prisma.kommentar.findMany({
    where: {
      zielArt: ziel,
      zielId,
      status: "SICHTBAR",
      ...(ab && !Number.isNaN(ab.getTime()) ? { erstelltAm: { gt: ab } } : {}),
    },
    orderBy: { erstelltAm: "asc" },
    take: KOMMENTARE_JE_SEITE + 1,
    select: KOMMENTAR_SELECT,
  });
  const weitere = zeilen.length > KOMMENTARE_JE_SEITE;
  const seite = zeilen.slice(0, KOMMENTARE_JE_SEITE);

  // Löschrecht nur mit Sitzung; ohne Sitzung nie darfLoeschen (leere ichId wäre fatal).
  const ich = await aktuellesMitglied();
  const inhaberId = ich && seite.length > 0 ? await inhaberVon(ziel, zielId) : "";
  return {
    eintraege: seite.map((z) =>
      zuAnsicht(
        z,
        ich ? darfLoeschen({ ichId: ich.mitgliedId, istAdmin: ich.rolle === "ADMIN", autorId: z.autorId, inhaberId }) : false,
      ),
    ),
    weitere,
  };
}
