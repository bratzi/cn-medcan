import { getPrisma } from "@/lib/prisma";
import { MIN_BEWERTUNGEN, ordneNoten, STATISTIK_MAX, type BuchStatistik, type StatistikEintrag } from "@/lib/buch-statistik";

const KENNWERTE_MAX = 200;
const ZAEHLER_PUFFER = 20; // nicht freigegebene Bewertungen fallen nachträglich raus

/**
 * Vorberechnete Zahlen für den Reiter Bewertungen.
 * Kein `"use cache"`/`unstable_cache`: das Repo cacht bewusst nicht (siehe Hinweis in strains.ts, Bindings
 * fehlen); die Abfragen laufen auf Zählern und Kennwerten, sind also billig. Später mit Tag "buch-statistik" wickeln.
 */
export async function ladeBuchStatistik(): Promise<BuchStatistik> {
  const prisma = await getPrisma();
  const [meist, kennwerte, bluetenZ, bewKomm, bewLikes] = await Promise.all([
    prisma.kultivarKennwerte.findMany({
      orderBy: { anzahl: "desc" },
      take: STATISTIK_MAX,
      select: { kultivarId: true, anzahl: true, kultivar: { select: { name: true } } },
    }),
    prisma.kultivarKennwerte.findMany({
      where: { anzahl: { gte: MIN_BEWERTUNGEN } },
      select: { kultivarId: true, anzahl: true, gesamtnoteMittel: true, kultivar: { select: { name: true } } },
      orderBy: { anzahl: "desc" },
      take: KENNWERTE_MAX,
    }),
    prisma.zaehler.findMany({
      where: { zielArt: "BLUETE", kommentare: { gt: 0 } },
      orderBy: { kommentare: "desc" },
      take: STATISTIK_MAX,
    }),
    prisma.zaehler.findMany({
      where: { zielArt: "BEWERTUNG", kommentare: { gt: 0 } },
      orderBy: { kommentare: "desc" },
      take: STATISTIK_MAX + ZAEHLER_PUFFER,
    }),
    prisma.zaehler.findMany({
      where: { zielArt: "BEWERTUNG", likes: { gt: 0 } },
      orderBy: { likes: "desc" },
      take: STATISTIK_MAX + ZAEHLER_PUFFER,
    }),
  ]);

  // href trägt hier noch die Kultivar-Id; die Slugs werden erst für die Gewinner nachgeladen.
  const zeilen = kennwerte.map((k) => ({ titel: k.kultivar.name, href: k.kultivarId, mittel: k.gesamtnoteMittel, anzahl: k.anzahl }));
  const best = ordneNoten(zeilen, "best");
  const niedrigst = ordneNoten(zeilen, "niedrigst");
  const namenKennwerte = new Map(kennwerte.map((k) => [k.kultivarId, k.kultivar.name]));
  const kultivarIds = [
    ...new Set([
      ...meist.map((m) => m.kultivarId),
      ...best.map((e) => e.href),
      ...niedrigst.map((e) => e.href),
      ...bluetenZ.map((b) => b.zielId),
    ]),
  ];
  const bewertungIds = [...new Set([...bewKomm, ...bewLikes].map((b) => b.zielId))];

  const [strains, kultivare, reviews] = await Promise.all([
    kultivarIds.length
      ? prisma.strain.findMany({
          where: { aktiv: true, kultivarId: { in: kultivarIds } },
          select: { kultivarId: true, slug: true },
          orderBy: { slug: "asc" },
          take: 90,
        })
      : [],
    kultivarIds.length
      ? prisma.kultivar.findMany({ where: { id: { in: kultivarIds } }, select: { id: true, name: true }, take: 90 })
      : [],
    bewertungIds.length
      ? prisma.review.findMany({
          where: { id: { in: bewertungIds }, freigegeben: true },
          select: { id: true, strain: { select: { slug: true, handelsname: true } } },
          take: 90,
        })
      : [],
  ]);

  const slugJeKultivar = new Map<string, string>();
  for (const s of strains) if (s.kultivarId && !slugJeKultivar.has(s.kultivarId)) slugJeKultivar.set(s.kultivarId, s.slug);
  const name = new Map(kultivare.map((k) => [k.id, k.name]));
  for (const [id, n] of namenKennwerte) if (!name.has(id)) name.set(id, n);
  const review = new Map(reviews.map((r) => [r.id, r.strain]));

  const blute = (id: string, wert: number): StatistikEintrag | null => {
    const slug = slugJeKultivar.get(id);
    const titel = name.get(id);
    return slug && titel ? { titel, href: `/blueten/${slug}`, wert } : null;
  };
  const bluten = (zeilen: StatistikEintrag[]) =>
    zeilen.flatMap((e) => blute(e.href, e.wert) ?? []);
  const bewertung = (zeilen: { zielId: string }[], wert: (index: number) => number) =>
    zeilen
      .flatMap((z, i) => {
        const s = review.get(z.zielId);
        return s ? [{ titel: s.handelsname, href: `/blueten/${s.slug}#bewertung-${z.zielId}`, wert: wert(i) }] : [];
      })
      .slice(0, STATISTIK_MAX);

  return {
    meistBewertet: meist.flatMap((m) => blute(m.kultivarId, m.anzahl) ?? []),
    best: bluten(best),
    niedrigst: bluten(niedrigst),
    bluetenKommentare: bluetenZ.flatMap((b) => blute(b.zielId, b.kommentare) ?? []),
    bewertungenKommentare: bewertung(bewKomm, (i) => bewKomm[i].kommentare),
    bewertungenLikes: bewertung(bewLikes, (i) => bewLikes[i].likes),
  };
}
