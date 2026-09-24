"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { vorschlagEinreichen } from "@/app/umfragen/aktionen";
import { Button, Field, Select } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import type { SelectOption } from "@/components/ui";

type Props = {
  umfrageId: string;
  strains: readonly SelectOption[];
};

/** Grenze aus `lib/umfrage-eingabe.ts` - hier nur als Bedienhilfe gespiegelt. */
const MAX_BEGRUENDUNG = 500;

/**
 * Eine Sorte fuer die laufende Runde vorschlagen.
 *
 * Die Pruefung liegt in `lib/umfrage-eingabe.ts` und laeuft in der Server
 * Action; hier steht nur die Rueckmeldung. `maxLength` ist Bedienkomfort,
 * keine Absicherung.
 */

export function VorschlagFormular({ umfrageId, strains }: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const formular = ereignis.currentTarget;
    const daten = new FormData(formular);
    setLaeuft(true);
    setFehler(null);
    setGespeichert(false);

    const ergebnis = await vorschlagEinreichen(daten);
    setLaeuft(false);

    if (!ergebnis.ok) {
      setFehler(ergebnis.fehler);
      return;
    }

    setGespeichert(true);
    formular.reset();
    router.refresh();
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-6">
      <input type="hidden" name="umfrageId" value={umfrageId} />

      <Select
        id="vorschlag-strain"
        label="Sorte"
        name="strainId"
        required
        optionen={strains}
        platzhalter="Bitte auswählen"
        hinweis="Nur Handelsnamen aus dem Katalog."
      />

      <Field
        id="vorschlag-begruendung"
        label="Begründung"
        hinweis="Freiwillig. Warum lohnt sich diese Sorte für die nächste Bewertung?"
      >
        {(attribute) => (
          <textarea
            {...attribute}
            name="begruendung"
            rows={3}
            maxLength={MAX_BEGRUENDUNG}
            className="w-full rounded-md border border-border-strong bg-surface px-4 py-2 text-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          />
        )}
      </Field>

      {fehler ? (
        <p role="alert" className="text-small text-danger">
          <span className="font-medium">Fehler: </span>
          {fehler}
        </p>
      ) : null}

      {gespeichert && !fehler ? (
        <p role="status" className="text-small text-success">
          <span className="font-medium">Vorschlag eingereicht. </span>
          Ich entscheide, welche Vorschläge auf die Wahlliste kommen.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={laeuft || !hydriert}>
          {laeuft ? "Wird eingereicht …" : "Vorschlag einreichen"}
        </Button>
      </div>
    </form>
  );
}
