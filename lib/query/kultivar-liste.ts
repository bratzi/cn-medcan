import { getPrisma } from "@/lib/prisma";
import { TREFFER_PRO_SEITE, type StrainFilter } from "@/lib/query/filter";
import { baueWhere, type StrainListenEintrag } from "@/lib/query/strains";
import { istGeschmacksKategorie, istKultivarTyp, type GeschmacksKategorie, type KultivarTyp } from "@/db/enums";

/**
 * Je Kultivar die Ids seiner Vertreiber mit aktivem Handelsnamen (ohne unbekannte).
 * D1 erlaubt höchstens 100 gebundene Parameter je Statement: der Aufrufer übergibt
 * höchstens eine Katalogseite (24) an Ids, das passt.
 */
export async function ladeVertreiberJeKultivar(kultivarIds: readonly string[]): Promise<Map<string, Set<string>>> {
  const ids = [...new Set(kultivarIds)];
  const ergebnis = new Map<string, Set<string>>();
  if (ids.length === 0) return ergebnis;
  const prisma = await getPrisma();
  const gruppen = await prisma.strain.groupBy({
    by: ["kultivarId", "vertreiberId"],
    where: { aktiv: true, kultivarId: { in: ids }, vertreiberId: { not: null } },
  });
  for (const g of gruppen) {
    if (!g.kultivarId || !g.vertreiberId) continue;
    const menge = ergebnis.get(g.kultivarId) ?? new Set<string>();
    menge.add(g.vertreiberId);
    ergebnis.set(g.kultivarId, menge);
  }
  return ergebnis;
}

/** „auch bei N weiteren Vertreibern“: Vertreiber derselben Blüte ohne den eigenen (Spec 2.2). */
export function weitereVertreiber(
  eintrag: Pick<StrainListenEintrag, "kultivarId" | "vertreiberId">,
  jeKultivar: ReadonlyMap<string, ReadonlySet<string>>,
): number {
  if (!eintrag.kultivarId) return 0;
  const menge = jeKultivar.get(eintrag.kultivarId);
  if (!menge) return 0;
  return menge.size - (eintrag.vertreiberId && menge.has(eintrag.vertreiberId) ? 1 : 0);
}

export type KultivarZeile = {
  id: string;
  name: string;
  slug?: string | null;
  kennwerte: { gesamtnoteMittel: number | null; anzahl: number } | null;
  strains: { slug?: string; herstellerBildPfad?: string | null; kultivarTyp: string; thcMinProzent: number; thcMaxProzent: number; cbdMinProzent?: number; cbdMaxProzent?: number;
    terpene?: { rang: number; terpen: { name: string; geschmack: string } }[];
    vertreiber: { name: string } | null }[];
};

export type KultivarListenEintrag = {
  id: string;
  name: string;
  /** Adresse der Sortenseite /blueten/<slug>; null, solange kein Slug vergeben ist. */
  slug?: string | null;
  typ: KultivarTyp;
  thcMin: number | null;
  thcMax: number | null;
  cbdMin: number | null;
  cbdMax: number | null;
  /** Häufigste dominante Terpene über alle Handelsnamen, höchstens drei; Rang 1 ist das stärkste. */
  terpene: { name: string; geschmack: GeschmacksKategorie | null; rang: number }[];
  /** Vertreibernamen, eindeutig, alphabetisch; unbekannte fehlen. */
  vertreiber: string[];
  handelsnamen: number;
  overall: number | null;
  bewertungen: number;
  /** Musterbild wie auf der Karte des ersten Handelsnamens, solange kein Budpic da ist. */
  bildSlug: string | null;
  herstellerBildPfad: string | null;
};

export type KultivarListe = { eintraege: KultivarListenEintrag[]; gesamt: number; seite: number; seitenAnzahl: number };

/** Top drei Terpene einer Blüte: Punkte 4 minus Rang je Handelsname, Gleichstand alphabetisch. */
function topTerpene(strains: KultivarZeile["strains"]): KultivarListenEintrag["terpene"] {
  const punkte = new Map<string, { punkte: number; geschmack: string }>();
  for (const s of strains)
    for (const t of s.terpene ?? []) {
      const alt = punkte.get(t.terpen.name);
      punkte.set(t.terpen.name, { punkte: (alt?.punkte ?? 0) + 4 - t.rang, geschmack: t.terpen.geschmack });
    }
  return [...punkte]
    .sort((a, b) => b[1].punkte - a[1].punkte || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([name, p], i) => ({ name, geschmack: istGeschmacksKategorie(p.geschmack) ? p.geschmack : null, rang: i + 1 }));
}

