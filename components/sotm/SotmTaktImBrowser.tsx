"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Pro Seitenaufruf im Browser höchstens ein Takt, auch bei erneutem Einhängen der Komponente. */
let gerufen = false;

/**
 * Fallback für den Cron (Spec 2026-10-20, Teil B): liegt das Phasenende der
 * gebauten Seite in der Vergangenheit, stößt der Browser einmal
 * POST /api/sotm/takt an. Hat der Takt etwas getan, lädt router.refresh() neu.
 * Ebenso, wenn der Server meldet, dass die Daten hinter dem Kalender liegen
 * (`faellig`). Unsichtbar; ohne JavaScript greift allein der Cron.
 */
export function SotmTaktImBrowser({ phaseEndet, faellig = false }: { phaseEndet: string; faellig?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (gerufen || (!faellig && Date.parse(phaseEndet) > Date.now())) return;
    gerufen = true;
    void fetch("/api/sotm/takt", { method: "POST" })
      .then((antwort): Promise<{ schritte?: unknown[] } | null> => (antwort.ok ? antwort.json() : Promise.resolve(null)))
      .then((daten) => {
        if (daten?.schritte && daten.schritte.length > 0) router.refresh();
      })
      .catch(() => {
        // Der Cron holt den Takt nach.
      });
  }, [phaseEndet, faellig, router]);
  return null;
}
