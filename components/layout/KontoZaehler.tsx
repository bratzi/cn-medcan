"use client";

import { useEffect, useState } from "react";

const SPEICHER = "benachrichtigungen-ungelesen";
const GUELTIG_MS = 60_000;

/**
 * Zahl ungelesener Benachrichtigungen an der Konto-Pille. Holt sie einmal
 * nach dem Laden und merkt sie sich 60 s in sessionStorage, damit nicht jede
 * Seite eine Anfrage kostet. /mitglied loest "benachrichtigungen-gelesen" aus.
 */
export function KontoZaehler() {
  const [anzahl, setAnzahl] = useState(0);

  useEffect(() => {
    let aktiv = true;

    // In einer async Funktion gekapselt, damit setAnzahl in jedem Zweig ueber
    // ein .then() laeuft (kein setState direkt im Effekt-Koerper, sonst meldet
    // react-hooks/set-state-in-effect).
    async function laden(): Promise<number> {
      try {
        const roh = sessionStorage.getItem(SPEICHER);
        if (roh) {
          const { wert, zeit } = JSON.parse(roh) as { wert: number; zeit: number };
          if (Date.now() - zeit < GUELTIG_MS) return wert;
        }
      } catch {
        // Speicher gesperrt (privates Fenster o. Ae.): dann eben fragen.
      }
      const ungelesen = await fetch("/api/benachrichtigungen", { credentials: "same-origin" })
        .then((antwort): Promise<{ ungelesen: number }> =>
          antwort.ok ? antwort.json() : Promise.resolve({ ungelesen: 0 }),
        )
        .catch(() => ({ ungelesen: 0 }));
      try {
        sessionStorage.setItem(SPEICHER, JSON.stringify({ wert: ungelesen.ungelesen, zeit: Date.now() }));
      } catch {
        // Speicher gesperrt: Anzeige bleibt trotzdem richtig, nur ungespeichert.
      }
      return ungelesen.ungelesen;
    }

    void laden().then((wert) => {
      if (aktiv) setAnzahl(wert);
    });
    return () => {
      aktiv = false;
    };
  }, []);

  useEffect(() => {
    function gelesen() {
      setAnzahl(0);
      try {
        sessionStorage.setItem(SPEICHER, JSON.stringify({ wert: 0, zeit: Date.now() }));
      } catch {
        // Speicher gesperrt: Anzeige bleibt trotzdem richtig, nur ungespeichert.
      }
    }
    window.addEventListener("benachrichtigungen-gelesen", gelesen);
    return () => window.removeEventListener("benachrichtigungen-gelesen", gelesen);
  }, []);

  if (anzahl === 0) return null;
  return (
    <span className="numeric ml-2 inline-grid min-w-6 place-items-center rounded-full bg-accent px-2 text-caption text-accent-fg">
      <span aria-hidden="true">{anzahl}</span>
      <span className="sr-only">
        {anzahl === 1 ? "1 ungelesene Benachrichtigung" : `${anzahl} ungelesene Benachrichtigungen`}
      </span>
    </span>
  );
}
