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

/**
 * Runder Info-Knopf (24 px sichtbar, 44 px Trefferfläche) mit kurzem Hinweistext.
 * Öffnet bei Hover (Maus), Tastaturfokus und Tippen; Escape und Tippen daneben schließen.
 */
export function InfoKnopf({ text, sprache, className }: { text: ReactNode; sprache: Sprache; className?: string }) {
  const id = useId();
  const [offen, setOffen] = useState(false);
  const huelle = useRef<HTMLSpanElement>(null);
  const blase = useRef<HTMLSpanElement>(null);
  // Waagerechte Verschiebung, damit die mittig hängende Blase am Rand nicht abgeschnitten wird.
  const [versatz, setVersatz] = useState(0);
  // Fokus durch Zeigerdruck soll nicht öffnen, sonst schlösse der folgende Klick gleich wieder.
  const zeiger = useRef<string | null>(null);
  const schritt = (ereignis: InfoKnopfEreignis) => setOffen((jetzt) => infoKnopfSchritt(jetzt, ereignis));

  useEffect(() => {
    if (!offen) return;
    const taste = (e: KeyboardEvent) => {
      if (e.key === "Escape") schritt("escape");
    };
    const daneben = (e: PointerEvent) => {
      if (huelle.current && !huelle.current.contains(e.target as Node)) schritt("blur");
    };
    document.addEventListener("keydown", taste);
    document.addEventListener("pointerdown", daneben);
    return () => {
      document.removeEventListener("keydown", taste);
      document.removeEventListener("pointerdown", daneben);
    };
  }, [offen]);

  useLayoutEffect(() => {
    if (!offen || !blase.current) {
      setVersatz(0);
      return;
    }
    const rand = 16;
    const r = blase.current.getBoundingClientRect();
    const links = r.left - versatz;
    const rechts = r.right - versatz;
    const breite = document.documentElement.clientWidth;
    if (links < rand) setVersatz(rand - links);
    else if (rechts > breite - rand) setVersatz(breite - rand - rechts);
    else setVersatz(0);
    // versatz bewusst nicht in den Abhängigkeiten: gemessen wird nur beim Öffnen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen]);

  return (
    <span ref={huelle} className={cn("relative inline-flex align-middle", className)}>
      <button
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
          "transition-colors duration-fast ease-out hover:border-accent hover:text-accent",
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
        style={versatz ? { marginLeft: versatz } : undefined}
        hidden={!offen}
        className="absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-border bg-surface-raised px-3 py-2 text-left text-small text-text text-pretty shadow-md"
      >
        {text}
      </span>
    </span>
  );
}
