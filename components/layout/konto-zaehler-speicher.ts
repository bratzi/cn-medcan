/**
 * Gemeinsamer Speicher des Benachrichtigungszaehlers (KontoZaehler). An- und
 * Abmelden leeren ihn, damit nach einem Kontowechsel nie die Zahl des vorigen
 * Kontos an der Pille steht (Review 2026-09-25, Important 2).
 */
export const ZAEHLER_SPEICHER = "benachrichtigungen-ungelesen";

/** Event: der Zaehler soll sofort neu fragen, ohne Speicher. */
export const ZAEHLER_NEU = "benachrichtigungen-neu";

export function zaehlerZuruecksetzen(): void {
  try {
    sessionStorage.removeItem(ZAEHLER_SPEICHER);
  } catch {
    // Speicher gesperrt: dann gibt es auch nichts Veraltetes darin.
  }
  window.dispatchEvent(new Event(ZAEHLER_NEU));
}
