import type { UmfragePhase } from "@/db/enums";

/** Phasennamen einer Runde, gleich auf Stimmzettel und in der Chronik. */
export const PHASEN_LABEL: Record<UmfragePhase, string> = {
  VORSCHLAG: "Vorschlagsphase",
  ABSTIMMUNG: "Abstimmung läuft",
  BEENDET: "Runde beendet",
};
