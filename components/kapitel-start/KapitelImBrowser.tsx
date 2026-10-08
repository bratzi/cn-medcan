"use client";

import { useDeferredValue, ViewTransition, type ReactNode } from "react";

import { KapitelAufschlag, type KapitelTexte } from "@/components/kapitel-start/KapitelAufschlag";
import { useStartSitzung } from "@/components/story/StartSitzung";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { kapitelAnzeige } from "@/lib/startseite-sitzung";

/**
 * Schaufenster oder eigenes Kapitel (Spec Dein Kapitel 4.3). Das statische HTML trägt das
 * Schaufenster; kommt die Sitzung mit einem Kapitel zurück, schlägt das Buch das eigene auf
 * (ViewTransition, bei reduzierter Bewegung sofort). Laden und Fehler lassen das Schaufenster stehen.
 */
export function KapitelImBrowser({ schaufenster, texte, sprache }: { schaufenster: ReactNode; texte: KapitelTexte; sprache: Sprache }) {
  const sitzung = useStartSitzung();
  // useDeferredValue statt setState: nur Transitions, Suspense und useDeferredValue lösen die
  // ViewTransition aus (Next-Doku view-transitions), ein einfaches setState in StartSitzung nicht.
  const eigenes = useDeferredValue(sitzung ? kapitelAnzeige(sitzung.stand) : null);
  return (
    <>
      <ViewTransition key={eigenes ? "eigen" : "schaufenster"} enter="auto" exit="auto" default="none">
        <div>{eigenes ? <KapitelAufschlag daten={eigenes} art="eigen" texte={texte} sprache={sprache} /> : schaufenster}</div>
      </ViewTransition>
      <p aria-live="polite" className="sr-only">
        {eigenes ? texte.kapitel.geladen : ""}
      </p>
    </>
  );
}
