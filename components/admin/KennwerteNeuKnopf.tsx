"use client";

import { useState } from "react";

import { kennwerteNeuRechnen } from "@/app/[lang]/admin/aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Meldung } from "@/components/ui";

/** Kennwerte aller bewerteten Blüten neu rechnen; sicher wiederholbar. */
export function KennwerteNeuKnopf() {
  const { bereit, laeuft, fehler, ausfuehren } = useAktion();
  const [anzahl, setAnzahl] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variante="secondary"
          disabled={!bereit}
          onClick={() =>
            ausfuehren(async () => {
              const r = await kennwerteNeuRechnen();
              setAnzahl(r.anzahl);
              return r;
            })
          }
        >
          {laeuft ? "Wird gerechnet …" : "Kennwerte neu rechnen"}
        </Button>
        <p className="max-w-[68ch] text-small text-text-muted">
          Rechnet Sorten-, Kultivar- und Vertreiber-Kennwerte aus den freigegebenen Bewertungen neu.
        </p>
      </div>
      {anzahl !== null && !fehler ? (
        <Meldung art="erfolg">{anzahl} Blüten neu gerechnet.</Meldung>
      ) : null}
      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
    </div>
  );
}
