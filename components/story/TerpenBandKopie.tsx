"use client";

import { useEffect, useRef } from "react";

/**
 * Zweite, stumme Kopie des Terpen-Bands (TerpenBand.tsx) für den nahtlosen
 * Lauf. Der Server rendert die Liste nur einmal (CPU-Limit der Startseite,
 * Fehler 1102); diese Insel klont nach dem Laden die Icons der ersten Liste.
 * Die Kopie trägt keine Tooltips, keine ids und keinen Tabstopp und bleibt per
 * aria-hidden für Screenreader stumm. Ohne JavaScript fehlt sie, das Band steht
 * dann wie bei reduzierter Bewegung (globals.css, Abschnitt „Terpen-Band“).
 */
export function TerpenBandKopie() {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const ziel = ref.current;
    const quelle = ziel?.previousElementSibling;
    if (!ziel || !quelle) return;
    const kopien = Array.from(quelle.children, (eintrag) => {
      const klon = eintrag.cloneNode(true) as HTMLElement;
      klon.querySelectorAll('[role="tooltip"], .sr-only').forEach((knoten) => knoten.remove());
      klon.querySelectorAll("[tabindex], [aria-describedby], [id]").forEach((knoten) => {
        knoten.removeAttribute("tabindex");
        knoten.removeAttribute("aria-describedby");
        knoten.removeAttribute("id");
      });
      return klon;
    });
    ziel.replaceChildren(...kopien);
    return () => ziel.replaceChildren();
  }, []);

  return (
    <ul
      ref={ref}
      aria-hidden="true"
      className="terpen-band-liste flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12"
    />
  );
}
