import { useEffect, useState } from "react";

import type { IchStrain } from "@/lib/ich-strain";

/** Was die Inseln einer Strain-Seite brauchen, um /api/ich/strain zu fragen. */
export type IchStrainAbfrage = { kultivarId: string; strainId: string; vertreiberId: string | null };

const GAST: IchStrain = { zugang: "gast" };

export function ichStrainAdresse(a: IchStrainAbfrage): string {
  const q = new URLSearchParams({ kultivar: a.kultivarId, strain: a.strainId });
  if (a.vertreiberId) q.set("vertreiber", a.vertreiberId);
  return `/api/ich/strain?${q}`;
}

/**
 * Ein Abruf je Seite (Spec 2026-10-21, Seiten aus Assets, 3.3): Maske und Budpic-Zugang teilen sich die
 * Antwort. Ein Platz genügt, eine Seite fragt nur eine Adresse; ein Seitenwechsel lädt ohnehin neu.
 * Jeder Fehler zählt als Gast: die statische Seite bleibt dann einfach, wie sie ist.
 */
let anfrage: { adresse: string; antwort: Promise<IchStrain> } | null = null;

export function holeIchStrain(adresse: string, holen: typeof fetch = fetch): Promise<IchStrain> {
  if (anfrage?.adresse === adresse) return anfrage.antwort;
  const antwort = holen(adresse, { credentials: "same-origin" })
    .then((r) => (r.ok ? (r.json() as Promise<IchStrain>) : GAST))
    .catch(() => GAST);
  anfrage = { adresse, antwort };
  return antwort;
}

/** Zugang aus der Insel; vor der Antwort und ohne Abfrage (null) Gast, wie die statische Datei. */
export function useIchStrain(abfrage: IchStrainAbfrage | null): IchStrain {
  const [ich, setIch] = useState<IchStrain>(GAST);
  const adresse = abfrage ? ichStrainAdresse(abfrage) : null;
  useEffect(() => {
    if (!adresse) return;
    let aktiv = true;
    holeIchStrain(adresse).then((daten) => {
      if (aktiv) setIch(daten);
    });
    return () => {
      aktiv = false;
    };
  }, [adresse]);
  return ich;
}
