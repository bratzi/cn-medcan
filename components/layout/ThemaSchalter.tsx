"use client";

import { useLayoutEffect } from "react";

import { THEMA_SCHLUESSEL, anderesThema } from "@/lib/thema";

/**
 * Hell/Dunkel-Schalter im Kopf. Das sichtbare Wort nennt das Ziel; welches
 * steht, entscheidet allein data-theme per CSS (globals.css), also ohne
 * React-Zustand und ohne Aufblitzen vor dem Hydrieren. display:none nimmt
 * das andere Wort auch aus dem zugänglichen Namen.
 */
export function ThemaSchalter({ className }: { className?: string }) {
  // Nur Entwicklung: Strict Mode setzt <html> beim zweiten Einhängen zurück
  // (Next-Doku). In Produktion hat das Kopf-Skript es schon gesetzt.
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(THEMA_SCHLUESSEL) === "dark") document.documentElement.dataset.theme = "dark";
    } catch {}
  }, []);

  const wechsle = () => {
    const neu = anderesThema(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    document.documentElement.dataset.theme = neu;
    try {
      localStorage.setItem(THEMA_SCHLUESSEL, neu);
    } catch {}
  };

  return (
    <button type="button" onClick={wechsle} className={className}>
      <span className="thema-ziel-dunkel">
        Dunkel<span className="sr-only"> darstellen</span>
      </span>
      <span className="thema-ziel-hell">
        Hell<span className="sr-only"> darstellen</span>
      </span>
    </button>
  );
}
