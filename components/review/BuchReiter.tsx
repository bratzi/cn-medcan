"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BuchReiterEintrag = { schluessel: string; titel: string; inhalt: ReactNode };

/**
 * Die Werte der rechten Buchseite als Reiter (T7b, Nutzer 2026-09-30): ab lg
 * passt die ganze Doppelseite auf einen Bildschirm, Aroma-Karte, Sweet Spot,
 * Beschaffenheit und Reel stehen dort nacheinander statt untereinander.
 * Unter lg (mobil zurückgestellt) bleibt alles untereinander wie bisher: die
 * Reiterleiste ist verborgen, alle Tafeln sichtbar. Tabs nach APG (ein
 * Tabstopp, Pfeiltasten); das Buch blättert in einer `tablist` nicht um.
 */
export function BuchReiter({ bezeichnung, reiter }: { bezeichnung: string; reiter: readonly BuchReiterEintrag[] }) {
  const basis = useId();
  const [aktiv, setAktiv] = useState(0);
  if (reiter.length === 0) return null;
  const index = Math.min(aktiv, reiter.length - 1);

  const beiTaste = (ereignis: KeyboardEvent<HTMLDivElement>) => {
    const schritt = ereignis.key === "ArrowRight" ? 1 : ereignis.key === "ArrowLeft" ? -1 : 0;
    const ziel =
      ereignis.key === "Home" ? 0 : ereignis.key === "End" ? reiter.length - 1 : schritt === 0 ? null : (index + schritt + reiter.length) % reiter.length;
    if (ziel === null) return;
    ereignis.preventDefault();
    setAktiv(ziel);
    ereignis.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[ziel]?.focus();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 lg:gap-4">
      {reiter.length > 1 ? (
        <div
          role="tablist"
          aria-label={bezeichnung}
          onKeyDown={beiTaste}
          className="inline-flex self-start rounded-full border border-border-strong p-1 max-lg:hidden"
        >
          {reiter.map((eintrag, i) => (
            <button
              key={eintrag.schluessel}
              id={`${basis}-${eintrag.schluessel}-reiter`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-controls={`${basis}-${eintrag.schluessel}`}
              tabIndex={i === index ? 0 : -1}
              onClick={() => setAktiv(i)}
              className={cn(
                "inline-flex h-9 items-center rounded-full px-4 text-small font-medium",
                "transition-colors duration-fast ease-standard",
                i === index ? "bg-accent text-accent-fg" : "text-text hover:text-accent-hover",
              )}
            >
              {eintrag.titel}
            </button>
          ))}
        </div>
      ) : null}
      {reiter.map((eintrag, i) => (
        <div
          key={eintrag.schluessel}
          id={`${basis}-${eintrag.schluessel}`}
          role={reiter.length > 1 ? "tabpanel" : undefined}
          aria-labelledby={reiter.length > 1 ? `${basis}-${eintrag.schluessel}-reiter` : undefined}
          // Nur ab lg verborgen: mobil stehen alle Tafeln untereinander.
          className={cn("min-h-0", i === index ? "lg:flex-1" : "lg:hidden")}
        >
          {eintrag.inhalt}
        </div>
      ))}
    </div>
  );
}
