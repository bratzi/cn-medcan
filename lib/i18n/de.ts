/**
 * Deutsches Woerterbuch, Quelle der Wahrheit (Spec Englisch 5.1).
 * Gegliedert nach Bereich. Platzhalter {name}; Mehrzahl als { one, other }.
 * Meldungen (Rueckgaben von Pruefungen und Server Actions) flach unter
 * `meldung` mit Punkt-Schluesseln, damit MeldungSchluessel ein einfacher
 * Schluesseltyp bleibt.
 */
export const de = {
  rahmen: {
    direktZumInhalt: "Direkt zum Inhalt",
    beschreibung:
      "Bewertungen verschreibungspflichtiger Cannabisarzneimittel nach festem Schema, jeweils an eine Charge gebunden. Die Community stimmt ab, welche Sorte als Nächstes bewertet wird.",
  },
  sprache: {
    gruppe: "Sprache",
  },
  meldung: {
    "allgemein.unbekannt": "Das hat nicht geklappt. Bitte erneut versuchen.",
  },
} as const;
