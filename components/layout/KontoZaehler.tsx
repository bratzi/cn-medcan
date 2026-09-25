"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { ZAEHLER_NEU, ZAEHLER_SPEICHER } from "@/components/layout/konto-zaehler-speicher";

const GUELTIG_MS = 60_000;

/**
 * Zahl ungelesener Benachrichtigungen an der Konto-Pille. Der Kopf steckt im
 * Root-Layout und bleibt bei Client-Navigation stehen; deshalb fragt der
 * Zaehler bei jedem Seitenwechsel neu, gedeckt von 60 s sessionStorage, damit
 * nicht jede Seite eine Anfrage kostet. An- und Abmelden leeren den Speicher
 * und loesen ZAEHLER_NEU aus; /mitglied loest "benachrichtigungen-gelesen" aus.
 */
export function KontoZaehler() {
  const pfad = usePathname();
  const [anzahl, setAnzahl] = useState(0);
  const [neuLaden, setNeuLaden] = useState(0);
  // Zaehlt jede Zustandsaenderung; eine Antwort, die davor gestartet ist, gilt
  // nicht mehr (sonst holte ein spaeter GET die gerade gelesene Zahl zurueck).
  const stand = useRef(0);

  useEffect(() => {
    const start = stand.current;

    // In einer async Funktion gekapselt, damit setAnzahl in jedem Zweig ueber
    // ein .then() laeuft (kein setState direkt im Effekt-Koerper, sonst meldet
    // react-hooks/set-state-in-effect).
    async function laden(): Promise<number> {
      try {
        const roh = sessionStorage.getItem(ZAEHLER_SPEICHER);
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
      if (stand.current === start) {
        try {
          sessionStorage.setItem(ZAEHLER_SPEICHER, JSON.stringify({ wert: ungelesen.ungelesen, zeit: Date.now() }));
        } catch {
          // Speicher gesperrt: Anzeige bleibt trotzdem richtig, nur ungespeichert.
        }
      }
      return ungelesen.ungelesen;
    }

    void laden().then((wert) => {
      if (stand.current === start) setAnzahl(wert);
    });
    return () => {
      stand.current += 1;
    };
  }, [pfad, neuLaden]);

  useEffect(() => {
    function gelesen() {
      stand.current += 1;
      setAnzahl(0);
      try {
        sessionStorage.setItem(ZAEHLER_SPEICHER, JSON.stringify({ wert: 0, zeit: Date.now() }));
      } catch {
        // Speicher gesperrt: Anzeige bleibt trotzdem richtig, nur ungespeichert.
      }
    }
    function neu() {
      stand.current += 1;
      setAnzahl(0);
      setNeuLaden((n) => n + 1);
    }
    window.addEventListener("benachrichtigungen-gelesen", gelesen);
    window.addEventListener(ZAEHLER_NEU, neu);
    return () => {
      window.removeEventListener("benachrichtigungen-gelesen", gelesen);
      window.removeEventListener(ZAEHLER_NEU, neu);
    };
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
