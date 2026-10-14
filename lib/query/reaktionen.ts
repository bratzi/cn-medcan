import "server-only";

import type { ZielArt } from "@/db/enums";
import { D1_HAEPPCHEN, inHaeppchen } from "@/lib/haeppchen";
import { getPrisma } from "@/lib/prisma";
import { aktuellesMitglied } from "@/lib/session";

/** D1 nimmt je Abfrage nur rund 100 Bind-Werte; eigeneLikes kürzt die Liste vorher (Zähler lesen in Häppchen). */
const MAX_IDS = D1_HAEPPCHEN;

export async function zaehlerFuer(art: ZielArt, ids: string[]): Promise<Map<string, { likes: number; kommentare: number }>> {
  const karte = new Map<string, { likes: number; kommentare: number }>();
  for (const id of ids) karte.set(id, { likes: 0, kommentare: 0 });
  if (ids.length === 0) return karte;
  const prisma = await getPrisma();
  // Häppchenweise statt Abschneiden: ab der 91. Id fehlte sonst das Herz. Fehlende Zähler bleiben 0.
  const teile = await Promise.all(
    inHaeppchen(ids).map((teil) => prisma.zaehler.findMany({ where: { zielArt: art, zielId: { in: teil } } })),
  );
  for (const z of teile.flat()) karte.set(z.zielId, { likes: z.likes, kommentare: z.kommentare });
  return karte;
}

export async function eigeneLikes(art: ZielArt, ids: string[]): Promise<Set<string>> {
  const liste = ids.slice(0, MAX_IDS);
  if (liste.length === 0) return new Set();
  const ich = await aktuellesMitglied();
  if (!ich) return new Set();
  const prisma = await getPrisma();
  const zeilen = await prisma.like.findMany({
    where: { mitgliedId: ich.mitgliedId, zielArt: art, zielId: { in: liste } },
    select: { zielId: true },
  });
  return new Set(zeilen.map((z) => z.zielId));
}

/**
 * Nur die Likes je Id für die Herzen an Seiten, die statisch bleiben sollen (eine Abfrage je Seite).
 * Ein Fehler lässt die Herzen weg statt die Seite zu kippen: die Karte muss lesbar bleiben.
 */
export async function likeZahlenFuer(art: ZielArt, ids: string[]): Promise<Map<string, number>> {
  try {
    const karte = await zaehlerFuer(art, ids);
    return new Map([...karte].map(([id, z]) => [id, z.likes]));
  } catch (fehler) {
    console.error("likeZahlenFuer fehlgeschlagen", fehler);
    return new Map();
  }
}

/**
 * Zahlen im Profilkopf: Folgende (Zähler des Mitglieds) und Likes auf die eigenen freigegebenen
 * Bewertungen (Summe der Zähler, nie COUNT über die Likes-Zeilen). Die Id-Liste wird in D1-Häppchen
 * geschnitten, die Summen addiert.
 */
export async function ladeReaktionsZahlen(mitgliedId: string): Promise<{ folgende: number; likesErhalten: number }> {
  const prisma = await getPrisma();
  const [folgen, bewertungen] = await Promise.all([
    prisma.zaehler.findUnique({ where: { zielArt_zielId: { zielArt: "MITGLIED", zielId: mitgliedId } }, select: { likes: true } }),
    prisma.review.findMany({ where: { autorId: mitgliedId, freigegeben: true }, select: { id: true } }),
  ]);
  const summen = await Promise.all(
    inHaeppchen(bewertungen.map((b) => b.id)).map((ids) =>
      prisma.zaehler.aggregate({ where: { zielArt: "BEWERTUNG", zielId: { in: ids } }, _sum: { likes: true } }),
    ),
  );
  return { folgende: folgen?.likes ?? 0, likesErhalten: summen.reduce((a, s) => a + (s._sum.likes ?? 0), 0) };
}

export type Gemocht = {
  bewertungen: { id: string; slug: string; handelsname: string }[];
  bluete: { id: string; name: string; slug: string | null }[];
  mitglieder: { id: string; name: string; kurzId: string }[];
};

/**
 * „Gemocht und gefolgt“ auf /profil (eigene Daten): die letzten 30 Likes, nach Art gruppiert, Namen
 * nachgeladen. Fremde Mitglieder nur mit öffentlichem, freigegebenem Profil, Bewertungen nur freigegeben.
 */
export async function ladeGemocht(mitgliedId: string): Promise<Gemocht> {
  const prisma = await getPrisma();
  const likes = await prisma.like.findMany({
    where: { mitgliedId },
    orderBy: { erstelltAm: "desc" },
    take: 30,
    select: { zielArt: true, zielId: true },
  });
  const ids = (art: ZielArt) => likes.filter((l) => l.zielArt === art).map((l) => l.zielId);
  const [bewertungen, kultivare, mitglieder] = await Promise.all([
    ids("BEWERTUNG").length
      ? prisma.review.findMany({ where: { id: { in: ids("BEWERTUNG") }, freigegeben: true, strain: { aktiv: true } }, select: { id: true, strain: { select: { slug: true, handelsname: true } } } })
      : [],
    ids("BLUETE").length
      ? prisma.kultivar.findMany({ where: { id: { in: ids("BLUETE") } }, select: { id: true, name: true, strains: { where: { aktiv: true }, take: 1, select: { slug: true } } } })
      : [],
    ids("MITGLIED").length
      ? prisma.mitglied.findMany({ where: { id: { in: ids("MITGLIED") }, profilOeffentlich: true, freigegeben: true }, select: { id: true, anzeigename: true, kurzId: true } })
      : [],
  ]);
  const nachLike = <T extends { id: string }>(art: ZielArt, zeilen: T[]): T[] => {
    const rang = new Map(ids(art).map((id, i) => [id, i]));
    return [...zeilen].sort((a, b) => (rang.get(a.id) ?? 0) - (rang.get(b.id) ?? 0));
  };
  return {
    bewertungen: nachLike("BEWERTUNG", bewertungen).map((r) => ({ id: r.id, slug: r.strain.slug, handelsname: r.strain.handelsname })),
    bluete: nachLike("BLUETE", kultivare).map((k) => ({ id: k.id, name: k.name, slug: k.strains[0]?.slug ?? null })),
    mitglieder: nachLike("MITGLIED", mitglieder).flatMap((m) => (m.kurzId ? [{ id: m.id, name: m.anzeigename, kurzId: m.kurzId }] : [])),
  };
}
