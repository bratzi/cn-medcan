"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

type Props = {
  /** Beschriftung des Knopfs (w.kopf.menue). */
  texte: { oeffnen: string; schliessen: string };
  children: ReactNode;
};

const MENUE_ID = "kopf-menue";

/**
 * Aufklappmenü des Kopfs unter lg (Nutzer 2026-09-27: die wischbare Leiste
 * wirkte schmal zu voll). Natives Popover: öffnet ohne JavaScript und vor dem
 * Hydrieren, Escape und Klick daneben schließen es, der Browser setzt
 * aria-expanded am Knopf. Hier nur das Schließen nach einem Linkklick und
 * nach einem Seitenwechsel, weil der Kopf im Root-Layout stehen bleibt.
 */
export function KopfMenue({ texte, children }: Props) {
  const pfad = usePathname();
  const tafel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tafel.current?.hidePopover?.();
  }, [pfad]);

  const linkGeklickt = (ereignis: MouseEvent<HTMLDivElement>) => {
    if ((ereignis.target as HTMLElement).closest("a")) tafel.current?.hidePopover?.();
  };

  return (
    <>
      <button type="button" popoverTarget={MENUE_ID} className="kopf-menue-knopf lg:hidden">
        <span className="sr-only">{texte.oeffnen}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </button>
      <div ref={tafel} id={MENUE_ID} popover="auto" className="kopf-menue" onClick={linkGeklickt}>
        <button type="button" popoverTarget={MENUE_ID} popoverTargetAction="hide" className="kopf-menue-knopf kopf-menue-zu">
          <span className="sr-only">{texte.schliessen}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {children}
      </div>
    </>
  );
}
