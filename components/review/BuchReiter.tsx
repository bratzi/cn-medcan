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
 * Ein Reiter des Registers (Nutzer 2026-10-06: statt Pillen in einem dunklen Kasten): gedrucktes
 * Wort auf der Haarlinie, der Strich darunter liegt mit `-mb-px` genau auf ihr. 44 px hoch, auch mit
 * der Maus, damit Register und Titel gleich hoch stehen.
 */
const REITER = "-mb-px inline-flex h-11 items-center border-b-2 text-small font-medium";

/**
 * Platzhalter für die Reiterleiste in einer Tafel mit `eigeneLeiste`. Er steht in einer Kopfzeile
 * neben dem Ansichtsschalter und nimmt dort den freien Platz, damit die Haarlinie des Registers bis
 * an den Schalter läuft (ohne `min-w-0`: wird es eng, bricht die Zeile, statt dass Reiter überlaufen).
 * Wo es keine Leiste gibt (nur eine Tafel), steht an ihrer Stelle der Titel der Tafel, gedruckt wie
 * ein offener Reiter, mit Tintenstrich statt des grünen Bedienstrichs: man kann ihn nicht wählen.
 * Unter lg ist die Leiste verborgen, dort steht immer der Titel, und zwar ohne Haarlinie: über der
 * Einlage liegt mobil schon eine Linie, zwei übereinander wirkten doppelt (Session 41).
 */
export function ReiterLeiste({ titel }: { titel: string }) {
  const leiste = useContext(LeisteKontext);
  const titelZeile = (
    <p data-register="titel" className={cn("flex flex-1 lg:border-b lg:border-border", leiste ? "lg:hidden" : null)}>
      <span className={cn(REITER, "border-text text-text")}>{titel}</span>
    </p>
  );
  if (!leiste) return titelZeile;
  return (
    <>
      <div className="flex-1 max-lg:hidden">{leiste}</div>
      {titelZeile}
    </>
  );
}

/**
 * Die Werte der rechten Buchseite als Reiter (T7b, Nutzer 2026-09-30): ab lg
 * passt die ganze Doppelseite auf einen Bildschirm, Aroma-Karte,
 * Beschaffenheit und Reel stehen dort nacheinander statt untereinander.
 * Unter lg (mobil zurückgestellt) bleibt alles untereinander wie bisher: die
 * Reiterleiste ist verborgen, alle Tafeln sichtbar. Seit 2026-10-06 ein Register
 * wie im gedruckten Buch: Wörter auf einer Haarlinie, kein Kasten, keine Pille;
 * der offene Reiter trägt den grünen Strich (aktiver Zustand, Bedienakzent).
 * Tabs nach APG (ein
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
      className="flex items-end gap-6 border-b border-border max-lg:hidden"
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
            REITER,
            "transition-colors duration-fast ease-standard",
            i === index ? "border-accent text-text" : "border-transparent text-text-muted hover:text-accent-hover",
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
