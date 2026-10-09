"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { formatiereDelta, type FazitDelta } from "@/lib/fazit-delta";
import { t } from "@/lib/i18n/text";
import type { AromaTexte } from "@/lib/i18n/typen";

/**
 * Mitlaufendes Fazit beim Bewerten (T16, Nutzer 2026-09-30). EIN Fazit im DOM, per
 * Layout platziert: ab 118rem steht es sticky im rechten Seitenrand neben den drei Schritten
 * (unter dem festen Kopf, `--kopf-h` aus KopfZustand); darunter ist dasselbe Element ein
 * Sheet von unten, geöffnet über eine einklappbare Leiste mit dem Kurz-Fazit (eigene
 * Sortennote bzw. Community-Wert, dazu das Delta mit Pfeil und Vorzeichen). Die Leiste
 * steht nur, solange die Erkundung im Viewport ist (IntersectionObserver).
 * Außen neben dem Arbeitsbereich erst ab 118rem (Nutzer 2026-09-30): dort reicht der Seitenrand neben max-w-360 für 14rem Fazit, die Regler behalten ihre volle Breite.
 * Darunter gilt die Leiste.
 */
export function FazitLauf({
  id,
  kurz,
  beobachte,
  texte,
  children,
}: {
  id: string;
  /** Kurz-Fazit der mobilen Leiste: Beschriftung, formatierter Wert, Delta zur Community. */
  kurz: { label: string; wert: string; delta: FazitDelta | null };
  /** Die Erkundung: solange sie im Viewport ist, steht die Leiste. */
  beobachte: RefObject<HTMLElement | null>;
  texte: AromaTexte;
  children: ReactNode;
}) {
  const [offen, setOffen] = useState(false);
  const [sichtbar, setSichtbar] = useState(false);
  const leiste = useRef<HTMLButtonElement>(null);
  const schliessen = useRef<HTMLButtonElement>(null);
  const warOffen = useRef(false);
  const sheet = useRef<HTMLElement>(null);

  useEffect(() => {
    const ziel = beobachte.current;
    if (!ziel || typeof IntersectionObserver === "undefined") return;
    const beobachter = new IntersectionObserver(([eintrag]) => setSichtbar(eintrag?.isIntersecting ?? false));
    beobachter.observe(ziel);
    return () => beobachter.disconnect();
  }, [beobachte]);

  // Fokus ins Sheet beim Öffnen, beim Schließen zurück auf die Leiste; Esc schließt.
  useEffect(() => {
    if (offen) {
      warOffen.current = true;
      schliessen.current?.focus();
      // Echt modal (T16-Fix I2): Tab und Umschalt+Tab bleiben im Sheet.
      const taste = (ereignis: KeyboardEvent) => {
        if (ereignis.key === "Escape") setOffen(false);
        if (ereignis.key !== "Tab" || !sheet.current) return;
        const fokussierbar = Array.from(
          sheet.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        );
        const erstes = fokussierbar[0];
        const letztes = fokussierbar[fokussierbar.length - 1];
        if (!erstes || !letztes) return;
        const aktiv = document.activeElement;
        if (ereignis.shiftKey && (aktiv === erstes || !sheet.current.contains(aktiv))) {
          ereignis.preventDefault();
          letztes.focus();
        } else if (!ereignis.shiftKey && (aktiv === letztes || !sheet.current.contains(aktiv))) {
          ereignis.preventDefault();
          erstes.focus();
        }
      };
      document.addEventListener("keydown", taste);
      return () => document.removeEventListener("keydown", taste);
    }
    if (warOffen.current) {
      warOffen.current = false;
      leiste.current?.focus();
    }
  }, [offen]);

  const { delta } = kurz;
  const pfeil = delta ? { hoch: "↑", runter: "↓", gleich: "=" }[delta.richtung] : null;
  const deltaVorgelesen = delta
    ? delta.richtung === "gleich"
      ? texte.aroma.fazitLauf.gleich
      : t(delta.richtung === "hoch" ? texte.aroma.fazitLauf.ueber : texte.aroma.fazitLauf.unter, {
          wert: String(Math.abs(delta.punkte)),
        })
    : null;

  return (
    <>
      {/* Platz unter der Erkundung, solange die Leiste steht: sie verdeckt nichts. */}
      <div aria-hidden="true" className={sichtbar ? "h-[calc(3.5rem+env(safe-area-inset-bottom))] min-[118rem]:hidden" : "hidden"} />

      {offen ? (
        <div aria-hidden="true" data-fazit-hintergrund="" onClick={() => setOffen(false)} className="fazit-lauf-bewegt fixed inset-0 z-40 bg-surface-sunken opacity-80 min-[118rem]:hidden starting:opacity-0 transition-opacity duration-normal ease-out" />
      ) : null}

      <aside
        ref={sheet}
        id={id}
        aria-label={texte.aroma.fazitLauf.titel}
        {...(offen ? { role: "dialog", "aria-modal": true } : {})}
        className={
          "min-[118rem]:absolute min-[118rem]:inset-y-0 min-[118rem]:left-full min-[118rem]:ml-8 min-[118rem]:block min-[118rem]:w-56 " +
          (offen
            ? "fazit-lauf-bewegt fixed inset-x-0 bottom-0 z-50 max-h-[85svh] overflow-y-auto rounded-t-lg border-t border-border bg-surface px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] overscroll-contain shadow-lg transition-transform duration-normal ease-out starting:translate-y-full min-[118rem]:z-auto min-[118rem]:max-h-none min-[118rem]:overflow-visible min-[118rem]:rounded-none min-[118rem]:border-0 min-[118rem]:bg-transparent min-[118rem]:p-0 min-[118rem]:shadow-none"
            : "hidden")
        }
      >
        {offen ? (
          <div className="flex justify-end min-[118rem]:hidden">
            <button
              ref={schliessen}
              type="button"
              onClick={() => setOffen(false)}
              aria-controls={id}
              aria-expanded="true"
              className="min-h-11 px-4 text-small text-accent underline underline-offset-4 hover:text-accent-hover"
            >
              {texte.aroma.fazitLauf.schliessen}
            </button>
          </div>
        ) : null}
        {/* Seit dem Live-Netz (2026-10-09) ist die Spalte höher als das Fenster: sie scrollt in sich, nur senkrecht (die Scrollleiste nahm 15 px Breite, live 2026-10-09). */}
        <div className="min-[118rem]:sticky min-[118rem]:top-[calc(var(--kopf-h,4rem)+2rem)] min-[118rem]:max-h-[calc(100svh-var(--kopf-h,4rem)-4rem)] min-[118rem]:overflow-y-auto min-[118rem]:overflow-x-hidden min-[118rem]:overscroll-contain">{children}</div>
      </aside>

      <button
        ref={leiste}
        type="button"
        data-fazit-leiste=""
        aria-controls={id}
        aria-expanded={offen}
        onClick={() => setOffen(true)}
        className={
          "fazit-lauf-bewegt fixed inset-x-0 bottom-0 z-30 flex min-h-14 items-center justify-between gap-4 border-t border-border bg-surface px-4 pb-[env(safe-area-inset-bottom)] text-left shadow-lg transition-[translate,visibility] duration-normal ease-out min-[118rem]:hidden " +
          (sichtbar && !offen ? "visible translate-y-0" : "invisible translate-y-full")
        }
      >
        <span className="text-small uppercase tracking-wide text-text-muted">
          <span className="sr-only">{texte.aroma.fazitLauf.anzeigen}: </span>
          {kurz.label}
        </span>
        <span className="flex items-baseline gap-4">
          <span className="numeric text-h2 font-medium text-text">{kurz.wert}</span>
          {delta ? (
            <>
              <span aria-hidden="true" className="numeric text-small text-kopierstift">
                {pfeil} {t(texte.aroma.fazitLauf.delta, { wert: formatiereDelta(delta.punkte, texte.sprache) })}
              </span>
              <span className="sr-only">, {deltaVorgelesen}</span>
            </>
          ) : null}
          <span aria-hidden="true" className="text-small text-accent">{"⌃"}</span>
        </span>
      </button>
    </>
  );
}
