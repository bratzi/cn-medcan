"use client";

import { vorschlagUebernehmen } from "@/app/admin/umfrage-aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Meldung } from "@/components/ui";

type Props = {
  vorschlagId: string;
  /** Nur fuer die Vorlesehilfe am Knopf - in einer Liste sind alle gleich. */
  handelsname: string;
};

/**
 * Einen Vorschlag auf die Wahlliste holen.
 *
 * Der Vorschlag selbst bleibt stehen und wird nur markiert, damit
 * nachvollziehbar bleibt, von wem die Sorte kam.
 */
export function VorschlagUebernehmen({ vorschlagId, handelsname }: Props) {
  const { bereit, laeuft, fehler, ausfuehren } = useAktion();

  function uebernehmen() {
    const daten = new FormData();
    daten.set("vorschlagId", vorschlagId);
    ausfuehren(() => vorschlagUebernehmen(daten));
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button disabled={!bereit} onClick={uebernehmen}>
        {laeuft ? "Wird übernommen …" : "Übernehmen"}
        <span className="sr-only"> — {handelsname}</span>
      </Button>

      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
    </div>
  );
}
