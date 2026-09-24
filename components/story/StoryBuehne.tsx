"use client";

import { useEffect } from "react";

/**
 * Die einzige Client-Insel für Bewegung (Spec 6.2). Rendert nichts, findet
 * ihre Ziele über data-story im Server-HTML und lädt GSAP und Lenis erst
 * nach dem Hydrieren. Bei reduzierter Bewegung wird nichts geladen; wechselt
 * die Einstellung zur Laufzeit auf "reduzieren", räumt sie auf und die
 * Endzustände stehen da.
 */
export function StoryBuehne() {
  useEffect(() => {
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stopp: (() => void) | null = null;
    let beendet = false;

    if (!reduziert.matches) {
      import("./bewegung/start")
        // Vor dem Start pruefen, nicht erst danach: in der Entwicklung haengt
        // React den Effekt zweimal ein (Strict Mode). Sonst liefen zwei Buehnen
        // gleichzeitig, und das Aufraeumen der ersten zerlegte die zweite.
        .then(({ starteBuehne }) => (beendet || reduziert.matches ? null : starteBuehne()))
        .then((aufraeumen) => {
          if (!aufraeumen) return;
          if (beendet || reduziert.matches) aufraeumen();
          else stopp = aufraeumen;
        })
        .catch((fehler: unknown) => {
          // Ohne Bewegung ist die Seite vollständig; der CSS-Notfall blendet den Auftakt ein.
          // In der Entwicklung trotzdem sichtbar machen, sonst fällt ein Fehlstart nicht auf.
          if (process.env.NODE_ENV !== "production") console.error("StoryBuehne startete nicht", fehler);
        });
    }

    const beiWechsel = () => {
      if (!reduziert.matches) return;
      stopp?.();
      stopp = null;
    };
    reduziert.addEventListener("change", beiWechsel);

    return () => {
      beendet = true;
      reduziert.removeEventListener("change", beiWechsel);
      stopp?.();
      stopp = null;
    };
  }, []);

  return null;
}
