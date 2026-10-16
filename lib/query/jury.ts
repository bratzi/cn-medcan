import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import { favouritenSortenIds, sichtbar } from "@/lib/jury";
import { getPrisma } from "@/lib/prisma";

export type JuryBildMeta = { id: string; breite: number; hoehe: number; symbolbild: boolean; alt: string };

export type JuryKarte = {
  slug: string;
  titel: string;
  anriss: string;
  autor: { name: string; kurzId: string | null };
  veroeffentlichtAm: Date;
  titelbild: JuryBildMeta | null;
  sorte: { name: string; slug: string | null } | null;
};

export type JuryBeitragVoll = JuryKarte & {
  text: string;
  autorAvatarId: string | null;
  autorInstagram: string | null;
  bilder: JuryBildMeta[];
  igUrl: string | null;
  ausgabe: { slug: string; titel: string } | null;
  review: {
    id: string;
    strainSlug: string;
    kultivarSlug: string | null;
    vertreiberId: string | null;
    vertreiberName: string | null;
    gesamtnote: number | null;
  } | null;
};

const BILD_META = { id: true, position: true, breite: true, hoehe: true, symbolbild: true, alt: true } as const;
const KARTE_SELECT = {
  slug: true, titel: true, anriss: true, veroeffentlichtAm: true,
  autor: { select: { anzeigename: true, kurzId: true, profilOeffentlich: true } },
  bilder: { select: BILD_META, orderBy: { position: "asc" }, take: 5 },
  review: { select: { kultivar: { select: { name: true, slug: true } } } },
} as const;
/** Öffentlich: Beitrag veröffentlicht, Ausgabe fehlt oder ist veröffentlicht (gleich `sichtbar`). */
const OEFFENTLICH: Prisma.JuryBeitragWhereInput = {
  status: "VEROEFFENTLICHT",
  OR: [{ ausgabeId: null }, { ausgabe: { status: "VEROEFFENTLICHT" } }],
};

const SEITE = 12;

export type KartenZeile = {
  slug: string; titel: string; anriss: string; veroeffentlichtAm: Date | null;
  autor: { anzeigename: string; kurzId: string | null; profilOeffentlich: boolean };
  bilder: (JuryBildMeta & { position: number })[];
  review: { kultivar: { name: string; slug: string | null } | null } | null;
};

function bildMeta(b: JuryBildMeta): JuryBildMeta {
  return { id: b.id, breite: b.breite, hoehe: b.hoehe, symbolbild: b.symbolbild, alt: b.alt };
}

export function zuKarte(z: KartenZeile): JuryKarte {
  const erstes = [...z.bilder].sort((a, b) => a.position - b.position)[0];
  return {
    slug: z.slug, titel: z.titel, anriss: z.anriss, veroeffentlichtAm: z.veroeffentlichtAm ?? new Date(0),
    autor: { name: z.autor.anzeigename, kurzId: z.autor.profilOeffentlich ? z.autor.kurzId : null },
    titelbild: erstes ? bildMeta(erstes) : null,
    sorte: z.review?.kultivar ? { name: z.review.kultivar.name, slug: z.review.kultivar.slug } : null,
  };
}

export async function ladeJuryStart(seite: number): Promise<{
  aufmacher: { slug: string; titel: string; einleitung: string; erscheintAm: Date | null; beitraege: JuryKarte[] } | null;
  beitraege: JuryKarte[];
  seitenAnzahl: number;
}> {
  const prisma = await getPrisma();
  const s = Number.isInteger(seite) && seite > 0 ? seite : 1;
  const [ausgabe, zeilen, anzahl] = await Promise.all([
    prisma.juryAusgabe.findFirst({
      where: { status: "VEROEFFENTLICHT" },
      orderBy: { erscheintAm: "desc" },
      take: 1,
      select: {
        slug: true, titel: true, einleitung: true, erscheintAm: true,
        beitraege: { where: OEFFENTLICH, orderBy: { position: "asc" }, take: 30, select: KARTE_SELECT },
      },
    }),
    prisma.juryBeitrag.findMany({
      where: OEFFENTLICH,
      orderBy: { veroeffentlichtAm: "desc" },
      skip: (s - 1) * SEITE,
      take: SEITE,
      select: KARTE_SELECT,
    }),
    prisma.juryBeitrag.count({ where: OEFFENTLICH }),
  ]);
  return {
    aufmacher: ausgabe
      ? {
          slug: ausgabe.slug, titel: ausgabe.titel, einleitung: ausgabe.einleitung,
          erscheintAm: ausgabe.erscheintAm, beitraege: ausgabe.beitraege.map(zuKarte),
        }
      : null,
    beitraege: zeilen.map(zuKarte),
    seitenAnzahl: Math.max(1, Math.ceil(anzahl / SEITE)),
  };
}

