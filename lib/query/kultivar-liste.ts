import { getPrisma } from "@/lib/prisma";
import { TREFFER_PRO_SEITE, type StrainFilter } from "@/lib/query/filter";
import { baueWhere, type StrainListenEintrag } from "@/lib/query/strains";
import { istKultivarTyp, type KultivarTyp } from "@/db/enums";

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
  strains: { kultivarTyp: string; thcMinProzent: number; thcMaxProzent: number; vertreiber: { name: string } | null }[];
};

export type KultivarListenEintrag = {
  id: string;
  name: string;
  /** Adresse der Sortenseite /blueten/<slug>; null, solange kein Slug vergeben ist. */
  slug?: string | null;
  typ: KultivarTyp;
  thcMin: number | null;
  thcMax: number | null;
  /** Vertreibernamen, eindeutig, alphabetisch; unbekannte fehlen. */
  vertreiber: string[];
  handelsnamen: number;
  overall: number | null;
  bewertungen: number;
};

export type KultivarListe = { eintraege: KultivarListenEintrag[]; gesamt: number; seite: number; seitenAnzahl: number };

/** Typ-Mehrheit (Gleichstand: alphabetisch), THC-Spanne und Vertreiber einer Kultivarzeile. */
export function verdichteKultivar(zeile: KultivarZeile): KultivarListenEintrag {
  const typen = new Map<string, number>();
  for (const s of zeile.strains) typen.set(s.kultivarTyp, (typen.get(s.kultivarTyp) ?? 0) + 1);
  const mehrheit = [...typen].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
  const typ: KultivarTyp = mehrheit && istKultivarTyp(mehrheit) ? mehrheit : "HYBRID";
  const vertreiber = [...new Set(zeile.strains.flatMap((s) => (s.vertreiber ? [s.vertreiber.name] : [])))].sort((a, b) =>
    a.localeCompare(b, "de"),
  );
  return {
    id: zeile.id,
    name: zeile.name,
    slug: zeile.slug ?? null,
    typ,
    thcMin: zeile.strains.length > 0 ? Math.min(...zeile.strains.map((s) => s.thcMinProzent)) : null,
    thcMax: zeile.strains.length > 0 ? Math.max(...zeile.strains.map((s) => s.thcMaxProzent)) : null,
    vertreiber,
    handelsnamen: zeile.strains.length,
    overall: zeile.kennwerte?.anzahl ? zeile.kennwerte.gesamtnoteMittel : null,
    bewertungen: zeile.kennwerte?.anzahl ?? 0,
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
          select: { kultivarTyp: true, thcMinProzent: true, thcMaxProzent: true, vertreiber: { select: { name: true } } },
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
