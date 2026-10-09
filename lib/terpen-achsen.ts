import type { GeschmacksKategorie } from "@/db/enums";
import { aromaAnteile } from "@/lib/terpen-aromen";

/**
 * Die zehn Achsen des Terpen-Netzes (Spec 2026-10-09 A): für jedes Mitglied dieselben, damit Netze
 * vergleichbar bleiben und der Verlauf läuft. Namen wie in der Datenbank, Schlüssel wie in terpen-aromen.
 * Ester und Thiole sind keine Terpene und fehlen bewusst.
 */
export const TERPEN_ACHSEN = [
  { schluessel: "myrcen", name: "Myrcen" },
  { schluessel: "limonen", name: "Limonen" },
  { schluessel: "beta-caryophyllen", name: "beta-Caryophyllen" },
  { schluessel: "linalool", name: "Linalool" },
  { schluessel: "alpha-pinen", name: "alpha-Pinen" },
  { schluessel: "terpinolen", name: "Terpinolen" },
  { schluessel: "humulen", name: "Humulen" },
  { schluessel: "ocimen", name: "Ocimen" },
  { schluessel: "farnesen", name: "Farnesen" },
  { schluessel: "nerolidol", name: "Nerolidol" },
] as const;

export type TerpenSchluessel = (typeof TERPEN_ACHSEN)[number]["schluessel"];
export type TerpenNetz = Record<TerpenSchluessel, number>;

const SCHLUESSEL = new Set<string>(TERPEN_ACHSEN.map((a) => a.schluessel));
const zwei = (x: number) => Math.round(x * 100) / 100 + 0;

export function leeresTerpenNetz(): TerpenNetz {
  return Object.fromEntries(TERPEN_ACHSEN.map((a) => [a.schluessel, 0])) as TerpenNetz;
}

export function terpenSchluessel(name: string): TerpenSchluessel | null {
  const k = name.trim().toLowerCase();
  return SCHLUESSEL.has(k) ? (k as TerpenSchluessel) : null;
}

/** Stärkstes Aroma eines Terpens: Farbe seiner Marke und seines Blütenkeils. */
export function hauptAroma(s: TerpenSchluessel): GeschmacksKategorie {
  const anteile = aromaAnteile({ name: s, geschmack: "ERDIG" });
  return [...anteile].sort((a, b) => b.anteil - a.anteil)[0].geschmack;
}

function normiert(roh: TerpenNetz): TerpenNetz {
  const max = Math.max(0, ...Object.values(roh).map(Math.abs));
  const aus = leeresTerpenNetz();
  if (max > 0) for (const a of TERPEN_ACHSEN) aus[a.schluessel] = zwei(roh[a.schluessel] / max);
  return aus;
}

/** Aus dem Profilvektor (`t:<Name>`), wie geschmackAusVektor für die Geschmacksachsen. */
export function terpenNetzAusVektor(profil: ReadonlyMap<string, number>): TerpenNetz {
  const roh = leeresTerpenNetz();
  for (const [k, x] of profil) {
    if (!k.startsWith("t:")) continue;
    const s = terpenSchluessel(k.slice(2));
    if (s) roh[s] += x;
  }
  return normiert(roh);
}

/** Alte Form in `nutzer_profil.terpene` (Liste, bis 8 positiv und 3 negativ). */
export function terpenNetzAusListe(liste: readonly { name: string; wert: number }[]): TerpenNetz {
  const roh = leeresTerpenNetz();
  for (const e of liste) {
    const s = terpenSchluessel(e.name);
    if (s && Number.isFinite(e.wert)) roh[s] = e.wert;
  }
  return normiert(roh);
}

/** Gespeichertes Objekt prüfen; Unbekanntes fällt weg, Werte auf −1..1 geklemmt. */
export function terpenNetzLesen(roh: unknown): TerpenNetz | null {
  if (!roh || typeof roh !== "object" || Array.isArray(roh)) return null;
  const aus = leeresTerpenNetz();
  for (const [k, v] of Object.entries(roh)) {
    const s = terpenSchluessel(k);
    if (s && typeof v === "number" && Number.isFinite(v)) aus[s] = Math.max(-1, Math.min(1, v));
  }
  return aus;
}
