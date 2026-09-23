"use client";

import type { FormEvent } from "react";

import { umfrageAnlegen } from "@/app/admin/umfrage-aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Field, Input, Meldung } from "@/components/ui";
import { BESCHREIBUNG_MAXLAENGE, TITEL_MAXLAENGE } from "@/lib/umfrage-eingabe";

/**
 * Eine neue Runde eroeffnen.
 *
 * Die Laengen kommen aus `lib/umfrage-eingabe.ts`, damit Feld und Pruefung
 * nicht auseinanderlaufen; `maxLength` ist Bedienkomfort, keine Absicherung.
 * Ob wirklich eine Runde frei ist, entscheidet der Unique-Index auf `aktiv` -
 * nicht dieses Formular.
 */
export function RundeAnlegenFormular() {
  const { bereit, laeuft, fehler, ausfuehren } = useAktion();

  function absenden(ereignis: FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    // Vor dem `await` festhalten: `currentTarget` gilt nur im Handler.
    const formular = ereignis.currentTarget;
    const daten = new FormData(formular);
    ausfuehren(
      () => umfrageAnlegen(daten),
      () => formular.reset(),
    );
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-6">
      <Input
        id="umfrage-titel"
        label="Titel"
        name="titel"
        required
        maxLength={TITEL_MAXLAENGE}
        hinweis="Überschrift der Runde, sichtbar auf der Startseite."
      />

      <Field
        id="umfrage-beschreibung"
        label="Beschreibung"
        hinweis="Freiwillig. Worum es in dieser Runde geht."
      >
        {(attribute) => (
          <textarea
            {...attribute}
            name="beschreibung"
            rows={3}
            maxLength={BESCHREIBUNG_MAXLAENGE}
            className="w-full rounded-md border border-border-strong bg-surface px-4 py-2 text-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          />
        )}
      </Field>

      <Input
        id="umfrage-plaetze"
        label="Community-Plätze"
        name="communityPlaetze"
        type="number"
        inputMode="numeric"
        min={1}
        max={10}
        step={1}
        defaultValue={2}
        required
        hinweis="Wie viele Plätze die Abstimmung vergibt. Gesetzte Plätze zählen nicht mit."
        feldClassName="w-64"
      />

      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}

      <div>
        <Button type="submit" disabled={!bereit}>
          {laeuft ? "Wird eröffnet …" : "Runde eröffnen"}
        </Button>
      </div>
    </form>
  );
}
