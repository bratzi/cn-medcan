import { istGeschmacksKategorie } from "@/db/enums";
import { geschmacksBeitraege, type EigeneBewertung, type SortenAroma } from "@/lib/empfehlung";
import { geschmackAusVektor, leereProfilWerte } from "@/lib/profil";
import type { VerlaufSchritt } from "@/lib/profil-typen";
import { terpenNetzAusVektor, terpenNetzLesen } from "@/lib/terpen-achsen";

/**
 * Verlauf des Netzes (Spec Profil 2.6 und 10): aus heutiger Sicht
 * nachgerechnet, keine Momentaufnahmen. Schritt k ist das Netz nach den
 * ersten k Bewertungen in Datumsreihenfolge. Läuft beim Speichern, nie je
 * Seitenaufruf; Präfixsummen halten es linear (Workers-CPU 10 ms).
 */
export const VERLAUF_HOECHSTENS = 60;

export type VerlaufEingabe = EigeneBewertung & { erstelltAm: Date };

export function profilVerlauf(bewertungen: readonly VerlaufEingabe[], sorten: readonly SortenAroma[]): VerlaufSchritt[] {
  const reihe = [...bewertungen].sort(
    (a, b) => a.erstelltAm.getTime() - b.erstelltAm.getTime() || (a.strainId < b.strainId ? -1 : a.strainId > b.strainId ? 1 : 0),
  );
  const beitraege = geschmacksBeitraege(reihe, sorten);
  const summe = new Map<string, number>();
  const schritte: VerlaufSchritt[] = [];
  // Summen für alle, das Netz nur für die gespeicherten letzten Schritte (Review Profil M2).
  const ab = Math.max(0, reihe.length - VERLAUF_HOECHSTENS);
  reihe.forEach((bewertung, i) => {
    for (const [k, x] of beitraege[i]) summe.set(k, (summe.get(k) ?? 0) + x);
    if (i < ab) return;
    schritte.push({ anzahl: i + 1, datum: bewertung.erstelltAm.toISOString(), geschmack: geschmackAusVektor(summe), terpene: terpenNetzAusVektor(summe) });
  });
  return schritte;
}

export function verlaufDaten(schritte: readonly VerlaufSchritt[]): string {
  return JSON.stringify(schritte);
}

/** Liest die Spalte `verlauf`; NULL, Kaputtes oder ein falscher Schritt ergibt die leere Liste. */
export function verlaufAusDaten(roh: string | null): VerlaufSchritt[] {
  if (roh === null) return [];
  let wert: unknown;
  try {
    wert = JSON.parse(roh);
  } catch {
    return [];
  }
  if (!Array.isArray(wert)) return [];
  const aus: VerlaufSchritt[] = [];
  for (const s of wert) {
    if (!s || typeof s !== "object") return [];
    const { anzahl, datum, geschmack } = s as Record<string, unknown>;
    if (typeof anzahl !== "number" || typeof datum !== "string" || !geschmack || typeof geschmack !== "object") return [];
    const g = leereProfilWerte().geschmack;
    for (const [k, v] of Object.entries(geschmack)) {
      if (istGeschmacksKategorie(k) && typeof v === "number" && Number.isFinite(v)) g[k] = Math.max(-1, Math.min(1, v));
    }
    // Schritte vor 2026-10-09 tragen keine Terpene; dann zeigt der Terpen-Modus nur den heutigen Stand.
    const tn = terpenNetzLesen((s as Record<string, unknown>).terpene);
    aus.push(tn ? { anzahl, datum, geschmack: g, terpene: tn } : { anzahl, datum, geschmack: g });
  }
  return aus;
}
