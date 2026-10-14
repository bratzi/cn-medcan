"use server";

import type { ZielArt } from "@/db/enums";
import { textFolgt, textLike } from "@/lib/benachrichtigung";
import { likeErlaubt } from "@/lib/like-regeln";
import { getPrisma } from "@/lib/prisma";
import { eigeneLikes } from "@/lib/query/reaktionen";
import { istDoppelt, zaehlerUpsert } from "@/lib/reaktionen";
import { aktuellesMitglied } from "@/lib/session";

export type LikeErgebnis =
  | { ok: true; geliket: boolean; likes: number }
  | { ok: false; fehler: "anmelden" | "freigabe" | "selbst" | "weg" };

const ARTEN: readonly string[] = ["BEWERTUNG", "BLUETE", "MITGLIED"];

/** Schaltet Like (Blüte, Bewertung) bzw. Folgen (Mitglied) um. Wer handelt, kommt aus der Sitzung. */
export async function schalteLike(art: ZielArt, zielId: string): Promise<LikeErgebnis> {
  if (!ARTEN.includes(art) || typeof zielId !== "string" || zielId.length === 0 || zielId.length > 64) {
    return { ok: false, fehler: "weg" };
  }
  const ich = await aktuellesMitglied();
  if (!ich) return { ok: false, fehler: "anmelden" };
  if (!ich.freigegeben) return { ok: false, fehler: "freigabe" };

  const prisma = await getPrisma();
  let zielAutorId: string | null = null;
  let oeffentlich = false;
  if (art === "BEWERTUNG") {
    const r = await prisma.review.findUnique({ where: { id: zielId }, select: { autorId: true, freigegeben: true } });
    if (r) {
      zielAutorId = r.autorId;
      oeffentlich = r.freigegeben;
    }
  } else if (art === "BLUETE") {
    oeffentlich = (await prisma.kultivar.findUnique({ where: { id: zielId }, select: { id: true } })) !== null;
  } else {
    const m = await prisma.mitglied.findUnique({ where: { id: zielId }, select: { id: true, profilOeffentlich: true } });
    if (m) {
      zielAutorId = m.id;
      oeffentlich = m.profilOeffentlich;
    }
  }
  const urteil = likeErlaubt({ art, zielId, ichId: ich.mitgliedId, zielAutorId, oeffentlich });
  if (urteil !== "ok") return { ok: false, fehler: urteil };

  const schluessel = { mitgliedId_zielArt_zielId: { mitgliedId: ich.mitgliedId, zielArt: art, zielId } };
  const vorhanden = await prisma.like.findUnique({ where: schluessel, select: { mitgliedId: true } });
  let geliket = !vorhanden;
  let neu = !vorhanden;
  try {
    if (vorhanden) {
      await prisma.$transaction([prisma.like.delete({ where: schluessel }), zaehlerUpsert(prisma, art, zielId, "likes", -1)]);
    } else {
      await prisma.$transaction([
        prisma.like.create({ data: { mitgliedId: ich.mitgliedId, zielArt: art, zielId } }),
        zaehlerUpsert(prisma, art, zielId, "likes", 1),
      ]);
    }
  } catch (e) {
    if (!istDoppelt(e)) throw e;
    // Gleichzeitiger Klick: Zustand neu lesen, keine zweite Benachrichtigung.
    neu = false;
    geliket = (await eigeneLikes(art, [zielId])).has(zielId);
  }

  if (neu && zielAutorId) {
    const folgt = art === "MITGLIED";
    const link = folgt ? "/profil" : `/profil#bewertung-${zielId}`;
    const nachrichtArt = folgt ? "FOLGT" : "LIKE";
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const schon = await prisma.benachrichtigung.findFirst({
      where: { mitgliedId: zielAutorId, art: nachrichtArt, link, erstelltAm: { gte: heute } },
      select: { id: true },
    });
    if (!schon) {
      await prisma.benachrichtigung.create({
        data: {
          mitgliedId: zielAutorId,
          art: nachrichtArt,
          text: folgt ? textFolgt(ich.anzeigename) : textLike(ich.anzeigename),
          parameter: JSON.stringify({ name: ich.anzeigename }),
          link,
        },
      });
    }
  }

  const z = await prisma.zaehler.findUnique({ where: { zielArt_zielId: { zielArt: art, zielId } }, select: { likes: true } });
  return { ok: true, geliket, likes: z?.likes ?? 0 };
}

export async function ladeEigeneLikes(art: ZielArt, ids: string[]): Promise<string[]> {
  if (!Array.isArray(ids)) return [];
  return [...(await eigeneLikes(art, ids.filter((i): i is string => typeof i === "string")))];
}
