"use client";

import type { FormEvent } from "react";

import { gesetztenPlatzVergeben } from "@/app/admin/umfrage-aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Meldung, Select } from "@/components/ui";
import type { SelectOption } from "@/components/ui";

type Props = {
  umfrageId: string;
  strains: readonly SelectOption[];
};

/**
 * Einen gesetzten Platz vergeben - die Wahl des Betreibers ohne Abstimmung.
 *
 * Ein gesetzter Platz steht nie zur Wahl und gewinnt beim Beenden der Runde
 * immer; das steht im Hinweis, weil es sich aus dem Knopf nicht ergibt.
 */
export function GesetztenPlatzFormular({ umfrageId, strains }: Props) {
  const { bereit, laeuft, fehler, erfolg, ausfuehren } = useAktion();

  function absenden(ereignis: FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const formular = ereignis.currentTarget;
    const daten = new FormData(formular);
    ausfuehren(
      () => gesetztenPlatzVergeben(daten),
      () => formular.reset(),
    );
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-4">
      <input type="hidden" name="umfrageId" value={umfrageId} />

      <div className="flex flex-wrap items-end gap-4">
        <Select
          id="gesetzter-platz-strain"
          label="Sorte als gesetzten Platz aufnehmen"
          name="strainId"
          required
          optionen={strains}
          platzhalter="Bitte auswählen"
          feldClassName="w-full sm:w-96"
        />
        <Button type="submit" disabled={!bereit}>
          {laeuft ? "Wird vergeben …" : "Platz vergeben"}
        </Button>
      </div>

      <p className="max-w-[68ch] text-small text-text-muted">
        Steht nicht zur Wahl und gewinnt die Runde in jedem Fall.
      </p>

      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
      {erfolg && !fehler ? (
        <Meldung art="erfolg">Der gesetzte Platz steht auf der Liste.</Meldung>
      ) : null}
    </form>
  );
}
