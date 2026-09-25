"use client";

import { useLayoutEffect } from "react";

import { THEMA_SCHLUESSEL, anderesThema } from "@/lib/thema";

/**
 * Hell/Dunkel-Schalter als Grow-Zelt (seit 2026-09-25, vorher Lampe), fest
 * oben links: offen mit Licht = hell, zu = dunkel. Welches Symbol steht, entscheidet allein data-theme per
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
      {/* Grow-Zelt offen (hell, Nutzer 2026-09-25): Tür hochgerollt, Licht fällt
          aus der Öffnung, drinnen eine Pflanze. Zelt in Textfarbe, Licht warm. */}
      <svg aria-hidden="true" viewBox="0 0 24 24" className="thema-lampe-an">
        <path d="M10.5 3.5V2h3v1.5" stroke="var(--color-text)" strokeLinejoin="round" />
        <path d="M7.5 9.5h9V21h-9z" fill="currentColor" fillOpacity="0.35" stroke="none" />
        <path d="M12 21v-4.2" stroke="var(--color-accent)" strokeLinecap="round" />
        <path d="M12 18.4c-1.6-1.3-3-1.2-3.6-.4 1.2 1.1 2.5 1.2 3.6.4zM12 17.2c1.6-1.4 3-1.3 3.6-.5-1.2 1.1-2.5 1.2-3.6.5z" fill="var(--color-accent)" stroke="none" />
        <rect x="7" y="7.4" width="10" height="2.3" rx="1.15" fill="var(--color-surface)" stroke="var(--color-text)" />
        <rect x="4" y="3.5" width="16" height="17.5" rx="1.5" fill="none" stroke="var(--color-text)" />
        <path d="M4 22.5h16" stroke="var(--color-text)" strokeLinecap="round" />
      </svg>
      {/* Grow-Zelt zu (dunkel): Reißverschluss-Tür als Bogen, Zug in der Mitte. */}
      <svg aria-hidden="true" viewBox="0 0 24 24" className="thema-lampe-aus">
        <path d="M10.5 3.5V2h3v1.5" strokeLinejoin="round" />
        <rect x="4" y="3.5" width="16" height="17.5" rx="1.5" fill="none" />
        <path d="M7 21V10.5c0-2 2.2-3.5 5-3.5s5 1.5 5 3.5V21" fill="none" strokeLinejoin="round" />
        <path d="M12 7v14" strokeDasharray="1 1.4" />
        <path d="M12 12.5v2" strokeLinecap="round" strokeWidth="2" />
        <path d="M4 22.5h16" strokeLinecap="round" />
      </svg>
    </button>
  );
}
