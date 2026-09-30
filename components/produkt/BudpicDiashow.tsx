"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { BudpicBild } from "@/components/medien/Bild";
import { BUDPIC_WECHSEL_MS } from "@/lib/budpics";
import { cn } from "@/lib/cn";
import { abonniereEinstellungen, istSparmodus } from "@/lib/einstellungen";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { t } from "@/lib/i18n/text";

export type DiashowBild = {
  id: string;
  breite: number;
  hoehe: number;
  /** Fertiger Tooltip und Bildunterschrift: "Von Name, Datum". */
  beschriftung: string;
};

type Props = {
  bilder: readonly DiashowBild[];
  name: string;
  texte: Woerterbuch["budpic"];
  /** Rahmen des Bildes (Seitenverhaeltnis oder Hoehe); Standard quadratisch. */
  rahmen?: string;
};

/** Wert einer Media Query; auf dem Server false. */
function useMedien(abfrage: string): boolean {
  return useSyncExternalStore(
    (rueckruf) => {
      const m = window.matchMedia(abfrage);
      m.addEventListener("change", rueckruf);
      return () => m.removeEventListener("change", rueckruf);
    },
    () => window.matchMedia(abfrage).matches,
    () => false,
  );
}

function useTabVerborgen(): boolean {
  return useSyncExternalStore(
    (rueckruf) => {
      document.addEventListener("visibilitychange", rueckruf);
      return () => document.removeEventListener("visibilitychange", rueckruf);
    },
    () => document.hidden,
    () => false,
  );
}

/**
 * Diashow der freigegebenen Budpics (T9, Nutzer 2026-09-29): alle fuenf
 * Sekunden ein Ueberblenden, nur ueber `opacity`. Sie steht still bei Hover
 * (Maus), Fokus in der Diashow, verborgenem Tab, im Sparmodus und bei
 * `prefers-reduced-motion`; dann bleibt das Blaettern per Knopf, ohne
 * Ueberblenden. Ein eigener Pausenknopf erfuellt WCAG 2.2.2 (selbst
 * laufende Inhalte anhalten koennen). Ohne JavaScript steht das erste Bild.
 *
 * Nur im Browser noetig, weil Zeitgeber und Zustand: das Muster ohne echtes
 * Bild ist dagegen ein statisches Bild (BudpicSchau) und laedt diese Datei nicht.
 */
export function BudpicDiashow({ bilder, name, texte, rahmen = "aspect-square w-full" }: Props) {
  const anzahl = bilder.length;
  const [aktuell, setAktuell] = useState(0);
  const [angehalten, setAngehalten] = useState(false);
  const [ueber, setUeber] = useState(false);
  const [fokus, setFokus] = useState(false);
  const sparen = useSyncExternalStore(abonniereEinstellungen, istSparmodus, () => false);
  const reduziert = useMedien("(prefers-reduced-motion: reduce)");
  const verborgen = useTabVerborgen();

  const ruhig = sparen || reduziert;
  const laeuft = anzahl > 1 && !angehalten && !ueber && !fokus && !ruhig && !verborgen;

  useEffect(() => {
    if (!laeuft) return;
    const zeitgeber = setInterval(() => setAktuell((a) => (a + 1) % anzahl), BUDPIC_WECHSEL_MS);
    return () => clearInterval(zeitgeber);
  }, [laeuft, anzahl]);

  // Wurde die Liste kuerzer (nach router.refresh), nie auf ein fehlendes Bild zeigen.
  const nr = Math.min(aktuell, anzahl - 1);
  const zeigt = bilder[nr];
  if (!zeigt) return null;

  return (
    <figure
      className="flex w-full flex-col gap-2"
      aria-roledescription="carousel"
      aria-label={t(texte.diashow, { name })}
      onPointerEnter={(e) => e.pointerType === "mouse" && setUeber(true)}
      onPointerLeave={() => setUeber(false)}
      onFocus={() => setFokus(true)}
      onBlur={() => setFokus(false)}
    >
      <div className={cn("relative overflow-hidden bg-surface-sunken", rahmen)} title={zeigt.beschriftung}>
        {bilder.map((bild, i) => (
          <div
            key={bild.id}
            aria-hidden={i !== nr}
            className={cn(
              "absolute inset-0",
              // Nur opacity, 350 ms (--duration-slow); ruhig: sofort.
              !ruhig && "transition-opacity duration-slow ease-standard",
              i === nr ? "opacity-100" : "opacity-0",
            )}
          >
            <BudpicBild
              id={bild.id}
              breite={bild.breite}
              hoehe={bild.hoehe}
              alt={t(texte.alt, { name })}
              lazy={i !== 0}
              className="size-full object-cover"
            />
          </div>
        ))}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-caption text-text-muted">
        <span>{zeigt.beschriftung}</span>
        {anzahl > 1 ? (
          <span className="flex items-center gap-2">
            {!ruhig ? (
              <button
                type="button"
                aria-pressed={angehalten}
                onClick={() => setAngehalten((a) => !a)}
                className="min-h-11 min-w-11 px-2 text-small text-text underline underline-offset-4 hover:text-accent"
              >
                {angehalten ? texte.weiter : texte.pause}
              </button>
            ) : null}
            <button
              type="button"
              aria-label={`${texte.naechstes} (${t(texte.stand, { nr: nr + 1, gesamt: anzahl })})`}
              onClick={() => setAktuell((nr + 1) % anzahl)}
              className="numeric min-h-11 min-w-11 px-2 text-small text-text underline underline-offset-4 hover:text-accent"
            >
              {nr + 1} / {anzahl}
            </button>
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
