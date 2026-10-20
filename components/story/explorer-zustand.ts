import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { ExplorerSorte } from "@/lib/query/sorten-explorer";

/** Zustand des Sorten-Explorers (Spec 2026-10-15 Abschnitt 4), rein und testbar. */
export type ExplorerZustand = { sorte: string; ware: string | null; vergleich: string[]; suche: string };

export type ExplorerAktion =
  | { typ: "sorte"; slug: string; ersteWare: string | null }
  | { typ: "ware"; id: string }
  | { typ: "vergleichen"; id: string }
  | { typ: "vergleichEnde" }
  | { typ: "suche"; text: string };

/** `offen = false`: keine Sorte gewählt, der Katalog steht (Spec 2026-10-20, Teil A). */
export function explorerStart(sorten: readonly ExplorerSorte[], offen = true, vorwahl?: string): ExplorerZustand {
  if (!offen) return { sorte: "", ware: null, vergleich: [], suche: "" };
  // Vorwahl (Startseite): die Sorte der vorgeführten Bewertung, sonst die erste.
  const erste = sorten.find((s) => s.slug === vorwahl) ?? sorten[0];
  return { sorte: erste?.slug ?? "", ware: erste?.waren[0]?.vertreiberId ?? null, vergleich: [], suche: "" };
}

export function explorerZustand(aktion: ExplorerAktion, zustand: ExplorerZustand): ExplorerZustand {
  switch (aktion.typ) {
    case "sorte":
      return { ...zustand, sorte: aktion.slug, ware: aktion.ersteWare, vergleich: [] };
    case "ware":
      return { ...zustand, ware: aktion.id };
    case "vergleichen": {
      // Ohne laufenden Vergleich ist die gewählte Ware die erste Seite; die dritte verdrängt die ältere.
      const basis = zustand.vergleich.length > 0 ? zustand.vergleich : zustand.ware ? [zustand.ware] : [];
      if (basis.includes(aktion.id)) return { ...zustand, vergleich: basis };
      return { ...zustand, vergleich: [...basis, aktion.id].slice(-2) };
    }
    case "vergleichEnde":
      return { ...zustand, vergleich: [] };
    case "suche":
      return { ...zustand, suche: aktion.text };
  }
}

export function filtereSorten(sorten: readonly ExplorerSorte[], suche: string): ExplorerSorte[] {
  const nadel = suche.trim().toLocaleLowerCase();
  return nadel ? sorten.filter((s) => s.name.toLocaleLowerCase().includes(nadel)) : [...sorten];
}

const ZAHL: Record<Sprache, Intl.NumberFormat> = {
  de: new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }),
  en: new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }),
};

/** „+4 % THC“: Unterschied der zweiten zur ersten Seite des Vergleichs. */
export function differenz(b: number, a: number, stoff: string, sprache: Sprache): string {
  const d = Math.round((b - a) * 10) / 10;
  const zeichen = d > 0 ? "+" : d < 0 ? "−" : "±";
  return `${zeichen}${ZAHL[sprache].format(Math.abs(d))} % ${stoff}`;
}
