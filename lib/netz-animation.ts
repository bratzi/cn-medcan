import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import type { Geschmack } from "@/lib/profil-typen";

/** Mini-Netz nach dem Speichern (Spec Profil 2.12): kurze Bewegung von vorher nach jetzt. */
export const NETZ_DAUER_MS = 700;

/** Kubisch ausklingend, auf 0..1 begrenzt. */
export function ausklingen(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

export function zwischenGeschmack(vorher: Geschmack, nachher: Geschmack, t: number): Geschmack {
  return Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, vorher[k] + (nachher[k] - vorher[k]) * t])) as Geschmack;
}

/** Mit reduzierter Bewegung steht sofort der neue Stand. */
export function startFortschritt(reduziert: boolean): number {
  return reduziert ? 1 : 0;
}
