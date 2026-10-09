"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { stimmeAbgeben } from "@/app/[lang]/umfragen/aktionen";
import { startSpeicherLeeren } from "@/components/layout/konto-zaehler-speicher";
import { useStartSitzung } from "@/components/story/StartSitzung";
import { Button } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import type { Woerterbuch } from "@/lib/i18n/typen";

export type StimmOption = {
  id: string;
  handelsname: string;
};

type Props = {
  umfrageId: string;
  optionen: readonly StimmOption[];
  texte: Woerterbuch["umfrage"]["stimmFormular"];
};

/**
 * Die eine Stimme abgeben.
 *
 * Die Kandidatenliste steht daneben in der Serverkomponente; dieses Formular
 * ist nur die Auswahl. Gepruefft wird ausschliesslich serverseitig - hier
 * steht nur die Rueckmeldung.
 */

export function StimmFormular({ umfrageId, optionen, texte }: Props) {
  const router = useRouter();
  const sitzung = useStartSitzung();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const daten = new FormData(ereignis.currentTarget);
    setLaeuft(true);
    setFehler(null);

    const ergebnis = await stimmeAbgeben(daten);
    setLaeuft(false);

    if (!ergebnis.ok) {
      setFehler(ergebnis.fehler);
      return;
    }

    // Auch von /umfragen aus: die gemerkte Startseiten-Antwort kennt die Stimme noch nicht.
    startSpeicherLeeren();
    // Auf der statischen Startseite holt die Insel ihren Zustand neu; refresh()
    // brächte dort nur die gecachte Seite (Spec 2026-10-01, statische Seiten, 4.3).
    if (sitzung) sitzung.neuLaden();
    else router.refresh();
  }

  return (
    <form onSubmit={absenden} aria-busy={laeuft}>
      <input type="hidden" name="umfrageId" value={umfrageId} />

      {/* Während die Stimme unterwegs ist, tritt die Auswahl zurück (globals.css, .stimm-auswahl). */}
      <fieldset className="stimm-auswahl border-0 p-0" data-wartet={laeuft ? "" : undefined}>
        <legend className="text-small font-medium text-text">
          {texte.frage}
        </legend>

        <ul className="mt-4 flex flex-col gap-2">
          {optionen.map((option) => (
            <li key={option.id}>
              {/* py-2/px-4 halten das Ziel bei 44px Mindesthoehe. */}
              <label
                htmlFor={`stimme-${option.id}`}
                className="flex min-h-11 cursor-pointer items-center gap-2 max-md:justify-center rounded-md border border-border-strong bg-surface-raised px-4 py-2 text-body text-text transition-colors duration-fast ease-standard hover:bg-surface-sunken has-[:checked]:border-accent"
              >
                <input
                  id={`stimme-${option.id}`}
                  type="radio"
                  name="optionId"
                  value={option.id}
                  required
                  className="size-4 accent-accent"
                />
                <span>{option.handelsname}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {fehler ? (
        <p role="alert" className="mt-4 text-small text-danger">
          <span className="font-medium">{texte.fehler} </span>
          {fehler}
        </p>
      ) : null}

      <div className="mt-6">
        <Button type="submit" disabled={laeuft || !hydriert}>
          {laeuft ? texte.wirdAbgegeben : texte.abgeben}
        </Button>
      </div>

      <p className="mt-4 text-caption text-text-muted">
        {texte.eineStimme}
      </p>
    </form>
  );
}
