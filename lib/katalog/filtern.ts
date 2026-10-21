import type { BlueteZeile, KatalogWare, StrainZeile } from "@/lib/katalog/typen";
import { normalisiere } from "@/lib/katalog/verdichten";
import { NOTEN_STUFEN, TREFFER_PRO_SEITE, aktiveRichtung, standardRichtung, type StrainFilter } from "@/lib/query/filter";

export { normalisiere, verdichte } from "@/lib/katalog/verdichten";

type Verdichtet = { blueten: BlueteZeile[]; strains: StrainZeile[] };
export type KatalogErgebnis =
  | { ansicht: "bluete"; zeilen: BlueteZeile[]; gesamt: number; seite: number; seitenAnzahl: number }
  | { ansicht: "ware"; zeilen: StrainZeile[]; gesamt: number; seite: number; seitenAnzahl: number };
export type OptionsZahlen = {
  typ: Record<string, number>; form: Record<string, number>; geschmack: Record<string, number>;
  terp: Record<string, number>; vertreiber: Record<string, number>;
  note: Record<"3" | "3.5" | "4" | "4.5", number>; bewertet: number; cbd: number;
};

const CBD_REICH = 1;

/** Bestandsbedingungen gelten wie im Server je Zeile gemeinsam (lib/query/strains.ts baueWhere). */
function bestandPasst(w: KatalogWare, f: StrainFilter): boolean {
  if (!f.nurVerfuegbar && f.apotheke.length === 0 && f.preisMax === undefined) return true;
  return w.st.some((b) =>
    (!f.nurVerfuegbar || b.s === "VERFUEGBAR") &&
    (f.apotheke.length === 0 || f.apotheke.includes(b.a)) &&
    (f.preisMax === undefined || (b.p !== null && b.p <= f.preisMax)));
}

/** Prüfung je Ware (alles, was an der einzelnen Ware hängt). */
function warePasst(w: KatalogWare, f: StrainFilter, geschmackVon: (n: string) => string | null): boolean {
  if (f.typ.length && !f.typ.includes(w.y)) return false;
  if (f.form.length && !f.form.includes(w.f)) return false;
  if (w.t1 < f.thcMin || w.t0 > f.thcMax) return false;
  if (f.cbd && w.c1 < CBD_REICH) return false;
  if (f.vertreiber.length && !(w.v && f.vertreiber.includes(w.v))) return false;
  if (f.kultivar && w.k !== f.kultivar) return false;
  if (f.geschmack.length) {
    const erstes = w.tp[0] ? geschmackVon(w.tp[0]) : null;
    if (!erstes || !f.geschmack.includes(erstes as never)) return false;
  }
  return bestandPasst(w, f);
}

function communityPasst(c: { note: number } | null, eigene: number | null, f: StrainFilter): boolean {
  if (f.bewertet && !c && eigene === null) return false;
  if (f.note !== undefined && (!c || c.note < f.note)) return false;
  return true;
}

function terpPasst(namen: readonly string[], f: StrainFilter): boolean {
  return f.terp.every((t) => namen.includes(t));
}

function geschmackKarte(v: Verdichtet): (n: string) => string | null {
  const m = new Map<string, string>();
  for (const s of v.strains) s.tp.forEach((n, i) => { const g = s.terpenGeschmack[i]; if (g) m.set(n, g); });
  return (n) => m.get(n) ?? null;
}

function blueteTreffer(v: Verdichtet, f: StrainFilter): BlueteZeile[] {
  const g = geschmackKarte(v);
  const q = f.q ? normalisiere(f.q) : "";
  return v.blueten.filter((b) =>
    (!q || b.suchtext.includes(q)) &&
    communityPasst(b.community, b.eigeneNote, f) &&
    terpPasst(b.terpene.map((t) => t.name), f) &&
    b.waren.some((w) => warePasst(w, f, g)));
}

function strainTreffer(v: Verdichtet, f: StrainFilter): StrainZeile[] {
  const g = geschmackKarte(v);
  const q = f.q ? normalisiere(f.q) : "";
  return v.strains.filter((s) =>
    (!q || s.suchtext.includes(q)) && communityPasst(s.community, s.eigeneNote, f) && terpPasst(s.tp, f) && warePasst(s, f, g));
}

type Sortierbar = { name: string; community: { note: number; stimmen: number } | null; letzteBewertung: string | null; thcMax: number; preis: number | null; geaendert: string };

