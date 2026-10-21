"use client";

import { useEffect, useEffectEvent, useId, useRef } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Props = {
  titel: string;
  /** Zahl aktiver Werte; 0 heißt: kein Zähler. */
  zahl: number;
  offen: boolean;
  oeffne: () => void;
  schliesse: () => void;
  /** Ergebnisknopf im Sheet: „{anzahl} Treffer zeigen“. */
  fussText: string;
  /** Beschriftung des Chips, wenn sie vom Titel abweicht (Sortier-Menü zeigt die aktive Sortierung). */
  knopfText?: ReactNode;
  /** Nur für Segment-Knöpfe: aria-pressed am Chip (Sortier-Menü „…“). */
  gedrueckt?: boolean;
  /** Chip unter lg ausblenden (Sortier-Segment), Inhalt bleibt erreichbar über den mobilen Weg. */
  className?: string;
  children?: ReactNode;
};

/** Ab dieser Breite Popover unter dem Chip, darunter Bottom-Sheet (Spec 2026-10-21). */
const BREIT = "(width >= 64rem)";
const FOKUSSIERBAR = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * Chip der Werkzeugleiste mit seinem Fenster (Spec 2026-10-21). Ein <dialog> für beide Breiten:
 * ab lg mit show() als Popover direkt unter dem Chip (Fitts: Inhalt dort, wo geklickt wurde), unter
 * lg mit showModal() als Bottom-Sheet (Fokusfalle und inert-Hintergrund vom Browser). Esc und Klick
 * außen schließen, danach steht der Fokus wieder auf dem Chip. Das Popover scrollt selbst
 * (max-h), damit es am unteren Viewport-Rand nicht abgeschnitten wird.
 */
export function ChipFenster({ titel, zahl, offen, oeffne, schliesse, fussText, knopfText, gedrueckt, className, children }: Props) {
  const fensterId = useId();
  const titelId = useId();
  const huelleRef = useRef<HTMLDivElement>(null);
  const knopfRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const schliesseJetzt = useEffectEvent(() => schliesse());

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (offen && !dialog.open) {
      const breit = window.matchMedia(BREIT).matches;
      dialog.dataset.art = breit ? "popover" : "sheet";
      delete dialog.dataset.rechts;
      if (breit) {
        dialog.show();
        // Ragt das Popover rechts aus dem Viewport, richtet es sich an der rechten Chipkante aus.
        if (dialog.getBoundingClientRect().right > document.documentElement.clientWidth) dialog.dataset.rechts = "";
      } else {
        dialog.showModal();
      }
      dialog.querySelector<HTMLElement>(FOKUSSIERBAR)?.focus();
    }
    if (!offen && dialog.open) {
      const fokusDrin = dialog.contains(document.activeElement) || document.activeElement === document.body;
      dialog.close();
      if (fokusDrin) knopfRef.current?.focus();
    }
  }, [offen]);

  // Klick außen (Popover): pointerdown außerhalb von Chip und Fenster schließt.
  useEffect(() => {
    if (!offen) return;
    const druck = (event: PointerEvent) => {
      if (huelleRef.current && !huelleRef.current.contains(event.target as Node)) schliesseJetzt();
    };
    document.addEventListener("pointerdown", druck);
    return () => document.removeEventListener("pointerdown", druck);
  }, [offen]);

  const aktiv = zahl > 0 || gedrueckt === true;

  return (
    <div ref={huelleRef} className={cn("relative shrink-0", className)}>
      <button
        ref={knopfRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={offen}
        aria-controls={fensterId}
        aria-pressed={gedrueckt}
        onClick={offen ? schliesse : oeffne}
        className={cn(
          "inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-small text-text transition-colors duration-fast ease-standard active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
          aktiv || offen ? "border-accent bg-accent-subtle" : "border-border-strong bg-surface hover:border-accent-hover",
        )}
      >
        {knopfText ?? titel}
        {zahl > 0 ? (
          <span className="numeric flex size-6 items-center justify-center rounded-full bg-accent text-caption text-accent-fg">{zahl}</span>
        ) : null}
        <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("size-4 transition-transform duration-fast motion-reduce:transition-none", offen && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        id={fensterId}
        aria-labelledby={titelId}
        onCancel={(event) => {
          event.preventDefault();
          schliesse();
        }}
        onKeyDown={(event) => {
          // Nicht-modales Popover: Esc kommt nicht in jedem Browser als cancel an.
          if (event.key === "Escape") {
            event.preventDefault();
            schliesse();
          }
        }}
        onClose={() => {
          if (offen) schliesse();
        }}
        onClick={(event) => {
          // Sheet: Klick auf den Hintergrund (das dialog-Element selbst) schließt.
          if (event.target === event.currentTarget) schliesse();
        }}
        className={cn(
          "katalog-schublade group m-0 flex-col bg-surface p-0 text-text not-open:hidden open:flex",
          // Bottom-Sheet unter lg (Klassen aus der früheren FilterSchublade).
          "data-[art=sheet]:fixed data-[art=sheet]:inset-x-0 data-[art=sheet]:top-auto data-[art=sheet]:bottom-0 data-[art=sheet]:max-h-[85dvh] data-[art=sheet]:w-full data-[art=sheet]:max-w-none data-[art=sheet]:shadow-lg",
          // Popover ab lg: unter dem Chip, eigenes Scrollen.
          "data-[art=popover]:absolute data-[art=popover]:top-full data-[art=popover]:start-0 data-[art=popover]:end-auto data-[art=popover]:z-30 data-[art=popover]:mt-2 data-[art=popover]:w-80 data-[art=popover]:max-h-[min(70dvh,32rem)] data-[art=popover]:border data-[art=popover]:border-border data-[art=popover]:shadow-md",
          "data-rechts:start-auto data-rechts:end-0",
        )}
      >
        <div aria-hidden="true" className="hidden justify-center pt-2 group-data-[art=sheet]:flex">
          <span className="h-1 w-10 rounded-full bg-border-strong" />
        </div>
        <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-2 group-data-[art=sheet]:pt-2">
          <h2 id={titelId} className="text-small font-medium group-data-[art=sheet]:text-h3">{titel}</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
        {/* Fuß nur im Sheet: unten 16 px oder mehr, wenn das Gerät einen Home-Balken hat (safe-area). */}
        <div className="hidden border-t border-border bg-surface px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] group-data-[art=sheet]:flex">
          <button
            type="button"
            onClick={schliesse}
            className="min-h-11 flex-1 rounded-full bg-accent px-6 text-body font-medium text-accent-fg transition-colors duration-fast hover:bg-accent-hover active:scale-[0.98]"
          >
            {fussText}
          </button>
        </div>
      </dialog>
    </div>
  );
}
