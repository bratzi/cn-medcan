"use client";

import { useEffect } from "react";

import { benachrichtigungenGelesen } from "@/app/mitglied/aktionen";

/** Markiert nach dem Anzeigen einmal alles als gelesen und setzt den Zaehler im Kopf auf 0. */
export function GelesenMarkieren({ ungelesen }: { ungelesen: number }) {
  useEffect(() => {
    if (ungelesen === 0) return;
    void benachrichtigungenGelesen()
      .then(() => window.dispatchEvent(new Event("benachrichtigungen-gelesen")))
      .catch(() => {
        // Verbindungsfehler: der Zaehler bleibt stehen, naechster Versuch beim naechsten Besuch.
      });
  }, [ungelesen]);
  return null;
}
