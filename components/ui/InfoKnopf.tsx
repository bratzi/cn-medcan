"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { Sprache } from "@/lib/i18n/sprache-kern";

export type InfoKnopfEreignis = "zeigerRein" | "zeigerRaus" | "fokus" | "blur" | "tippen" | "escape";

/** Zustandswechsel des Info-Knopfs: Hover, Fokus und Tippen öffnen, Tippen schaltet um, Escape schließt. */
export function infoKnopfSchritt(offen: boolean, ereignis: InfoKnopfEreignis): boolean {
  switch (ereignis) {
    case "zeigerRein":
    case "fokus":
      return true;
    case "tippen":
      return !offen;
    default:
      return false;
  }
}

const NAME: Record<Sprache, string> = { de: "Hinweis", en: "Hint" };

type Lage = { x: number; y: number; unten: boolean; pfeil: number };

const RAND = 16;
const ABSTAND = 8;

/**
 * Lage der Blase: über dem Knopf, sonst darunter (zu wenig Platz unter dem Kopf); waagerecht mittig,
 * aber mit 16 px Rand im Fenster; der Pfeil zeigt immer auf den Knopf. Reine Rechnung, getestet.
 */
export function blasenLage(
  knopf: { left: number; top: number; bottom: number; width: number },
  blase: { width: number; height: number },
  fenster: { breite: number; oben: number },
): Lage {
  const mitte = knopf.left + knopf.width / 2;
  const unten = knopf.top - ABSTAND - blase.height < fenster.oben + ABSTAND;
  const x = Math.min(Math.max(mitte - blase.width / 2, RAND), Math.max(RAND, fenster.breite - RAND - blase.width));
  return { x, y: unten ? knopf.bottom + ABSTAND : knopf.top - ABSTAND - blase.height, unten, pfeil: mitte - x };
}

/**
 * Runder Info-Knopf (24 px sichtbar, 44 px Trefferfläche) mit kurzem Hinweis.
 * Öffnet bei Hover (Maus), Tastaturfokus und Tippen; Escape und Tippen daneben schließen.
 * Die Blase liegt als Popover in der obersten Ebene (Nutzer 2026-10-20): kein Container mit
 * overflow schneidet sie ab, sie klappt nach unten, wenn oben der Platz fehlt, und wächst aus dem Knopf.
 */
export function InfoKnopf({ text, sprache, className }: { text: ReactNode; sprache: Sprache; className?: string }) {
  const id = useId();
  const [offen, setOffen] = useState(false);
  const huelle = useRef<HTMLSpanElement>(null);
  const knopf = useRef<HTMLButtonElement>(null);
  const blase = useRef<HTMLSpanElement>(null);
  const [gemessen, setLage] = useState<Lage | null>(null);
  // Geschlossen gilt keine Lage: beim nächsten Öffnen misst die Blase neu, bevor sie sichtbar wird.
  const lage = offen ? gemessen : null;
  // Fokus durch Zeigerdruck soll nicht öffnen, sonst schlösse der folgende Klick gleich wieder.
  const zeiger = useRef<string | null>(null);
  const schritt = (ereignis: InfoKnopfEreignis) => setOffen((jetzt) => infoKnopfSchritt(jetzt, ereignis));

  useEffect(() => {
    if (!offen) return;
    const taste = (e: KeyboardEvent) => {
      if (e.key === "Escape") schritt("escape");
    };
    const daneben = (e: PointerEvent) => {
      const ziel = e.target as Node;
      if (!huelle.current?.contains(ziel) && !blase.current?.contains(ziel)) schritt("blur");
    };
    document.addEventListener("keydown", taste);
    document.addEventListener("pointerdown", daneben);
    return () => {
      document.removeEventListener("keydown", taste);
      document.removeEventListener("pointerdown", daneben);
    };
  }, [offen]);

  useLayoutEffect(() => {
    const el = blase.current;
    if (!el || !knopf.current) return;
    if (!offen) {
      if (el.matches(":popover-open")) el.hidePopover();
      return;
    }
    if (!el.matches(":popover-open")) el.showPopover();
    const messen = () => {
      if (!knopf.current) return;
      const kopf = document.querySelector("body > header")?.getBoundingClientRect().bottom ?? 0;
      setLage(
        blasenLage(knopf.current.getBoundingClientRect(), el.getBoundingClientRect(), {
          breite: document.documentElement.clientWidth,
          oben: Math.max(0, kopf),
        }),
      );
    };
    messen();
    window.addEventListener("scroll", messen, { capture: true, passive: true });
    window.addEventListener("resize", messen);
    return () => {
      window.removeEventListener("scroll", messen, { capture: true });
      window.removeEventListener("resize", messen);
    };
  }, [offen]);

  return (
    <span ref={huelle} className={cn("relative inline-flex align-middle", className)}>
      <button
        ref={knopf}
        type="button"
        aria-label={NAME[sprache]}
        aria-expanded={offen}
        aria-describedby={id}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") schritt("zeigerRein");
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") schritt("zeigerRaus");
        }}
        onPointerDown={(e) => {
          zeiger.current = e.pointerType;
        }}
        onFocus={() => {
          if (zeiger.current === null) schritt("fokus");
        }}
        onBlur={() => {
          zeiger.current = null;
          schritt("blur");
        }}
        onClick={() => {
          if (zeiger.current === "mouse") setOffen(true);
          else schritt("tippen");
          zeiger.current = null;
        }}
        className={cn(
          "relative inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-raised font-buch text-caption font-medium text-text-muted",
          "before:absolute before:top-1/2 before:left-1/2 before:size-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
          "transition-[color,border-color,scale] duration-fast ease-out hover:border-accent hover:text-accent active:scale-96",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          offen && "border-accent text-accent",
        )}
      >
        <span aria-hidden="true">i</span>
      </button>
      <span
        ref={blase}
        id={id}
        role="tooltip"
        popover="manual"
        // Lage aus blasenLage(): feste Koordinaten im Fenster, kein Abstand im Sinne des Rasters.
        style={lage ? { left: lage.x, top: lage.y, transformOrigin: `${lage.pfeil}px ${lage.unten ? "0%" : "100%"}` } : { visibility: "hidden" }}
        className={cn(
          "info-blase fixed inset-auto m-0 w-max max-w-[min(16rem,calc(100vw-2rem))] overflow-visible border border-border bg-surface-raised px-4 py-2 text-left text-small text-text text-pretty shadow-md",
          "transition-[opacity,scale] duration-fast ease-out starting:scale-97 starting:opacity-0 motion-reduce:transition-none",
        )}
      >
        {text}
        {lage ? (
          <span
            aria-hidden="true"
            style={{ left: lage.pfeil }}
            className={cn(
              "absolute size-2 -translate-x-1/2 rotate-45 border-border bg-surface-raised",
              lage.unten ? "-top-1 border-t border-l" : "-bottom-1 border-r border-b",
            )}
          />
        ) : null}
      </span>
    </span>
  );
}
