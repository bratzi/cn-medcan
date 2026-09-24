"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { stimmeAbgeben } from "@/app/umfragen/aktionen";
import { Button } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";

export type StimmOption = {
  id: string;
  handelsname: string;
};

type Props = {
  umfrageId: string;
  optionen: readonly StimmOption[];
};

/**
 * Die eine Stimme abgeben.
 *
 * Die Kandidatenliste steht daneben in der Serverkomponente; dieses Formular
 * ist nur die Auswahl. Gepruefft wird ausschliesslich serverseitig - hier
 * steht nur die Rueckmeldung.
 */

export function StimmFormular({ umfrageId, optionen }: Props) {
  const router = useRouter();
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

    router.refresh();
  }

  return (
    <form onSubmit={absenden}>
      <input type="hidden" name="umfrageId" value={umfrageId} />

      <fieldset className="border-0 p-0">
        <legend className="text-small font-medium text-text">
          Wofür soll ich als Nächstes eine Bewertung schreiben?
        </legend>

        <ul className="mt-4 flex flex-col gap-2">
          {optionen.map((option) => (
            <li key={option.id}>
              {/* py-2/px-4 halten das Ziel bei 44px Mindesthoehe. */}
              <label
                htmlFor={`stimme-${option.id}`}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-raised px-4 py-2 text-body text-text transition-opacity duration-150 ease-standard hover:opacity-80 has-[:checked]:border-accent"
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
          <span className="font-medium">Fehler: </span>
          {fehler}
        </p>
      ) : null}

      <div className="mt-6">
        <Button type="submit" disabled={laeuft || !hydriert}>
          {laeuft ? "Stimme wird abgegeben …" : "Stimme abgeben"}
        </Button>
      </div>

      <p className="mt-4 text-caption text-text-muted">
        Eine Stimme je Runde. Sie lässt sich danach nicht ändern.
      </p>
    </form>
  );
}
