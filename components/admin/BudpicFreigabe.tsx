"use client";

import { budpicAblehnen, budpicFreigeben, budpicLoeschen } from "@/app/[lang]/admin/budpic-aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { BudpicBild } from "@/components/medien/Bild";
import { Button, Meldung } from "@/components/ui";

type Props = {
  id: string;
  breite: number;
  hoehe: number;
  handelsname: string;
  /** Offene Bilder lassen sich freigeben; freigegebene nur ablehnen oder loeschen (Zurueckziehen). */
  freigegeben?: boolean;
};

/**
 * Ein offenes Budpic mit Vorschau (T9): freigeben, ablehnen oder loeschen.
 * Die Vorschau kommt ueber /api/bild/offen/<id>, die nur der Betreiber sieht.
 * Die Aktionen pruefen die Berechtigung selbst (app/admin/budpic-aktionen.ts).
 */
export function BudpicFreigabe({ id, breite, hoehe, handelsname, freigegeben = false }: Props) {
  const aktion = useAktion();

  function los(lauf: (fd: FormData) => Promise<{ ok: true } | { ok: false; fehler: string }>) {
    const daten = new FormData();
    daten.set("id", id);
    aktion.ausfuehren(() => lauf(daten));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-square w-full max-w-64 overflow-hidden bg-surface-sunken">
        <BudpicBild id={id} offen breite={breite} hoehe={hoehe} alt={`Vorschau: ${handelsname}`} className="size-full object-cover" />
      </div>
      <div className="flex flex-wrap gap-2">
        {freigegeben ? null : (
          <Button groesse="sm" disabled={!aktion.bereit} onClick={() => los(budpicFreigeben)}>
            Freigeben
          </Button>
        )}
        <Button groesse="sm" variante="secondary" disabled={!aktion.bereit} onClick={() => los(budpicAblehnen)}>
          {freigegeben ? "Zurückziehen (ablehnen)" : "Ablehnen"}
        </Button>
        <Button groesse="sm" variante="ghost" disabled={!aktion.bereit} onClick={() => los(budpicLoeschen)}>
          Löschen
        </Button>
      </div>
      {aktion.fehler ? <Meldung art="fehler">{aktion.fehler}</Meldung> : null}
    </div>
  );
}
