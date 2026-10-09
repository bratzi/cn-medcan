"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { START_SPEICHER, startSpeicherLeeren } from "@/components/layout/konto-zaehler-speicher";
import type { SitzungsStand, StartseitenSitzung } from "@/lib/startseite-sitzung";

type Kontext = { stand: SitzungsStand; neuLaden: () => void };

const SitzungsKontext = createContext<Kontext | null>(null);

/** Danach zeigen die Inseln ihren Fehlertext, und die StoryBuehne wartet nicht länger. */
const ZEITLIMIT_MS = 8000;

/** So lange gilt eine gemerkte Antwort (START_SPEICHER). */
const GUELTIG_MS = 120_000;

function gemerkt(): StartseitenSitzung | null {
  try {
    const roh = sessionStorage.getItem(START_SPEICHER);
    if (!roh) return null;
    const { daten, zeit } = JSON.parse(roh) as { daten: StartseitenSitzung; zeit: number };
    return Date.now() - zeit < GUELTIG_MS ? daten : null;
  } catch {
    return null;
  }
}

async function laden(): Promise<SitzungsStand> {
  const alt = gemerkt();
  if (alt) return { status: "fertig", daten: alt };
  try {
    const antwort = await fetch("/api/startseite", {
      credentials: "same-origin",
      signal: AbortSignal.timeout(ZEITLIMIT_MS),
    });
    if (!antwort.ok) return { status: "fehler" };
    const daten = (await antwort.json()) as StartseitenSitzung;
    try {
      sessionStorage.setItem(START_SPEICHER, JSON.stringify({ daten, zeit: Date.now() }));
    } catch {
      // Speicher gesperrt: dann fragt die nächste Startseite eben neu.
    }
    return { status: "fertig", daten };
  } catch {
    return { status: "fehler" };
  }
}

/**
 * Die nutzerbezogenen Teile der statischen Startseite (Spec 2026-10-01,
 * statische Seiten, 4.3): ein Abruf von /api/startseite für alle Inseln
 * (Stimmzettel, Empfehlungen, Budpic-Zugang). neuLaden() holt den Stand nach
 * dem Abstimmen erneut; bis dahin bleibt der alte stehen. Die Antwort gilt zwei
 * Minuten aus dem sessionStorage (START_SPEICHER).
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

  const neuLaden = useCallback(() => {
    startSpeicherLeeren();
    setRunde((alt) => alt + 1);
  }, []);
  const wert = useMemo(() => ({ stand, neuLaden }), [stand, neuLaden]);
  return <SitzungsKontext.Provider value={wert}>{children}</SitzungsKontext.Provider>;
}

/** null außerhalb der Startseite, etwa auf /umfragen: dort kennt der Server den Zustand. */
export function useStartSitzung(): Kontext | null {
  return useContext(SitzungsKontext);
}
