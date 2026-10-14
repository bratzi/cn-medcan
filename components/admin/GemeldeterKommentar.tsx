"use client";

import { adminEntscheide } from "@/app/[lang]/reaktionen/kommentar-aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Meldung } from "@/components/ui";

/**
 * Entscheidung über einen gemeldeten Kommentar: freigeben (sekundär) oder
 * löschen (primär). `adminEntscheide` prüft die Berechtigung selbst.
 */
export function GemeldeterKommentar({ id }: { id: string }) {
  const aktion = useAktion();

  function los(wahl: "freigeben" | "loeschen") {
    aktion.ausfuehren(async () => {
      const r = await adminEntscheide(id, wahl);
      return r.ok ? { ok: true } : { ok: false, fehler: "Die Entscheidung konnte nicht gespeichert werden." };
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button groesse="sm" variante="secondary" disabled={!aktion.bereit} onClick={() => los("freigeben")}>
          Freigeben
        </Button>
        <Button groesse="sm" disabled={!aktion.bereit} onClick={() => los("loeschen")}>
          Löschen
        </Button>
      </div>
      {aktion.fehler ? <Meldung art="fehler">{aktion.fehler}</Meldung> : null}
    </div>
  );
}
