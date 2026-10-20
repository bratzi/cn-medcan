"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = {
  offen: boolean;
  schliesse: () => void;
  gesamt: number;
  zuruecksetzen: () => void;
  /** Beschriftung des Zurücksetzen-Knopfs (gemeinsamer Seitentext). */
  zuruecksetzenText: string;
  texte: Woerterbuch["katalog"]["leiste"];
  sprache?: Sprache;
  children: ReactNode;
};

/**
 * Filter-Schublade von unten (Spec 2026-10-20). Echtes <dialog> mit showModal(): Fokusfalle,
 * inert-Hintergrund und Escape kommen vom Browser. Einfahren nur per CSS-Transition
 * (.katalog-schublade in globals.css mit @starting-style), bei reduzierter Bewegung ohne.
 */
export function FilterSchublade({ offen, schliesse, gesamt, zuruecksetzen, zuruecksetzenText, texte, sprache = "de", children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titelId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (offen && !dialog.open) dialog.showModal();
    if (!offen && dialog.open) dialog.close();
  }, [offen]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titelId}
      onCancel={(event) => {
        event.preventDefault();
        schliesse();
      }}
      onClose={() => {
        if (offen) schliesse();
      }}
      onClick={(event) => {
        // Klick auf den Hintergrund (das dialog-Element selbst) schließt.
        if (event.target === event.currentTarget) schliesse();
      }}
      className="katalog-schublade fixed inset-x-0 bottom-0 top-auto m-0 flex max-h-[85dvh] w-full max-w-none flex-col bg-surface p-0 text-text shadow-lg transition-transform duration-normal ease-standard motion-reduce:transition-none not-open:hidden"
    >
      <div aria-hidden="true" className="flex justify-center pt-2">
        <span className="h-1 w-10 rounded-full bg-border-strong" />
      </div>
      <div className="flex items-center justify-between gap-4 px-4 pb-2">
        <h2 id={titelId} className="text-h3">{texte.filterKnopf}</h2>
        <button
          type="button"
          onClick={schliesse}
          aria-label={texte.schliessen}
          className="flex size-11 items-center justify-center rounded-full text-text hover:bg-surface-sunken"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">{children}</div>
      {/* Fuß: unten 16 px oder mehr, wenn das Gerät einen Home-Balken hat (safe-area). */}
      <div className="flex items-center gap-4 border-t border-border bg-surface px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={zuruecksetzen}
          className="min-h-11 rounded-full border border-border-strong px-4 text-small text-text hover:bg-surface-sunken"
        >
          {zuruecksetzenText}
        </button>
        <button
          type="button"
          onClick={schliesse}
          className="min-h-11 flex-1 rounded-full bg-accent px-6 text-body font-medium text-accent-fg transition-colors duration-fast hover:bg-accent-hover active:scale-[0.98]"
        >
          {mehrzahl(sprache, texte.trefferZeigen, gesamt)}
        </button>
      </div>
    </dialog>
  );
}
