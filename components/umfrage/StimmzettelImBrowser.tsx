"use client";

import type { ReactNode } from "react";

import { useStartSitzung } from "@/components/story/StartSitzung";
import { eigeneStimmeAuf, stimmzettelAnzeige, type StimmzettelAnzeige } from "@/lib/startseite-sitzung";

/**
 * Die Aktionszeile des statischen Stimmzettels (Startseite, Spec 2026-10-01,
 * statische Seiten, 4.3): Alle Varianten rendert der Server vorab, der Browser
 * wählt nach dem Stand von /api/startseite. Über das Schreiben entscheidet
 * weiter allein die Server Action.
 */
export function StimmzettelAktion({
  umfrageId,
  varianten,
}: {
  umfrageId: string;
  varianten: Record<StimmzettelAnzeige, ReactNode>;
}) {
  const sitzung = useStartSitzung();
  return <>{varianten[sitzung ? stimmzettelAnzeige(sitzung.stand, umfrageId) : "laedt"]}</>;
}

/** Vermerk und Badge der eigenen Stimme, sobald der Browser sie kennt. */
export function EigeneStimme({
  umfrageId,
  optionId,
  children,
}: {
  umfrageId: string;
  optionId: string;
  children: ReactNode;
}) {
  const sitzung = useStartSitzung();
  return sitzung && eigeneStimmeAuf(sitzung.stand, umfrageId, optionId) ? <>{children}</> : null;
}
