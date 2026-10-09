/**
 * Pfeiltasten in einem Ansichts-Schalter (APG Radiogroup): rechts/unten zur nächsten,
 * links/oben zur vorigen Ansicht, jeweils umlaufend; Pos1/Ende springen an den
 * Rand. Andere Tasten: null, der Browser behält sie. Eigene Datei, damit das
 * Aroma-Netz nicht die ganze Aroma-Karte in sein Bündel zieht.
 */
export function naechsteWahl(taste: string, index: number, anzahl: number): number | null {
  switch (taste) {
    case "ArrowRight":
    case "ArrowDown":
      return (index + 1) % anzahl;
    case "ArrowLeft":
    case "ArrowUp":
      return (index - 1 + anzahl) % anzahl;
    case "Home":
      return 0;
    case "End":
      return anzahl - 1;
    default:
      return null;
  }
}
