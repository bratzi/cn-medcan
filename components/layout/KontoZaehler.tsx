"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { ZAEHLER_NEU, ZAEHLER_SPEICHER } from "@/components/layout/konto-zaehler-speicher";
import { Avatar } from "@/components/ui/Avatar";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl } from "@/lib/i18n/text";
import type { Mehrzahl } from "@/lib/i18n/typen";

const GUELTIG_MS = 60_000;

type Stand = { ungelesen: number; name: string | null; avatarId: string | null };
const LEER: Stand = { ungelesen: 0, name: null, avatarId: null };

/**
 * Zahl ungelesener Benachrichtigungen und (T8) Avatar an der Konto-Pille. Der Kopf steckt im
 * Root-Layout und bleibt bei Client-Navigation stehen; deshalb fragt der
 * Zaehler bei jedem Seitenwechsel neu, gedeckt von 60 s sessionStorage, damit
 * nicht jede Seite eine Anfrage kostet. An- und Abmelden leeren den Speicher
 * und loesen ZAEHLER_NEU aus; /mitglied loest "benachrichtigungen-gelesen" aus.
 */
export function KontoZaehler({ texte, sprache }: { texte: Mehrzahl; sprache: Sprache }) {
  const pfad = usePathname();
  const [konto, setKonto] = useState<Stand>(LEER);
  const anzahl = konto.ungelesen;
  const [neuLaden, setNeuLaden] = useState(0);
  // Zaehlt jede Zustandsaenderung; eine Antwort, die davor gestartet ist, gilt
  // nicht mehr (sonst holte ein spaeter GET die gerade gelesene Zahl zurueck).
  const stand = useRef(0);

  useEffect(() => {
    const start = stand.current;

    // In einer async Funktion gekapselt, damit setAnzahl in jedem Zweig ueber
    // ein .then() laeuft (kein setState direkt im Effekt-Koerper, sonst meldet
    // react-hooks/set-state-in-effect).
    async function laden(): Promise<Stand> {
      try {
        const roh = sessionStorage.getItem(ZAEHLER_SPEICHER);
        if (roh) {
          const { stand: gemerkt, zeit } = JSON.parse(roh) as { stand?: Stand; zeit: number };
          // Alte Eintraege ohne Name (vor T8) fallen durch und werden neu geholt.
          if (gemerkt && Date.now() - zeit < GUELTIG_MS) return gemerkt;
        }
      } catch {
        // Speicher gesperrt (privates Fenster o. Ae.): dann eben fragen.
      }
      const geholt = await fetch("/api/benachrichtigungen", { credentials: "same-origin" })
        .then((antwort): Promise<Stand> => (antwort.ok ? antwort.json() : Promise.resolve(LEER)))
        .catch(() => LEER);
      if (stand.current === start) {
        try {
          sessionStorage.setItem(ZAEHLER_SPEICHER, JSON.stringify({ stand: geholt, zeit: Date.now() }));
        } catch {
          // Speicher gesperrt: Anzeige bleibt trotzdem richtig, nur ungespeichert.
        }
      }
      return geholt;
    }

    void laden().then((geladen) => {
      if (stand.current === start) setKonto(geladen);
    });
    return () => {
      stand.current += 1;
    };
  }, [pfad, neuLaden]);

  useEffect(() => {
    function gelesen() {
      stand.current += 1;
      setKonto((alt) => {
        const neu = { ...alt, ungelesen: 0 };
        try {
          sessionStorage.setItem(ZAEHLER_SPEICHER, JSON.stringify({ stand: neu, zeit: Date.now() }));
        } catch {
          // Speicher gesperrt: Anzeige bleibt trotzdem richtig, nur ungespeichert.
        }
        return neu;
      });
    }
    function neu() {
      stand.current += 1;
      // Nie Name oder Bild des vorigen Kontos stehen lassen (Kontowechsel).
      setKonto(LEER);
      setNeuLaden((n) => n + 1);
    }
    window.addEventListener("benachrichtigungen-gelesen", gelesen);
    window.addEventListener(ZAEHLER_NEU, neu);
    return () => {
      window.removeEventListener("benachrichtigungen-gelesen", gelesen);
      window.removeEventListener(ZAEHLER_NEU, neu);
    };
  }, []);

  return (
    <>
      {konto.name ? (
        // Schmal fuellt der Avatar die Pille (44 px) und ersetzt das Symbol,
        // ab lg steht er hinter dem Wort. Dekoration: das Wort traegt den Namen.
        <Avatar name={konto.name} bildId={konto.avatarId} groesse="sm" className="max-lg:absolute max-lg:inset-1 max-lg:size-auto lg:ml-2" />
      ) : null}
      {anzahl === 0 ? null : (
    <span className="numeric inline-grid max-lg:absolute max-lg:-top-1 max-lg:-right-1 lg:ml-2 min-w-6 place-items-center rounded-full bg-accent px-2 text-caption text-accent-fg">
      <span aria-hidden="true">{anzahl}</span>
      <span className="sr-only">
        {mehrzahl(sprache, texte, anzahl)}
      </span>
    </span>
      )}
    </>
  );
}
