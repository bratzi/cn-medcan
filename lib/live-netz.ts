import { bewertungsGewicht, bewertungsRichtung, geschmacksBeitraege, type EigeneBewertung, type SortenAroma } from "@/lib/empfehlung";
import { geschmackAusVektor } from "@/lib/profil";
import type { Geschmack } from "@/lib/profil-typen";

/**
 * Live-Netz beim Bewerten (Nutzer 2026-10-09): das eigene Aroma-Netz verändert
 * sich, während man eine Sorte bewertet. Der Server rechnet einmal die Summe
 * aller anderen eigenen Bewertungen (`basis`, nur Geschmacksachsen) und reicht
 * das Aroma der Sorte mit; der Browser legt die gerade eingestellte Bewertung
 * darüber. Dieselbe Rechnung wie profilAus (lib/empfehlung.ts), nur zerlegt.
 */
export type LiveNetzBasis = {
  /** Summe der gewichteten Geschmacksbeiträge aller anderen eigenen Bewertungen (`g:`-Schlüssel). */
  basis: Record<string, number>;
  /** Aroma der Sorte, die gerade bewertet wird; null, wenn sie keines hat. */
  sorte: SortenAroma | null;
};

/** Eingabe aus der Maske: Note und Regler wie in EigeneBewertung, ohne Sorte. */
export type LiveEingabe = Omit<EigeneBewertung, "strainId">;

export function liveNetzBasis(bewertungen: readonly EigeneBewertung[], sorten: readonly SortenAroma[], strainId: string): LiveNetzBasis {
  const andere = bewertungen.filter((b) => b.strainId !== strainId);
  const basis: Record<string, number> = {};
  for (const beitrag of geschmacksBeitraege(andere, sorten)) {
    for (const [k, x] of beitrag) basis[k] = (basis[k] ?? 0) + x;
  }
  return { basis, sorte: sorten.find((s) => s.strainId === strainId) ?? null };
}

/** Das Netz ohne die Bewertung dieser Sorte: die dünne Kontur. */
export function basisGeschmack(b: LiveNetzBasis): Geschmack {
  return geschmackAusVektor(new Map(Object.entries(b.basis)));
}

/** Das Netz mit der gerade eingestellten Bewertung. */
export function liveGeschmack(b: LiveNetzBasis, eingabe: LiveEingabe): Geschmack {
  const profil = new Map(Object.entries(b.basis));
  const gewicht = bewertungsGewicht(eingabe.gesamtnote);
  if (gewicht !== 0) {
    const richtung = bewertungsRichtung({ strainId: b.sorte?.strainId ?? "", ...eingabe }, b.sorte ?? undefined);
    for (const [k, x] of richtung) if (k.startsWith("g:")) profil.set(k, (profil.get(k) ?? 0) + gewicht * x);
  }
  return geschmackAusVektor(profil);
}
