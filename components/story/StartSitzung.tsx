"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { SitzungsStand, StartseitenSitzung } from "@/lib/startseite-sitzung";

type Kontext = { stand: SitzungsStand; neuLaden: () => void };

const SitzungsKontext = createContext<Kontext | null>(null);

/** Danach zeigen die Inseln ihren Fehlertext, und die StoryBuehne wartet nicht länger. */
const ZEITLIMIT_MS = 8000;

async function laden(): Promise<SitzungsStand> {
  try {
    const antwort = await fetch("/api/startseite", {
      credentials: "same-origin",
      signal: AbortSignal.timeout(ZEITLIMIT_MS),
    });
    if (!antwort.ok) return { status: "fehler" };
    return { status: "fertig", daten: (await antwort.json()) as StartseitenSitzung };
  } catch {
    return { status: "fehler" };
  }
}

/**
 * Die nutzerbezogenen Teile der statischen Startseite (Spec 2026-10-01,
 * statische Seiten, 4.3): ein Abruf von /api/startseite für alle Inseln
 * (Stimmzettel, Empfehlungen, Budpic-Zugang). neuLaden() holt den Stand nach
 * dem Abstimmen erneut; bis dahin bleibt der alte stehen.
 */
export function StartSitzung({ children }: { children: ReactNode }) {
  const [stand, setStand] = useState<SitzungsStand>({ status: "laedt" });
  const [runde, setRunde] = useState(0);

  useEffect(() => {
    let aktuell = true;
    // setStand nur im .then(): kein setState direkt im Effekt-Körper (react-hooks/set-state-in-effect).
    void laden().then((neu) => {
      if (aktuell) setStand(neu);
    });
    return () => {
      aktuell = false;
    };
  }, [runde]);

  const neuLaden = useCallback(() => setRunde((alt) => alt + 1), []);
  const wert = useMemo(() => ({ stand, neuLaden }), [stand, neuLaden]);
  return <SitzungsKontext.Provider value={wert}>{children}</SitzungsKontext.Provider>;
}

/** null außerhalb der Startseite, etwa auf /umfragen: dort kennt der Server den Zustand. */
export function useStartSitzung(): Kontext | null {
  return useContext(SitzungsKontext);
}
