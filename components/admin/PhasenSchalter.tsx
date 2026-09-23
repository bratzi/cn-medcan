"use client";

import { useState } from "react";

import { phaseWeiterschalten } from "@/app/admin/umfrage-aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Meldung } from "@/components/ui";
import type { UmfragePhase } from "@/db/enums";

type Schritt = {
  ziel: UmfragePhase;
  knopf: string;
  frage: string;
  bestaetigen: string;
  hinweis: string;
};

/**
 * Was aus der jeweiligen Phase heraus moeglich ist.
 *
 * Nur vorwaerts - dieselbe Reihenfolge wie in `phasenwechselPruefen`, die
 * darueber entscheidet. Aus BEENDET fuehrt kein Schritt heraus, deshalb
 * fehlt der Eintrag.
 */
const SCHRITTE: Partial<Record<UmfragePhase, Schritt>> = {
  VORSCHLAG: {
    ziel: "ABSTIMMUNG",
    knopf: "Abstimmung starten",
    frage: "Abstimmung starten? Danach kann niemand mehr Sorten vorschlagen.",
    bestaetigen: "Ja, Abstimmung starten",
    hinweis: "Vorher alle Vorschläge übernehmen, die auf die Wahlliste sollen.",
  },
  ABSTIMMUNG: {
    ziel: "BEENDET",
    knopf: "Runde beenden",
    frage: "Runde beenden? Die Stimmen werden ausgezählt und die Gewinner markiert.",
    bestaetigen: "Ja, Runde beenden",
    hinweis:
      "Phasen laufen nur vorwärts: eine beendete Runde lässt sich nicht wieder öffnen. Erst danach ist der Platz für die nächste Runde frei.",
  },
};

type Props = {
  umfrageId: string;
  phase: UmfragePhase;
};

/**
 * Die Phase einer Runde weiterschalten.
 *
 * Beide Schritte sind unumkehrbar, deshalb steht eine Rueckfrage davor -
 * kein Dialog, sondern derselbe Knopf in zwei Stufen: er bleibt an seinem
 * Platz, im Tastaturfluss und ohne Fokusfalle.
 */
export function PhasenSchalter({ umfrageId, phase }: Props) {
  const schritt = SCHRITTE[phase];
  const { bereit, laeuft, fehler, ausfuehren } = useAktion();
  const [gefragt, setGefragt] = useState(false);

  if (!schritt) return null;

  // Das Ziel kommt als Argument, nicht aus dem `schritt` von oben: dessen
  // Pruefung auf `null` gilt in dieser Funktion nicht mehr.
  function weiterschalten(ziel: UmfragePhase) {
    const daten = new FormData();
    daten.set("umfrageId", umfrageId);
    daten.set("ziel", ziel);
    setGefragt(false);
    ausfuehren(() => phaseWeiterschalten(daten));
  }

  return (
    <div className="flex flex-col gap-2">
      {gefragt ? (
        <>
          <p className="max-w-[68ch] text-small text-text">{schritt.frage}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={!bereit} onClick={() => weiterschalten(schritt.ziel)}>
              {laeuft ? "Wird geschaltet …" : schritt.bestaetigen}
            </Button>
            <Button variante="ghost" disabled={laeuft} onClick={() => setGefragt(false)}>
              Abbrechen
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variante="secondary"
            disabled={!bereit}
            onClick={() => setGefragt(true)}
          >
            {laeuft ? "Wird geschaltet …" : schritt.knopf}
          </Button>
          <p className="max-w-[68ch] text-small text-text-muted">{schritt.hinweis}</p>
        </div>
      )}

      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
    </div>
  );
}
