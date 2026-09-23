"use client";

import type { FormEvent } from "react";

import { ergebnisVerknuepfen } from "@/app/admin/umfrage-aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Meldung, Select } from "@/components/ui";
import type { SelectOption } from "@/components/ui";

type Props = {
  optionId: string;
  handelsname: string;
  /** Die eigenen Bewertungen dieser Sorte. Leer heisst: noch keine. */
  reviews: readonly SelectOption[];
  ergebnisReviewId: string | null;
};

/**
 * Die Bewertung hinterlegen, die aus einem gewonnenen Platz geworden ist.
 *
 * Damit schliesst sich die Schleife: Vorschlag, Abstimmung, Test, Bewertung.
 *
 * Gespeichert wird per Knopf und nicht beim Umschalten des Feldes: ein
 * `select` loest bei Tastaturbedienung pro Pfeiltaste ein `change` aus - das
 * waere ein Schreibvorgang je uebersprungener Zeile.
 */
export function ErgebnisFormular({
  optionId,
  handelsname,
  reviews,
  ergebnisReviewId,
}: Props) {
  const { bereit, laeuft, fehler, erfolg, ausfuehren } = useAktion();

  function absenden(ereignis: FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const daten = new FormData(ereignis.currentTarget);
    ausfuehren(() => ergebnisVerknuepfen(daten));
  }

  if (reviews.length === 0 && !ergebnisReviewId) {
    return (
      <p className="text-small text-text-muted">
        Noch keine eigene Bewertung zu dieser Sorte.
      </p>
    );
  }

  // Eine Verknuepfung, die nicht in der Liste steht (etwa eine Bewertung, die
  // nicht als eigene markiert ist), bekommt eine eigene Zeile. Sonst zeigte
  // das Feld die erste Bewertung an und behauptete eine falsche Zuordnung.
  const bekannt = reviews.some((eintrag) => eintrag.wert === ergebnisReviewId);
  const optionen: SelectOption[] = [
    { wert: "", label: "Keine Verknüpfung" },
    ...(ergebnisReviewId && !bekannt
      ? [{ wert: ergebnisReviewId, label: "Verknüpfte Bewertung außerhalb der Liste" }]
      : []),
    ...reviews,
  ];

  return (
    <form onSubmit={absenden} className="flex flex-col gap-2">
      <input type="hidden" name="optionId" value={optionId} />

      <div className="flex flex-wrap items-end gap-2">
        <Select
          id={`ergebnis-${optionId}`}
          label={`Bewertung für ${handelsname}`}
          labelVersteckt
          name="reviewId"
          optionen={optionen}
          defaultValue={ergebnisReviewId ?? ""}
          feldClassName="w-full sm:w-96"
        />
        <Button type="submit" variante="secondary" disabled={!bereit}>
          {laeuft ? "Wird gespeichert …" : "Speichern"}
          <span className="sr-only"> — {handelsname}</span>
        </Button>
      </div>

      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
      {erfolg && !fehler ? <Meldung art="erfolg">Verknüpfung gespeichert.</Meldung> : null}
    </form>
  );
}
