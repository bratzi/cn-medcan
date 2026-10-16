import { istKultivarTyp, type KultivarTyp } from "@/db/enums";
import { musterBildId } from "@/lib/budpics";
import { bildQuelle, blueteBild, medium } from "@/lib/medien";
import { getPrisma } from "@/lib/prisma";
import { SUCHE_MAX, suchtextBedingung } from "@/lib/sorten-suche";

/** Eine Ware: dieselbe Sorte bei einem Vertreiber (Spec 2026-10-15 Abschnitt 4). */
export type ExplorerWare = {
  vertreiberId: string;
  vertreiberName: string;
  thc: [number, number];
  cbd: [number, number];
  /** Aktive Handelsnamen (Stärken) dieses Vertreibers für die Sorte. */
  staerken: number;
  anzahl: number;
  note: number | null;
};

/** Bild der Sorte links im Kapitel: das neueste Budpic, sonst das Musterbild (symbol: true). */
export type ExplorerBild = { src: string; srcSet?: string; breite: number; hoehe: number; symbol: boolean };

export type ExplorerSorte = { slug: string; name: string; typ: KultivarTyp; anzahl: number; waren: ExplorerWare[]; bild?: ExplorerBild | null };

const SORTEN_MAX = 12;
const WAREN_MAX = 8;
const KANDIDATEN_MAX = 60;

const nachMengeDannName = (a: { anzahl: number; name: string }, b: { anzahl: number; name: string }) =>
  b.anzahl - a.anzahl || a.name.localeCompare(b.name, "de");

/** HWG: Auswahl und Reihenfolge nur nach Menge und Name, nie nach Note. */
export function waehleExplorerSorten(kandidaten: readonly ExplorerSorte[], mindestWaren = 2): ExplorerSorte[] {
  return kandidaten
    .filter((s) => s.waren.length >= mindestWaren)
    .sort(nachMengeDannName)
    .slice(0, SORTEN_MAX)
    .map((s) => ({
      ...s,
      waren: [...s.waren]
        .sort((a, b) => nachMengeDannName({ anzahl: a.anzahl, name: a.vertreiberName }, { anzahl: b.anzahl, name: b.vertreiberName }))
        .slice(0, WAREN_MAX),
    }));
}

/** Suchtreffer wie der Explorer selbst: Menge, dann Name, nie die Note (HWG); höchstens zwölf, auch mit nur einem Vertreiber. */
export function waehleSuchTreffer(kandidaten: readonly ExplorerSorte[]): ExplorerSorte[] {
  return waehleExplorerSorten(kandidaten, 1).slice(0, SUCHE_MAX);
}

export type ExplorerZeile = {
  slug: string | null;
  name: string;
  kennwerte: { anzahl: number } | null;
  vertreiberKennwerte: { vertreiberId: string; anzahl: number; gesamtnoteMittel: number | null }[];
  strains: {
    kultivarTyp: string;
    thcMinProzent: number;
    thcMaxProzent: number;
    cbdMinProzent: number;
    cbdMaxProzent: number;
    vertreiber: { id: string; name: string } | null;
  }[];
};

/** Strains je Vertreiber zu Waren verdichten; Typ nach Mehrheit (Gleichstand alphabetisch). */
export function verdichteExplorerSorte(zeile: ExplorerZeile): ExplorerSorte | null {
  if (!zeile.slug) return null;
  const typen = new Map<string, number>();
  for (const s of zeile.strains) typen.set(s.kultivarTyp, (typen.get(s.kultivarTyp) ?? 0) + 1);
  const mehrheit = [...typen].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
  const typ: KultivarTyp = mehrheit && istKultivarTyp(mehrheit) ? mehrheit : "HYBRID";
  const kennwerte = new Map(zeile.vertreiberKennwerte.map((k) => [k.vertreiberId, k]));
  const waren = new Map<string, ExplorerWare>();
  for (const s of zeile.strains) {
    if (!s.vertreiber) continue;
    const w = waren.get(s.vertreiber.id);
    if (w) {
      w.thc = [Math.min(w.thc[0], s.thcMinProzent), Math.max(w.thc[1], s.thcMaxProzent)];
      w.cbd = [Math.min(w.cbd[0], s.cbdMinProzent), Math.max(w.cbd[1], s.cbdMaxProzent)];
      w.staerken += 1;
      continue;
    }
    const k = kennwerte.get(s.vertreiber.id);
    waren.set(s.vertreiber.id, {
      vertreiberId: s.vertreiber.id,
      vertreiberName: s.vertreiber.name,
      thc: [s.thcMinProzent, s.thcMaxProzent],
      cbd: [s.cbdMinProzent, s.cbdMaxProzent],
      staerken: 1,
      anzahl: k?.anzahl ?? 0,
      note: k?.anzahl ? k.gesamtnoteMittel : null,
    });
  }
  return { slug: zeile.slug, name: zeile.name, typ, anzahl: zeile.kennwerte?.anzahl ?? 0, waren: [...waren.values()] };
}

