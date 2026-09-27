import type { UmfragePhase } from "@/db/enums";
import type { Woerterbuch } from "@/lib/i18n/typen";

/** Phasennamen einer Runde, gleich auf Stimmzettel und in der Chronik (Woerterbuch umfrage.phasen). */
export function phasenLabel(w: Woerterbuch, phase: UmfragePhase): string {
  return w.umfrage.phasen[phase];
}
