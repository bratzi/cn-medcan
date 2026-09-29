"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Ob eine Seite im Buch offen ist oder gleich kommt (Buch.tsx, lib/buch.ts
 * nahSeite). Außerhalb eines Buchs (Startseite, /reviews) gilt immer ja.
 */
export const AufgeschlagenKontext = createContext(true);

/**
 * Rendert Teures nur auf nahen Seiten des Buchs (T7): die Aroma-Karte kostet
 * im Server-Rendern rund 1 ms je Doppelseite, bei bis zu zwanzig Bewertungen
 * zu viel für das CPU-Limit von 10 ms. Ferne Seiten sind verborgen; ihre
 * Karte kommt im Browser dazu, sobald man in ihre Nähe blättert. Ohne
 * JavaScript bleiben Text und Werte jeder Seite lesbar.
 */
export function NurAufgeschlagen({ children }: { children: ReactNode }) {
  return useContext(AufgeschlagenKontext) ? children : null;
}