export async function ladeJuryBeitrag(slug: string): Promise<JuryBeitragVoll | null> {
  const prisma = await getPrisma();
  const z = await prisma.juryBeitrag.findUnique({
    where: { slug },
    select: {
      ...KARTE_SELECT,
      autor: {
        select: {
          anzeigename: true, kurzId: true, profilOeffentlich: true, instagramHandle: true,
          avatar: { select: { id: true } },
        },
      },
      text: true, igUrl: true, status: true,
      bilder: { select: BILD_META, orderBy: { position: "asc" }, take: 5 },
      ausgabe: { select: { slug: true, titel: true, status: true } },
      review: {
        select: {
          id: true, vertreiberId: true, gesamtnote: true,
          vertreiber: { select: { name: true } },
          kultivar: { select: { name: true, slug: true } },
          strain: { select: { slug: true } },
        },
      },
    },
  });
  if (!z || !sichtbar(z)) return null;
  return {
    ...zuKarte(z),
    text: z.text,
    autorAvatarId: z.autor.profilOeffentlich ? (z.autor.avatar?.id ?? null) : null,
    autorInstagram: z.autor.instagramHandle,
    bilder: z.bilder.map(bildMeta),
    igUrl: z.igUrl,
    ausgabe: z.ausgabe ? { slug: z.ausgabe.slug, titel: z.ausgabe.titel } : null,
    review: z.review
      ? {
          id: z.review.id,
          strainSlug: z.review.strain.slug,
          kultivarSlug: z.review.kultivar?.slug ?? null,
          vertreiberId: z.review.vertreiberId,
          vertreiberName: z.review.vertreiber?.name ?? null,
          gesamtnote: z.review.gesamtnote,
        }
      : null,
  };
}

export async function ladeJuryAusgabe(slug: string): Promise<{
  titel: string; einleitung: string; erscheintAm: Date | null; beitraege: JuryKarte[];
} | null> {
  const prisma = await getPrisma();
  const a = await prisma.juryAusgabe.findFirst({
    where: { slug, status: "VEROEFFENTLICHT" },
    select: {
      titel: true, einleitung: true, erscheintAm: true,
      beitraege: { where: OEFFENTLICH, orderBy: { position: "asc" }, take: 60, select: KARTE_SELECT },
    },
  });
  if (!a) return null;
  return { titel: a.titel, einleitung: a.einleitung, erscheintAm: a.erscheintAm, beitraege: a.beitraege.map(zuKarte) };
}

/** Jury-Bewertung in den Favourites: ohne Note und ohne Bilder, verlinkt auf die Blüte. */
export type JuryFavBewertung = {
  id: string;
  sorte: string;
  kultivarSlug: string | null;
  autor: { name: string; kurzId: string | null };
  erstelltAm: Date;
};

/**
 * Favourites der Jury (Spec 2026-10-16, Nutzer 2026-10-16): Beiträge mit verknüpfter Bewertung aus
 * veröffentlichten Ausgaben und dazu die sichtbaren Bewertungen von Jury-Mitgliedern zu Blüten, die einen
 * sichtbaren Jury-Beitrag haben oder eine beendete Community-Abstimmung gewonnen haben. Beides neueste zuerst,
 * nie nach Note (HWG).
 */
