"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BuchReiterEintrag = {
  schluessel: string;
  titel: string;
  inhalt: ReactNode;
  /**
   * Die Tafel setzt die Reiterleiste selbst über `<ReiterLeiste />` (die
   * Aroma-Karte stellt sie in ihre Kopfzeile neben Karte/Netz und spart so eine
   * Zeile); sonst steht die Leiste über dem Inhalt. Kein Render-Prop: die
   * Einträge kommen aus einer Server-Komponente, Funktionen überqueren die
   * Grenze nicht.
   */
  eigeneLeiste?: boolean;
};

const LeisteKontext = createContext<ReactNode>(null);

/**
 * Platzhalter für die Reiterleiste in einer Tafel mit `eigeneLeiste`. Wo es keine Leiste gibt
 * (nur eine Tafel), steht an ihrer Stelle der Titel der Tafel.
 */
export function ReiterLeiste({ titel }: { titel: string }) {
  const leiste = useContext(LeisteKontext);
  return leiste ?? <p className="text-small font-medium text-text">{titel}</p>;
}

/**
 * Die Werte der rechten Buchseite als Reiter (T7b, Nutzer 2026-09-30): ab lg
 * passt die ganze Doppelseite auf einen Bildschirm, Aroma-Karte,
 * Beschaffenheit und Reel stehen dort nacheinander statt untereinander.
 * Unter lg (mobil zurückgestellt) bleibt alles untereinander wie bisher: die
 * Reiterleiste ist verborgen, alle Tafeln sichtbar. Tabs nach APG (ein
 * Tabstopp, Pfeiltasten, Pos1/Ende); das Buch blättert in einer `tablist`
 * nicht um.
 */
export function BuchReiter({ bezeichnung, reiter }: { bezeichnung: string; reiter: readonly BuchReiterEintrag[] }) {
  const basis = useId();
  const [aktiv, setAktiv] = useState(0);
  // Die Leiste zieht mit dem Reiter in eine andere Tafel um: der Fokus folgt nach dem Rendern.
  const fokusFolgt = useRef(false);
  const index = Math.min(aktiv, Math.max(reiter.length - 1, 0));
  const reiterId = (schluessel: string) => `${basis}-${schluessel}-reiter`;

  useEffect(() => {
    if (!fokusFolgt.current) return;
    fokusFolgt.current = false;
    document.getElementById(reiterId(reiter[index].schluessel))?.focus();
  });

  if (reiter.length === 0) return null;
  const mehrere = reiter.length > 1;

  const waehle = (ziel: number, fokus: boolean) => {
    fokusFolgt.current = fokus;
    setAktiv(ziel);
  };

  const beiTaste = (ereignis: KeyboardEvent<HTMLDivElement>) => {
    const schritt = ereignis.key === "ArrowRight" ? 1 : ereignis.key === "ArrowLeft" ? -1 : 0;
    const ziel =
      ereignis.key === "Home"
        ? 0
        : ereignis.key === "End"
          ? reiter.length - 1
          : schritt === 0
            ? null
            : (index + schritt + reiter.length) % reiter.length;
    if (ziel === null) return;
    ereignis.preventDefault();
    waehle(ziel, true);
  };

  const leiste = mehrere ? (
    <div
      role="tablist"
      aria-label={bezeichnung}
      onKeyDown={beiTaste}
      className="inline-flex shrink-0 self-start rounded-full border border-border-strong p-1 max-lg:hidden"
    >
      {reiter.map((eintrag, i) => (
        <button
          key={eintrag.schluessel}
          id={reiterId(eintrag.schluessel)}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-controls={`${basis}-${eintrag.schluessel}`}
          tabIndex={i === index ? 0 : -1}
          onClick={() => waehle(i, false)}
          className={cn(
            // Wie der Ansicht-Schalter der Karte: 36 px mit Maus, 44 px auf Touch.
            "inline-flex h-9 items-center rounded-full px-4 text-small font-medium pointer-coarse:h-11",
            "transition-colors duration-fast ease-standard",
            i === index ? "bg-accent text-accent-fg" : "text-text hover:text-accent-hover",
          )}
        >
          {eintrag.titel}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      {reiter.map((eintrag, i) => {
        const offen = i === index;
        const eigeneLeiste = eintrag.eigeneLeiste === true;
        return (
          <div
            key={eintrag.schluessel}
            id={`${basis}-${eintrag.schluessel}`}
            role={mehrere ? "tabpanel" : undefined}
            aria-labelledby={mehrere ? reiterId(eintrag.schluessel) : undefined}
            // Nur ab lg verborgen: mobil stehen alle Tafeln untereinander.
            className={cn("flex min-h-0 flex-col gap-4", offen ? "lg:flex-1" : "lg:hidden")}
          >
            {offen && !eigeneLeiste ? leiste : null}
            {eigeneLeiste ? (
              <LeisteKontext.Provider value={offen ? leiste : null}>{eintrag.inhalt}</LeisteKontext.Provider>
            ) : (
              eintrag.inhalt
            )}
          </div>
        );
      })}
    </div>
  );
}
