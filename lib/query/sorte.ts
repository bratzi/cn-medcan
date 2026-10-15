import { getPrisma } from "@/lib/prisma";
import type { KennwerteZeile } from "@/lib/query/strains";
import { istKultivarTyp, type KultivarTyp } from "@/db/enums";
import { sortenWeiterleitung } from "@/lib/alte-adressen";

export type WareProdukt = {
  id: string;
  slug: string;
  handelsname: string;
  thcMin: number;
  thcMax: number;
  cbdMin: number;
  cbdMax: number;
};

/** Eine Ware = Sorte bei einem Vertreiber, mit ihren Stärken (Spec Sorte im Fokus, 3). */
export type WareKarte = {
  vertreiberId: string;
  vertreiberName: string;
  produkte: WareProdukt[];
  anzahl: number;
  gesamtnoteMittel: number | null;
};

export type SorteDetail = {
  kultivar: { id: string; name: string; slug: string; typ: KultivarTyp; genetik: string | null };
  spanne: { thcMin: number | null; thcMax: number | null; cbdMin: number | null; cbdMax: number | null };
  kennwerte: (KennwerteZeile & { gesamtnoteMittel: number | null }) | null;
  waren: WareKarte[];
};

/** Produkte ohne Vertreiber sammeln sich unter dieser Id; die Bewertung kennt sie nicht als Vertreiber. */
export const UNBEKANNTER_VERTREIBER = "";

type ProduktZeile = WareProdukt & { vertreiberId: string | null; vertreiberName: string | null; kultivarTyp: string; genetik: string | null };

/** Gruppiert Produkte je Vertreiber; Reihenfolge nach Anzahl Bewertungen, dann Name (nie nach Note, HWG). */
export function gruppiereWaren(
  produkte: readonly ProduktZeile[],
  kennwerte: ReadonlyMap<string, { anzahl: number; gesamtnoteMittel: number | null }>,
): WareKarte[] {
  const jeVertreiber = new Map<string, WareKarte>();
  for (const p of produkte) {
    const id = p.vertreiberId ?? UNBEKANNTER_VERTREIBER;
    let ware = jeVertreiber.get(id);
    if (!ware) {
      const k = kennwerte.get(id);
      ware = { vertreiberId: id, vertreiberName: p.vertreiberName ?? "", produkte: [], anzahl: k?.anzahl ?? 0, gesamtnoteMittel: k?.gesamtnoteMittel ?? null };
      jeVertreiber.set(id, ware);
    }
    ware.produkte.push({ id: p.id, slug: p.slug, handelsname: p.handelsname, thcMin: p.thcMin, thcMax: p.thcMax, cbdMin: p.cbdMin, cbdMax: p.cbdMax });
  }
  for (const w of jeVertreiber.values()) w.produkte.sort((a, b) => a.thcMax - b.thcMax || a.handelsname.localeCompare(b.handelsname, "de"));
  return [...jeVertreiber.values()].sort((a, b) => b.anzahl - a.anzahl || a.vertreiberName.localeCompare(b.vertreiberName, "de"));
}

function spanneAus(produkte: readonly WareProdukt[]): SorteDetail["spanne"] {
  if (produkte.length === 0) return { thcMin: null, thcMax: null, cbdMin: null, cbdMax: null };
  return {
    thcMin: Math.min(...produkte.map((p) => p.thcMin)),
    thcMax: Math.max(...produkte.map((p) => p.thcMax)),
    cbdMin: Math.min(...produkte.map((p) => p.cbdMin)),
    cbdMax: Math.max(...produkte.map((p) => p.cbdMax)),
  };
}

/**
 * Die Sortenseite in einer Abfrage: Kultivar mit aktiven Produkten samt Vertreiber,
 * Kennwerten und Note je Vertreiber. Gruppiert wird im Code (höchstens 30 Produkte).
 * `fachkreis` bleibt in der Signatur für spätere Bestandsdaten; Sortendaten sind öffentlich.
 */
export async function ladeSorte(slug: string, fachkreis: boolean): Promise<SorteDetail | null> {
  void fachkreis;
  const prisma = await getPrisma();
  const k = await prisma.kultivar.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      kennwerte: { select: { terpenMedian: true, geschmackMedian: true, gesamtnoteMedian: true, gesamtnoteMittel: true, anzahl: true } },
      vertreiberKennwerte: { select: { vertreiberId: true, anzahl: true, gesamtnoteMittel: true } },
      strains: {
        where: { aktiv: true },
        take: 30,
        orderBy: { handelsname: "asc" },
        select: {
          id: true,
          slug: true,
          handelsname: true,
          kultivarTyp: true,
          genetik: true,
          thcMinProzent: true,
          thcMaxProzent: true,
          cbdMinProzent: true,
          cbdMaxProzent: true,
          vertreiberId: true,
          vertreiber: { select: { name: true } },
        },
      },
    },
  });
  if (!k || !k.slug) return null;
  const zeilen: ProduktZeile[] = k.strains.map((s) => ({
    id: s.id,
    slug: s.slug,
    handelsname: s.handelsname,
    thcMin: s.thcMinProzent,
    thcMax: s.thcMaxProzent,
    cbdMin: s.cbdMinProzent,
    cbdMax: s.cbdMaxProzent,
    vertreiberId: s.vertreiberId,
    vertreiberName: s.vertreiber?.name ?? null,
    kultivarTyp: s.kultivarTyp,
    genetik: s.genetik,
  }));
  const waren = gruppiereWaren(zeilen, new Map(k.vertreiberKennwerte.map((v) => [v.vertreiberId, v])));
  const typen = new Map<string, number>();
  for (const z of zeilen) typen.set(z.kultivarTyp, (typen.get(z.kultivarTyp) ?? 0) + 1);
  const mehrheit = [...typen].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
  return {
    kultivar: {
      id: k.id,
      name: k.name,
      slug: k.slug,
      typ: mehrheit && istKultivarTyp(mehrheit) ? mehrheit : "HYBRID",
      genetik: zeilen.find((z) => z.genetik)?.genetik ?? null,
    },
    spanne: spanneAus(zeilen),
    kennwerte: k.kennwerte && k.kennwerte.anzahl > 0 ? k.kennwerte : null,
    waren,
  };
}

/**
 * Alte Produktadresse auf die Sortenseite: eine indexierte Abfrage auf strains.slug.
 * Aufgerufen nur, wenn der Slug keine Sorte ist (die Seite fand nichts).
 */
export async function produktZuSorte(pfad: string, suche = ""): Promise<string | null> {
  const treffer = /^\/blueten\/([^/]+)$/.exec(pfad);
  if (!treffer) return null;
  const prisma = await getPrisma();
  const s = await prisma.strain.findUnique({ where: { slug: decodeURIComponent(treffer[1]) }, select: { kultivar: { select: { slug: true } } } });
  const kultivarSlug = s?.kultivar?.slug ?? null;
  return sortenWeiterleitung(pfad, suche, () => kultivarSlug);
}
