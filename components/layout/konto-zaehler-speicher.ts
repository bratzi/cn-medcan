/**
 * Gemeinsamer Speicher des Benachrichtigungszaehlers (KontoZaehler). An- und
 * Abmelden leeren ihn, damit nach einem Kontowechsel nie die Zahl des vorigen
 * Kontos an der Pille steht (Review 2026-09-25, Important 2).
 */
export const ZAEHLER_SPEICHER = "benachrichtigungen-ungelesen";

/** Event: der Zaehler soll sofort neu fragen, ohne Speicher. */
export const ZAEHLER_NEU = "benachrichtigungen-neu";

/**
 * Gemerkte Antwort von /api/startseite (StartSitzung). Jeder Abruf kostete live
 * rund 136 ms CPU, der Free-Plan erlaubt 10 ms je Anfrage (2026-10-09); darum
 * fragt die Startseite nur alle zwei Minuten neu. Kontowechsel, Stimme und
 * Bewertung leeren den Speicher.
 */
export const START_SPEICHER = "startseite-sitzung";

export function startSpeicherLeeren(): void {
  try {
    sessionStorage.removeItem(START_SPEICHER);
  } catch {
    // Speicher gesperrt: dann gibt es auch nichts Veraltetes darin.
  }
}

export function zaehlerZuruecksetzen(): void {
  startSpeicherLeeren();
  try {
    sessionStorage.removeItem(ZAEHLER_SPEICHER);
  } catch {
    // Speicher gesperrt: dann gibt es auch nichts Veraltetes darin.
  }
  window.dispatchEvent(new Event(ZAEHLER_NEU));
}
