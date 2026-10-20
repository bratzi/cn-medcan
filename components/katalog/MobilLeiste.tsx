"use client";

import { useEffect, useId, useState } from "react";

import { SortierWahl } from "@/components/katalog/SortierWahl";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { StrainFilter } from "@/lib/query/filter";

type Props = {
  filter: StrainFilter;
  /** Zahl aktiver Filter für das Badge am Knopf. */
  aktiv: number;
  gesamt: number;
  setze: (teil: Partial<StrainFilter>) => void;
  oeffne: () => void;
  texte: Woerterbuch["katalog"]["leiste"];
};

/** Verzögerung für Freitext in Millisekunden, wie in der Filterleiste. */
const DEBOUNCE_MS = 300;

/**
 * Mitlaufende Leiste unter lg (Spec 2026-10-20): Suche, Filter-Knopf, Sortierung in einer Zeile,
 * 56 px hoch, alle Ziele 44 px. Die Fläche liegt halbdurchlässig über der Liste.
 */
export function MobilLeiste({ filter, aktiv, gesamt, setze, oeffne, texte }: Props) {
  const basisId = useId();
  const [q, setQ] = useState(filter.q ?? "");
  const [gesehen, setGesehen] = useState(filter.q ?? "");

  // Neue Suche von außen (Zurücksetzen, Zurück-Taste) übernehmen, eigenes Tippen nicht überschreiben.
  if (gesehen !== (filter.q ?? "")) {
    setGesehen(filter.q ?? "");
    setQ(filter.q ?? "");
  }

  useEffect(() => {
    const getrimmt = q.trim();
    if (getrimmt === (filter.q ?? "")) return;
    const timer = setTimeout(() => setze({ q: getrimmt === "" ? undefined : getrimmt, seite: 1 }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, filter.q, setze]);

  return (
    <div
      className="sticky top-(--kopf-h,4rem) z-20 flex h-14 items-center gap-2 border-b border-border bg-surface/95 px-4 backdrop-blur-sm lg:hidden"
      data-treffer={gesamt}
    >
      <label htmlFor={`${basisId}-q`} className="sr-only">{texte.suche}</label>
      <input
        id={`${basisId}-q`}
        type="search"
        value={q}
        autoComplete="off"
        placeholder={texte.sucheKurz}
        onChange={(event) => setQ(event.target.value)}
        className="h-11 min-w-0 flex-1 rounded-full border border-border-strong bg-surface px-4 text-body text-text placeholder:text-text-muted"
      />
      <button
        type="button"
        onClick={oeffne}
        aria-haspopup="dialog"
        className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-small text-text active:scale-[0.97]"
      >
        {texte.filterKnopf}
        {aktiv > 0 ? (
          <span className="numeric flex size-6 items-center justify-center rounded-full bg-accent text-caption text-accent-fg">
            {aktiv}
          </span>
        ) : null}
      </button>
      <SortierWahl wert={filter.sortierung} setze={setze} texte={texte} kompakt />
    </div>
  );
}