function vergleiche(f: StrainFilter) {
  const name = (a: Sortierbar, b: Sortierbar) => a.name.localeCompare(b.name, "de");
  const note = (x: Sortierbar) => x.community?.note ?? -1;
  // Gegen den Standard (Spec 2026-10-21, 4): die ganze Reihenfolge kippt.
  const dreh = aktiveRichtung(f) === standardRichtung(f.sortierung) ? 1 : -1;
  return (a: Sortierbar, b: Sortierbar): number => dreh * grund(a, b);
  function grund(a: Sortierbar, b: Sortierbar): number {
    switch (f.sortierung) {
      case "community": return note(b) - note(a) || (b.community?.stimmen ?? 0) - (a.community?.stimmen ?? 0) || name(a, b);
      case "stimmen": return (b.community?.stimmen ?? 0) - (a.community?.stimmen ?? 0) || name(a, b);
      case "neueste": return (b.letzteBewertung ?? "").localeCompare(a.letzteBewertung ?? "") || name(a, b);
      case "thc_absteigend": return b.thcMax - a.thcMax || name(a, b);
      case "thc_aufsteigend": return a.thcMax - b.thcMax || name(a, b);
      case "preis_aufsteigend": return (a.preis ?? Infinity) - (b.preis ?? Infinity) || name(a, b);
      case "relevanz": return b.geaendert.localeCompare(a.geaendert) || name(a, b);
      default: return name(a, b);
    }
  }
}

const minPreis = (waren: readonly KatalogWare[]) => {
  const p = waren.flatMap((w) => w.st.flatMap((b) => (b.p === null ? [] : [b.p])));
  return p.length ? Math.min(...p) : null;
};

function seitenweise<T>(alle: T[], f: StrainFilter) {
  const seitenAnzahl = Math.max(1, Math.ceil(alle.length / TREFFER_PRO_SEITE));
  const seite = Math.min(Math.max(1, f.seite), seitenAnzahl);
  return { zeilen: alle.slice((seite - 1) * TREFFER_PRO_SEITE, seite * TREFFER_PRO_SEITE), gesamt: alle.length, seite, seitenAnzahl };
}

export function filtere(v: Verdichtet, f: StrainFilter): KatalogErgebnis {
  const cmp = vergleiche(f);
  if (f.ansicht === "ware") {
    const s = strainTreffer(v, f).map((z) => ({ z, k: { name: z.h, community: z.community, letzteBewertung: z.letzteBewertung, thcMax: z.t1, preis: minPreis([z]), geaendert: z.u } }));
    s.sort((a, b) => cmp(a.k, b.k));
    return { ansicht: "ware", ...seitenweise(s.map((x) => x.z), f) };
  }
  const b = blueteTreffer(v, f).map((z) => ({ z, k: { name: z.name, community: z.community, letzteBewertung: z.letzteBewertung, thcMax: z.thcMax, preis: minPreis(z.waren), geaendert: z.waren.map((w) => w.u).sort().at(-1) ?? "" } }));
  b.sort((x, y) => cmp(x.k, y.k));
  return { ansicht: "bluete", ...seitenweise(b.map((x) => x.z), f) };
}

const anzahl = (v: Verdichtet, f: StrainFilter) =>
  f.ansicht === "ware" ? strainTreffer(v, f).length : blueteTreffer(v, f).length;

/** Je Option: Treffer, wenn ihre Gruppe nur diese Option trüge (Facetten-Logik). */
export function zaehleOptionen(v: Verdichtet, f: StrainFilter): OptionsZahlen {
  const je = <K extends "typ" | "form" | "geschmack" | "terp" | "vertreiber">(gruppe: K, werte: readonly string[]) =>
    Object.fromEntries(werte.map((w) => [w, anzahl(v, { ...f, [gruppe]: gruppe === "terp" ? [...f.terp.filter((t) => t !== w), w] : [w] } as StrainFilter)]));
  const alleTerpene = [...new Set(v.strains.flatMap((s) => s.tp))];
  const alleVertreiber = [...new Set(v.strains.flatMap((s) => (s.v ? [s.v] : [])))];
  return {
    typ: je("typ", ["INDICA", "SATIVA", "HYBRID"]),
    form: je("form", [...new Set(v.strains.map((s) => s.f))]),
    geschmack: je("geschmack", [...new Set(v.strains.flatMap((s) => s.terpenGeschmack.filter((g): g is NonNullable<typeof g> => g !== null)))]),
    terp: je("terp", alleTerpene),
    vertreiber: je("vertreiber", alleVertreiber),
    note: Object.fromEntries(NOTEN_STUFEN.map((n) => [String(n), anzahl(v, { ...f, note: n })])) as OptionsZahlen["note"],
    bewertet: anzahl(v, { ...f, bewertet: true }),
    cbd: anzahl(v, { ...f, cbd: true }),
  };
}
