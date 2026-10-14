"use server";

import type { ZielArt } from "@/db/enums";
import { textFolgt, textLike } from "@/lib/benachrichtigung";
import { likeErlaubt } from "@/lib/like-regeln";
import { getPrisma } from "@/lib/prisma";
import { eigeneLikes } from "@/lib/query/reaktionen";
import { istDoppelt, zaehlerLikesNeu, zaehlerUpsert } from "@/lib/reaktionen";
import { aktuellesMitglied } from "@/lib/session";

export type LikeErgebnis =
  | { ok: true; geliket: boolean; likes: number }
  | { ok: false; fehler: "anmelden" | "freigabe" | "selbst" | "weg" };

/** Obergrenze je Abfrage; der Client schickt Häppchen zu D1_HAEPPCHEN (90). */
const MAX_IDS = 100;
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
  let strainSlug: string | null = null;
  if (art === "BEWERTUNG") {
    const r = await prisma.review.findUnique({ where: { id: zielId }, select: { autorId: true, freigegeben: true, strain: { select: { slug: true } } } });
    if (r) {
      zielAutorId = r.autorId;
      oeffentlich = r.freigegeben;
      strainSlug = r.strain.slug;
    }
  } else if (art === "BLUETE") {
    oeffentlich = (await prisma.kultivar.findUnique({ where: { id: zielId }, select: { id: true } })) !== null;
  } else {
    const m = await prisma.mitglied.findUnique({ where: { id: zielId }, select: { id: true, profilOeffentlich: true, freigegeben: true } });
    if (m) {
      zielAutorId = m.id;
      oeffentlich = m.profilOeffentlich && m.freigegeben;
    }
  }
  const schluessel = { mitgliedId_zielArt_zielId: { mitgliedId: ich.mitgliedId, zielArt: art, zielId } };
  const vorhanden = await prisma.like.findUnique({ where: schluessel, select: { mitgliedId: true } });
  // Zurücknehmen geht immer; nur ein neues Like braucht ein öffentliches Ziel.
  const urteil = likeErlaubt({ art, zielId, ichId: ich.mitgliedId, zielAutorId, oeffentlich, vorhanden: !!vorhanden });
  if (urteil !== "ok") return { ok: false, fehler: urteil };
  let geliket = !vorhanden;
  let neu = !vorhanden;
  try {
    if (vorhanden) {
      // deleteMany statt delete: ein zweiter, gleichzeitiger Klick wirft kein P2025, sondern löscht 0 Zeilen.
      // Der Zähler wird im selben Batch aus der echten Zeilenzahl neu gesetzt (atomar, selbstkorrigierend).
      await prisma.$transaction([
        prisma.like.deleteMany({ where: { mitgliedId: ich.mitgliedId, zielArt: art, zielId } }),
        zaehlerLikesNeu(prisma, art, zielId),
      ]);
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
    const link = folgt
      ? ich.profilOeffentlich && ich.kurzId
        ? `/profil/${ich.kurzId}`
        : null
      : strainSlug
        ? `/blueten/${strainSlug}#bewertung-${zielId}`
        : null;
    const nachrichtArt = folgt ? "FOLGT" : "LIKE";
    // Tagesgrenze in UTC (Workers laufen in UTC).
    const heute = new Date();
    heute.setUTCHours(0, 0, 0, 0);
    const text = folgt ? textFolgt(ich.anzeigename) : textLike(ich.anzeigename);
    // Ohne Link (privates Profil) trennt der Text, wer folgt.
    const schon = await prisma.benachrichtigung.findFirst({
      where: { mitgliedId: zielAutorId, art: nachrichtArt, link, text, erstelltAm: { gte: heute } },
      select: { id: true },
    });
    if (!schon) {
      await prisma.benachrichtigung.create({
        data: {
          mitgliedId: zielAutorId,
          art: nachrichtArt,
          text,
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
  const gueltig = ids.filter((i): i is string => typeof i === "string").slice(0, MAX_IDS);
  return [...(await eigeneLikes(art, gueltig))];
}
