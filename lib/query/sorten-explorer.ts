import { istKultivarTyp, type KultivarTyp } from "@/db/enums";
import { getPrisma } from "@/lib/prisma";

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

export type ExplorerSorte = { slug: string; name: string; typ: KultivarTyp; anzahl: number; waren: ExplorerWare[] };

const SORTEN_MAX = 12;
const WAREN_MAX = 8;
const KANDIDATEN_MAX = 60;

const nachMengeDannName = (a: { anzahl: number; name: string }, b: { anzahl: number; name: string }) =>
  b.anzahl - a.anzahl || a.name.localeCompare(b.name, "de");

/** HWG: Auswahl und Reihenfolge nur nach Menge und Name, nie nach Note. */
export function waehleExplorerSorten(kandidaten: readonly ExplorerSorte[]): ExplorerSorte[] {
  return kandidaten
    .filter((s) => s.waren.length >= 2)
    .sort(nachMengeDannName)
    .slice(0, SORTEN_MAX)
    .map((s) => ({
      ...s,
      waren: [...s.waren]
        .sort((a, b) => nachMengeDannName({ anzahl: a.anzahl, name: a.vertreiberName }, { anzahl: b.anzahl, name: b.vertreiberName }))
        .slice(0, WAREN_MAX),
    }));
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

/** Eine Abfrage, statisch mit der Startseite (ISR); kein Aggregieren pro Request. */
export async function ladeSortenExplorer(): Promise<ExplorerSorte[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.kultivar.findMany({
    where: { slug: { not: null }, strains: { some: { aktiv: true, vertreiberId: { not: null } } } },
    select: {
      slug: true,
      name: true,
      kennwerte: { select: { anzahl: true } },
      vertreiberKennwerte: { select: { vertreiberId: true, anzahl: true, gesamtnoteMittel: true } },
      strains: {
        where: { aktiv: true, vertreiberId: { not: null } },
        select: {
          kultivarTyp: true,
          thcMinProzent: true,
          thcMaxProzent: true,
          cbdMinProzent: true,
          cbdMaxProzent: true,
          vertreiber: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ kennwerte: { anzahl: "desc" } }, { name: "asc" }],
    take: KANDIDATEN_MAX,
  });
  return waehleExplorerSorten(zeilen.flatMap((z) => verdichteExplorerSorte(z) ?? []));
}
