/**
 * Der Falz ab lg (Doppelseite und Buch): je Seite ein leiser Verlauf von 2rem an der
 * Mitte. Die Seiten sind deckend, weil das Buch (Buch.tsx) die Hälften einzeln um den Falz dreht.
 */
export const FALZ_LINKS =
  "lg:border-r lg:border-border lg:bg-[linear-gradient(to_left,color-mix(in_oklab,var(--color-text)_7%,transparent),transparent_2rem)]";
export const FALZ_RECHTS =
  "lg:bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-text)_7%,transparent),transparent_2rem)]";
