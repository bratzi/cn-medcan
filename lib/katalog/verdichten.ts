import type { GeschmacksKategorie, KultivarTyp } from "@/db/enums";
import type { BlueteZeile, KatalogDaten, KatalogWare, StrainZeile } from "@/lib/katalog/typen";

export function normalisiere(text: string): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").replace(/ß|ẞ/g, "ss").toLowerCase().trim();
}

/** Top 3 über alle Handelsnamen: 4 minus Rang je Ware, Gleichstand alphabetisch (wie lib/query/kultivar-liste.ts). */
function topTerpene(waren: readonly KatalogWare[], geschmack: ReadonlyMap<string, GeschmacksKategorie>) {
  const punkte = new Map<string, number>();
  for (const w of waren) w.tp.forEach((n, i) => punkte.set(n, (punkte.get(n) ?? 0) + 3 - i));
  return [...punkte]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([name]) => ({ name, geschmack: geschmack.get(name) ?? null }));
}

function mehrheit(waren: readonly KatalogWare[]): KultivarTyp {
  const n = new Map<KultivarTyp, number>();
  for (const w of waren) n.set(w.y, (n.get(w.y) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "HYBRID";
}

/**
 * D1 liefert Zeitstempel je nach Schreibweg als Zahl (ms), als SQL-Text ("YYYY-MM-DD HH:MM:SS", UTC)
 * oder als ISO. Sortiert wird per String-Vergleich, deshalb hier einheitlich ISO.
 */
export function alsIso(wert: unknown): string | null {
  if (wert === null || wert === undefined || wert === "") return null;
  const roh = typeof wert === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(wert) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(wert)
    ? `${wert.replace(" ", "T")}Z`
    : wert;
  const d = new Date(typeof roh === "number" || typeof roh === "string" ? roh : NaN);
  return Number.isNaN(d.getTime()) ? (typeof wert === "string" ? wert : null) : d.toISOString();
}

export function verdichte(daten: KatalogDaten): { blueten: BlueteZeile[]; strains: StrainZeile[] } {
  const geschmack = new Map(daten.terpene.map((t) => [t.n, t.g]));
  const vertreiber = new Map(daten.vertreiber.map((v) => [v.i, v.n]));
  const kultivare = new Map(daten.kultivare.map((k) => [k.i, k]));
  const gruppen = new Map<string, KatalogWare[]>();
  const alleWaren = daten.waren.map((w) => ({ ...w, u: alsIso(w.u) ?? "" }));
  for (const w of alleWaren) {
    const schluessel = w.k && kultivare.has(w.k) ? w.k : w.i;
    gruppen.set(schluessel, [...(gruppen.get(schluessel) ?? []), w]);
  }
  const blueten: BlueteZeile[] = [...gruppen].map(([id, waren]) => {
    const k = kultivare.get(id);
    const vIds = [...new Set(waren.flatMap((w) => (w.v ? [w.v] : [])))];
    const name = k?.n ?? waren[0]!.h;
    return {
      id, name, slug: k?.s ?? null, typ: mehrheit(waren),
      thcMin: Math.min(...waren.map((w) => w.t0)), thcMax: Math.max(...waren.map((w) => w.t1)),
      cbdMax: Math.max(...waren.map((w) => w.c1)),
      terpene: topTerpene(waren, geschmack), vertreiberIds: vIds, handelsnamen: waren.length,
      community: k && k.cn !== null && k.ca > 0 ? { note: k.cn, stimmen: k.ca } : null,
      geschmackMedian: k?.gm ?? null,
      eigeneNote: k?.en ?? null, letzteBewertung: alsIso(k?.lb),
      bildSlug: waren[0]!.s, herstellerBildPfad: waren.find((w) => w.b)?.b ?? null,
      suchtext: normalisiere([name, ...waren.map((w) => `${w.h} ${w.g ?? ""}`), ...vIds.map((v) => vertreiber.get(v) ?? "")].join(" ")),
      waren,
    };
  });
  const strains: StrainZeile[] = alleWaren.map((w) => {
    const k = w.k ? kultivare.get(w.k) : undefined;
    return {
      ...w, kultivarName: k?.n ?? null,
      community: k && k.cn !== null && k.ca > 0 ? { note: k.cn, stimmen: k.ca } : null,
      geschmackMedian: k?.gm ?? null,
      eigeneNote: k?.en ?? null, letzteBewertung: alsIso(k?.lb),
      terpenGeschmack: w.tp.map((n) => geschmack.get(n) ?? null),
      suchtext: normalisiere(`${w.h} ${k?.n ?? ""} ${w.g ?? ""} ${w.v ? vertreiber.get(w.v) ?? "" : ""}`),
    };
  });
  return { blueten, strains };
}
