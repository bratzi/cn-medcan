"use client";

import { useLayoutEffect } from "react";

import { THEMA_SCHLUESSEL, anderesThema } from "@/lib/thema";

/**
 * Hell/Dunkel-Schalter als Lampe, fest unten rechts auf jeder Seite: an =
 * hell, aus = dunkel. Welches Symbol steht, entscheidet allein data-theme per
 * CSS (globals.css .thema-lampe), also ohne React-Zustand und ohne Aufblitzen
 * vor dem Hydrieren. Beim Umschalten sind Übergänge für einen Frame aus, damit
 * die Seite springt statt zu verschmieren (better-ui).
 */
export function ThemaSchalter() {
  // Nur Entwicklung: Strict Mode setzt <html> beim zweiten Einhängen zurück
  // (Next-Doku). In Produktion hat das Kopf-Skript es schon gesetzt.
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(THEMA_SCHLUESSEL) === "dark") document.documentElement.dataset.theme = "dark";
    } catch {}
  }, []);

  const wechsle = () => {
    const wurzel = document.documentElement;
    const neu = anderesThema(wurzel.dataset.theme === "dark" ? "dark" : "light");
    const ruhe = document.createElement("style");
    ruhe.textContent = "*,*::before,*::after{transition:none !important}";
    document.head.appendChild(ruhe);
    wurzel.dataset.theme = neu;
    void wurzel.offsetHeight;
    requestAnimationFrame(() => ruhe.remove());
    try {
      localStorage.setItem(THEMA_SCHLUESSEL, neu);
    } catch {}
  };

  return (
    <button type="button" onClick={wechsle} className="thema-lampe">
      <span className="sr-only thema-ziel-dunkel">Licht aus, dunkel darstellen</span>
      <span className="sr-only thema-ziel-hell">Licht an, hell darstellen</span>
      {/* Lampe an: Birne gefüllt, Strahlen. */}
      <svg aria-hidden="true" viewBox="0 0 24 24" className="thema-lampe-an">
        <path d="M12 3.5a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1v.6h5v-.6c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3.5z" fill="currentColor" fillOpacity="0.9" />
        <path d="M9.5 19h5M10.3 21h3.4" strokeLinecap="round" />
        <path d="M12 .8v1.2M4.1 4.1l.9.9M19.9 4.1l-.9.9M1.5 10.5h1.3M21.2 10.5h1.3" strokeLinecap="round" />
      </svg>
      {/* Lampe aus: nur Umriss, Glühfaden. */}
      <svg aria-hidden="true" viewBox="0 0 24 24" className="thema-lampe-aus">
        <path d="M12 3.5a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1v.6h5v-.6c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3.5z" fill="none" />
        <path d="M10.5 16.5v-3l1.5-1.5 1.5 1.5v3" fill="none" strokeLinejoin="round" />
        <path d="M9.5 19h5M10.3 21h3.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
