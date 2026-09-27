"use client";

import { useEffect } from "react";

import { benachrichtigungenGelesen } from "@/app/mitglied/aktionen";
import { zaehlerZuruecksetzen } from "@/components/layout/konto-zaehler-speicher";

/**
 * Markiert nach dem Anzeigen einmal die angezeigten ungelesenen als gelesen.
 * Der Zaehler im Kopf fragt danach neu statt auf 0 zu springen: aeltere
 * Ungelesene jenseits der Liste zaehlen weiter.
 */
export function GelesenMarkieren({ ids }: { ids: readonly string[] }) {
  // Als Text, damit ein neues Array mit gleichem Inhalt keinen zweiten Aufruf ausloest.
  const schluessel = ids.join(",");
  useEffect(() => {
    if (!schluessel) return;
    void benachrichtigungenGelesen(schluessel.split(","))
      .then(zaehlerZuruecksetzen)
      .catch(() => {
        // Verbindungsfehler: der Zaehler bleibt stehen, naechster Versuch beim naechsten Besuch.
      });
  }, [schluessel]);
  return null;
}
