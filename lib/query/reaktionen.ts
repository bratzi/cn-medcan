import "server-only";

import type { ZielArt } from "@/db/enums";
import { getPrisma } from "@/lib/prisma";
import { aktuellesMitglied } from "@/lib/session";

/** D1 nimmt je Abfrage nur rund 100 Bind-Werte; Listen werden vorher gekürzt. */
const MAX_IDS = 100;

export async function zaehlerFuer(art: ZielArt, ids: string[]): Promise<Map<string, { likes: number; kommentare: number }>> {
  const karte = new Map<string, { likes: number; kommentare: number }>();
  const liste = ids.slice(0, MAX_IDS);
  for (const id of liste) karte.set(id, { likes: 0, kommentare: 0 });
  if (liste.length === 0) return karte;
  const prisma = await getPrisma();
  const zeilen = await prisma.zaehler.findMany({ where: { zielArt: art, zielId: { in: liste } } });
  for (const z of zeilen) karte.set(z.zielId, { likes: z.likes, kommentare: z.kommentare });
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
