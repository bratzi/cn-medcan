"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useHydriert } from "@/components/ui/useHydriert";

/** Die gemeinsame Antwortform aller Admin-Aktionen. */
export type AktionsErgebnis = { ok: true } | { ok: false; fehler: string };

export type Aktion = {
  /**
   * Der Knopf darf geklickt werden: React hat hydriert und es laeuft nichts.
   *
   * Die Hydration steht hier mit drin, weil sonst jede Komponente sie
   * einzeln vergisst - genau das ist den vier aelteren Formularen passiert.
   */
  bereit: boolean;
  laeuft: boolean;
  fehler: string | null;
  erfolg: boolean;
  /** Startet die Aktion. Bewusst ohne Promise nach aussen. */
  ausfuehren: (lauf: () => Promise<AktionsErgebnis>, nachErfolg?: () => void) => void;
};

/**
 * Eine Admin-Aktion mit Zustand, Fehlertext und Neuladen.
 *
 * Die Aktionen in `app/admin/*.ts` pruefen ihre Berechtigung selbst und
 * geben Fehler als Text zurueck. Hier steht nur, was die Oberflaeche daraus
 * macht - und der `catch`: `adminErforderlich()` wirft, wenn die Sitzung
 * abgelaufen ist, und ein geworfener Serverfehler kommt im Client als
 * nichtssagende Ablehnung an. Ohne diesen Zweig bliebe der Knopf im Zustand
 * "laeuft" stehen.
 */
export function useAktion(): Aktion {
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState(false);

  function ausfuehren(lauf: () => Promise<AktionsErgebnis>, nachErfolg?: () => void) {
    setLaeuft(true);
    setFehler(null);
    setErfolg(false);

    void (async () => {
      try {
        const ergebnis = await lauf();
        if (!ergebnis.ok) {
          setFehler(ergebnis.fehler);
          return;
        }
        setErfolg(true);
        nachErfolg?.();
        // Die Aktion hat die Pfade schon invalidiert; das hier holt die
        // Serverantwort in diesen Tab zurueck.
        router.refresh();
      } catch {
        setFehler(
          "Die Aktion ist fehlgeschlagen. Möglicherweise ist die Sitzung abgelaufen — neu anmelden und erneut versuchen.",
        );
      } finally {
        setLaeuft(false);
      }
    })();
  }

  return { bereit: hydriert && !laeuft, laeuft, fehler, erfolg, ausfuehren };
}