const SORTE_SELECT = {
  id: true,
  slug: true,
  name: true,
  kennwerte: { select: { anzahl: true } },
  vertreiberKennwerte: { select: { vertreiberId: true, anzahl: true, gesamtnoteMittel: true } },
  strains: {
    where: { aktiv: true, vertreiberId: { not: null } },
    select: {
      slug: true,
      herstellerBildPfad: true,
      kultivarTyp: true,
      thcMinProzent: true,
      thcMaxProzent: true,
      cbdMinProzent: true,
      cbdMaxProzent: true,
      vertreiber: { select: { id: true, name: true } },
    },
  },
} as const;

/** Eine Abfrage, statisch mit der Startseite (ISR); kein Aggregieren pro Request. */
export async function ladeSortenExplorer(): Promise<ExplorerSorte[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.kultivar.findMany({
    where: { slug: { not: null }, strains: { some: { aktiv: true, vertreiberId: { not: null } } } },
    select: SORTE_SELECT,
    orderBy: [{ kennwerte: { anzahl: "desc" } }, { name: "asc" }],
    take: KANDIDATEN_MAX,
  });
  const gewaehlt = waehleExplorerSorten(zeilen.flatMap((z) => verdichteExplorerSorte(z) ?? []));
  const zeileJeSlug = new Map(zeilen.map((z) => [z.slug, z]));
  // Dynamisch: lib/query/budpics zieht die Sitzung (server-only), die Tests laden diese Datei ohne sie.
  const { ladeFreieBudpicsJeKultivar } = await import("@/lib/query/budpics");
  const budpics = await ladeFreieBudpicsJeKultivar(gewaehlt.flatMap((s) => zeileJeSlug.get(s.slug)?.id ?? []));
  return gewaehlt.map((s) => {
    const zeile = zeileJeSlug.get(s.slug);
    return { ...s, bild: zeile ? explorerBild(budpics.get(zeile.id)?.[0], zeile.strains) : null };
  });
}

/** Budpic vor Herstellerbild vor Musterbild, wie auf den Katalogkarten. */
export function explorerBild(
  budpic: { id: string; breite: number; hoehe: number } | undefined,
  strains: readonly { slug?: string; herstellerBildPfad?: string | null }[],
): ExplorerBild | null {
  if (budpic) return { src: `/api/bild/${budpic.id}`, breite: budpic.breite, hoehe: budpic.hoehe, symbol: false };
  const ersterSlug = strains.find((s) => s.slug)?.slug;
  const id = blueteBild(strains.find((s) => s.herstellerBildPfad)?.herstellerBildPfad) ?? (ersterSlug ? musterBildId(ersterSlug) : null);
  if (!id) return null;
  const m = medium(id);
  return { ...bildQuelle(id), breite: m.breite, hoehe: m.hoehe, symbol: true };
}

/**
 * Sortensuche des Explorers (`/api/sorten-suche`): dieselbe Suchbedingung wie die Blütenliste
 * (`suchtextBedingung`: Handelsname, Kultivarname, Genetik, klein geschrieben) auf aktiven Handelsnamen,
 * auch Sorten mit nur einem Vertreiber. Nach Menge dann Name; eine Abfrage mit `take`. Bild nur als
 * Symbolbild, damit die Antwort ohne zweite Abfrage auskommt und eine Stunde gecacht werden darf.
 */
export async function ladeSortenSuche(text: string): Promise<ExplorerSorte[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.kultivar.findMany({
    where: { slug: { not: null }, strains: { some: { aktiv: true, vertreiberId: { not: null }, ...suchtextBedingung(text) } } },
    select: SORTE_SELECT,
    orderBy: [{ kennwerte: { anzahl: "desc" } }, { name: "asc" }],
    take: SUCHE_MAX,
  });
  return waehleSuchTreffer(zeilen.flatMap((z) => verdichteExplorerSorte(z) ?? [])).map((s) => ({
    ...s,
    bild: explorerBild(undefined, zeilen.find((z) => z.slug === s.slug)?.strains ?? []),
  }));
}
