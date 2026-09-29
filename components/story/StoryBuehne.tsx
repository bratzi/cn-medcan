"use client";

import { useEffect } from "react";

import { abonniereEinstellungen, istSparmodus } from "@/lib/einstellungen";

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
    // Ruhe: reduzierte Bewegung oder Sparmodus der Schalterleiste (T2).
    const ruhe = () => reduziert.matches || istSparmodus();
    let stopp: (() => void) | null = null;
    let laeuft = false;
    let beendet = false;

    const starten = () => {
      if (laeuft || ruhe()) return;
      laeuft = true;
      import("./bewegung/start")
        // Vor dem Start pruefen, nicht erst danach: in der Entwicklung haengt
        // React den Effekt zweimal ein (Strict Mode). Sonst liefen zwei Buehnen
        // gleichzeitig, und das Aufraeumen der ersten zerlegte die zweite.
        .then(({ starteBuehne }) => (beendet || ruhe() ? null : starteBuehne()))
        .then((aufraeumen) => {
          if (!aufraeumen) {
            laeuft = false;
            return;
          }
          if (beendet || ruhe()) {
            aufraeumen();
            laeuft = false;
          } else stopp = aufraeumen;
        })
        .catch((fehler: unknown) => {
          laeuft = false;
          // Ohne Bewegung ist die Seite vollständig; der CSS-Notfall blendet den Auftakt ein.
          // In der Entwicklung trotzdem sichtbar machen, sonst fällt ein Fehlstart nicht auf.
          if (process.env.NODE_ENV !== "production") console.error("StoryBuehne startete nicht", fehler);
        });
    };

    const beiWechsel = () => {
      if (!ruhe()) {
        starten();
        return;
      }
      stopp?.();
      stopp = null;
      laeuft = false;
    };
    starten();
    reduziert.addEventListener("change", beiWechsel);
    const abbestellen = abonniereEinstellungen(beiWechsel);

    return () => {
      beendet = true;
      reduziert.removeEventListener("change", beiWechsel);
      abbestellen();
      stopp?.();
      stopp = null;
    };
  }, []);

  return null;
}
