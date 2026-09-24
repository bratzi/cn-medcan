"use client";

import { bewertungFreigeben, bewertungVerwerfen } from "@/app/admin/aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Meldung } from "@/components/ui";

type Props = {
  reviewId: string;
  /** Fuer Screenreader: welche Bewertung der Knopf meint. */
  bezeichnung: string;
};

/**
 * Freigeben oder Verwerfen einer Community-Bewertung. Die Berechtigung prueft
 * die Server Action selbst; hier steht nur die Bedienung.
 */
export function BewertungFreigabe({ reviewId, bezeichnung }: Props) {
  const { bereit, fehler, ausfuehren } = useAktion();

  function daten() {
    const formular = new FormData();
    formular.set("reviewId", reviewId);
    return formular;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variante="primary"
          disabled={!bereit}
          onClick={() => ausfuehren(() => bewertungFreigeben(daten()))}
        >
          Freigeben
          <span className="sr-only"> — {bezeichnung}</span>
        </Button>
        <Button
          variante="secondary"
          disabled={!bereit}
          onClick={() => ausfuehren(() => bewertungVerwerfen(daten()))}
        >
          Verwerfen
          <span className="sr-only"> — {bezeichnung}</span>
        </Button>
      </div>
      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
    </div>
  );
}
