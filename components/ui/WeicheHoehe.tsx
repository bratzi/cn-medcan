"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Höhe folgt dem Inhalt weich statt ruckartig (Nutzer 2026-10-16: die Fazit-Box sprang,
 * sobald ein eigener Wert dazukam). Ein ResizeObserver misst den Inhalt, die Hülle bekommt
 * die gemessene Höhe und blendet per `transition: height` über. Ohne JavaScript und vor der
 * ersten Messung bleibt die Höhe `auto`; bei reduzierter Bewegung springt sie wie bisher.
 */
export function WeicheHoehe({ children, className }: { children: ReactNode; className?: string }) {
  const innen = useRef<HTMLDivElement>(null);
  const [hoehe, setHoehe] = useState<number | null>(null);

  useLayoutEffect(() => {
    const ziel = innen.current;
    if (!ziel || typeof ResizeObserver === "undefined") return;
    const beobachter = new ResizeObserver(([eintrag]) => {
      if (eintrag) setHoehe(eintrag.borderBoxSize?.[0]?.blockSize ?? ziel.offsetHeight);
    });
    beobachter.observe(ziel);
    return () => beobachter.disconnect();
  }, []);

  return (
    <div
      className={`overflow-hidden motion-safe:transition-[height] motion-safe:duration-normal motion-safe:ease-out ${className ?? ""}`}
      style={hoehe === null ? undefined : { height: hoehe }}
    >
      <div ref={innen}>{children}</div>
    </div>
  );
}
