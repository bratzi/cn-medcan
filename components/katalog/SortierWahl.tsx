"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { SORTIERUNGEN, type Sortierung, type StrainFilter } from "@/lib/query/filter";

/**
 * Sortierung der Blütenseite, geteilt von MobilLeiste (schmal, Beschriftung nur für Screenreader) und
 * Werkzeugleiste am Desktop (Beschriftung sichtbar), Task 2. Der Wert lebt im URL-Zustand
 * (`sortierung`, Standard `community`); jede Änderung springt auf Seite 1. h-11: 44 px Touch-Ziel.
 */
export function SortierWahl({
  wert,
  setze,
  texte,
  kompakt = false,
}: {
  wert: Sortierung;
  setze: (teil: Partial<StrainFilter>) => void;
  texte: Woerterbuch["katalog"]["leiste"];
  kompakt?: boolean;
}) {
  const id = useId();
  return (
    <>
      <label htmlFor={id} className={kompakt ? "sr-only" : "text-small text-text-muted"}>
        {texte.sortierung}
      </label>
      <select
        id={id}
        value={wert}
        onChange={(event) => setze({ sortierung: event.target.value as Sortierung, seite: 1 })}
        className={cn("h-11 shrink-0 rounded-full border border-border-strong bg-surface text-small text-text", kompakt ? "w-28 px-2" : "px-4")}
      >
        {SORTIERUNGEN.map((s) => (
          <option key={s} value={s}>
            {texte.sortierungen[s]}
          </option>
        ))}
      </select>
    </>
  );
}