export async function ladeJuryFavourites(): Promise<{ karten: JuryKarte[]; bewertungen: JuryFavBewertung[] }> {
  const prisma = await getPrisma();
  const [zeilen, beitragSorten, gewinner] = await Promise.all([
    prisma.juryBeitrag.findMany({
      where: { status: "VEROEFFENTLICHT", reviewId: { not: null }, ausgabe: { status: "VEROEFFENTLICHT" } },
      orderBy: { veroeffentlichtAm: "desc" },
      take: 60,
      select: KARTE_SELECT,
    }),
    prisma.juryBeitrag.findMany({
      where: { ...OEFFENTLICH, reviewId: { not: null } },
      orderBy: { veroeffentlichtAm: "desc" },
      take: 50,
      select: { review: { select: { strainId: true } } },
    }),
    prisma.umfrageOption.findMany({
      where: { istGewinner: true, umfrage: { phase: "BEENDET" } },
      orderBy: { erstelltAm: "desc" },
      take: 50,
      select: { strainId: true },
    }),
  ]);
  const sorten = favouritenSortenIds(
    beitragSorten.map((z) => z.review?.strainId ?? null),
    gewinner.map((g) => g.strainId),
  );
  const reviews = sorten.length
    ? await prisma.review.findMany({
        where: { strainId: { in: sorten }, freigegeben: true, autor: { jury: true } },
        orderBy: { erstelltAm: "desc" },
        take: 50,
        select: {
          id: true, erstelltAm: true,
          strain: { select: { handelsname: true } },
          kultivar: { select: { name: true, slug: true } },
          autor: { select: { anzeigename: true, kurzId: true, profilOeffentlich: true } },
        },
      })
    : [];
  return {
    karten: zeilen.map(zuKarte),
    bewertungen: reviews.map((r) => ({
      id: r.id,
      sorte: r.kultivar?.name ?? r.strain.handelsname,
      kultivarSlug: r.kultivar?.slug ?? null,
      autor: { name: r.autor?.anzeigename ?? "", kurzId: r.autor?.profilOeffentlich ? r.autor.kurzId : null },
      erstelltAm: r.erstelltAm,
    })),
  };
}

export async function ladeJuryTeam(): Promise<
  { id: string; name: string; kurzId: string | null; instagram: string | null; avatarId: string | null; beitraege: number }[]
> {
  const prisma = await getPrisma();
  const m = await prisma.mitglied.findMany({
    where: { jury: true, profilOeffentlich: true, freigegeben: true },
    orderBy: { anzeigename: "asc" },
    take: 50,
    select: {
      id: true, anzeigename: true, kurzId: true, instagramHandle: true, avatar: { select: { id: true } },
      _count: { select: { juryBeitraege: { where: OEFFENTLICH } } },
    },
  });
  return m.map((x) => ({
    id: x.id, name: x.anzeigename, kurzId: x.kurzId, instagram: x.instagramHandle, avatarId: x.avatar?.id ?? null, beitraege: x._count.juryBeitraege,
  }));
}

/** Sichtbare Jury-Beiträge zu Bewertungen: Bewertungs-Id zu Beitrags-Slug (Sortenseite, „Jury-Beitrag lesen“). */
export async function ladeJuryBeitraegeZuBewertungen(reviewIds: readonly string[]): Promise<Map<string, string>> {
  if (reviewIds.length === 0) return new Map();
  const prisma = await getPrisma();
  const zeilen = await prisma.juryBeitrag.findMany({
    where: { reviewId: { in: [...reviewIds].slice(0, 50) }, ...OEFFENTLICH },
    orderBy: { veroeffentlichtAm: "desc" },
    take: 50,
    select: { reviewId: true, slug: true },
  });
  const karte = new Map<string, string>();
  for (const z of zeilen) if (z.reviewId && !karte.has(z.reviewId)) karte.set(z.reviewId, z.slug);
  return karte;
}

/** Jury-Flag und die neuesten sichtbaren Beiträge (höchstens 6) eines Mitglieds, für sein öffentliches Profil. */
export async function ladeJuryProfil(
  mitgliedId: string,
): Promise<{ jury: boolean; beitraege: { slug: string; titel: string; veroeffentlichtAm: Date | null }[] }> {
  const prisma = await getPrisma();
  const m = await prisma.mitglied.findUnique({
    where: { id: mitgliedId },
    select: {
      jury: true,
      juryBeitraege: {
        where: OEFFENTLICH,
        orderBy: { veroeffentlichtAm: "desc" },
        take: 6,
        select: { slug: true, titel: true, veroeffentlichtAm: true },
      },
    },
  });
  return m?.jury ? { jury: true, beitraege: m.juryBeitraege } : { jury: false, beitraege: [] };
}

/** Der neueste sichtbare Beitrag für die Startseite; null, solange es keinen gibt. */
export async function ladeNeuestenJuryBeitrag(): Promise<JuryKarte | null> {
  const prisma = await getPrisma();
  const z = await prisma.juryBeitrag.findFirst({
    where: OEFFENTLICH,
    orderBy: { veroeffentlichtAm: "desc" },
    select: KARTE_SELECT,
  });
  return z ? zuKarte(z) : null;
}