/** Typ-Mehrheit (Gleichstand: alphabetisch), THC-Spanne und Vertreiber einer Kultivarzeile. */
export function verdichteKultivar(zeile: KultivarZeile): KultivarListenEintrag {
  const typen = new Map<string, number>();
  for (const s of zeile.strains) typen.set(s.kultivarTyp, (typen.get(s.kultivarTyp) ?? 0) + 1);
  const mehrheit = [...typen].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
  const typ: KultivarTyp = mehrheit && istKultivarTyp(mehrheit) ? mehrheit : "HYBRID";
  const vertreiber = [...new Set(zeile.strains.flatMap((s) => (s.vertreiber ? [s.vertreiber.name] : [])))].sort((a, b) =>
    a.localeCompare(b, "de"),
  );
  const cbd = zeile.strains.filter((s) => s.cbdMinProzent !== undefined && s.cbdMaxProzent !== undefined);
  return {
    id: zeile.id,
    name: zeile.name,
    slug: zeile.slug ?? null,
    typ,
    thcMin: zeile.strains.length > 0 ? Math.min(...zeile.strains.map((s) => s.thcMinProzent)) : null,
    thcMax: zeile.strains.length > 0 ? Math.max(...zeile.strains.map((s) => s.thcMaxProzent)) : null,
    cbdMin: cbd.length > 0 ? Math.min(...cbd.map((s) => s.cbdMinProzent ?? 0)) : null,
    cbdMax: cbd.length > 0 ? Math.max(...cbd.map((s) => s.cbdMaxProzent ?? 0)) : null,
    terpene: topTerpene(zeile.strains),
    vertreiber,
    handelsnamen: zeile.strains.length,
    overall: zeile.kennwerte?.anzahl ? zeile.kennwerte.gesamtnoteMittel : null,
    bewertungen: zeile.kennwerte?.anzahl ?? 0,
    bildSlug: zeile.strains[0]?.slug ?? null,
    herstellerBildPfad: zeile.strains.find((s) => s.herstellerBildPfad)?.herstellerBildPfad ?? null,
  };
}

/** Ansicht je Blüte (Spec 2.3): Kultivare mit mindestens einem passenden Handelsnamen, nach Name. */
export async function ladeKultivarListe(filter: StrainFilter, fachkreis: boolean): Promise<KultivarListe> {
  const prisma = await getPrisma();
  const strainWhere = baueWhere(filter, fachkreis);
  const where = { strains: { some: strainWhere } };
  const seite = Math.max(1, filter.seite);
  const [zeilen, gesamt] = await Promise.all([
    prisma.kultivar.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (seite - 1) * TREFFER_PRO_SEITE,
      take: TREFFER_PRO_SEITE,
      select: {
        id: true,
        name: true,
        slug: true,
        kennwerte: { select: { gesamtnoteMittel: true, anzahl: true } },
        strains: {
          where: strainWhere,
          select: { slug: true, herstellerBildPfad: true, kultivarTyp: true, thcMinProzent: true,
            thcMaxProzent: true,
            cbdMinProzent: true,
            cbdMaxProzent: true,
            vertreiber: { select: { name: true } },
            // Ohne Bilder; je Handelsname nur die drei dominanten Terpene.
            terpene: { where: { rang: { lte: 3 } }, orderBy: { rang: "asc" }, take: 3, select: { rang: true, terpen: { select: { name: true, geschmack: true } } } },
          },
          orderBy: { slug: "asc" },
          take: 50,
        },
      },
    }),
    prisma.kultivar.count({ where }),
  ]);
  return {
    eintraege: zeilen.map(verdichteKultivar),
    gesamt,
    seite,
    seitenAnzahl: Math.max(1, Math.ceil(gesamt / TREFFER_PRO_SEITE)),
  };
}

/** Name einer Blüte für den Filter-Chip; null, wenn die Id unbekannt ist. */
export async function ladeKultivarName(id: string): Promise<string | null> {
  const prisma = await getPrisma();
  const k = await prisma.kultivar.findUnique({ where: { id }, select: { name: true } });
  return k?.name ?? null;
}
