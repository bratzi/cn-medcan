"use client";

import { useState } from "react";

import { kennwerteNeuRechnen } from "@/app/[lang]/admin/aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Meldung } from "@/components/ui";

/** Kennwerte aller bewerteten Blüten neu rechnen, stückweise; sicher wiederholbar. */
export function KennwerteNeuKnopf() {
  const { bereit, laeuft, fehler, ausfuehren } = useAktion();
  const [anzahl, setAnzahl] = useState<number | null>(null);
  const [fertig, setFertig] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variante="secondary"
          disabled={!bereit}
          onClick={() => {
            setAnzahl(0);
            setFertig(false);
            ausfuehren(async () => {
              let summe = 0;
              let nach: string | null = null;
              do {
                const r = await kennwerteNeuRechnen(nach);
                summe += r.anzahl;
                nach = r.weiter;
                setAnzahl(summe);
              } while (nach !== null);
              setFertig(true);
              return { ok: true };
            });
          }}
        >
          {laeuft ? `Wird gerechnet … ${anzahl ?? 0} gerechnet` : "Kennwerte neu rechnen"}
        </Button>
        <p className="max-w-[68ch] text-small text-text-muted">
          Rechnet Sorten-, Kultivar- und Vertreiber-Kennwerte aus den freigegebenen Bewertungen neu.
        </p>
      </div>
      {fertig && !fehler ? <Meldung art="erfolg">{anzahl} Blüten neu gerechnet.</Meldung> : null}
      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
    </div>
  );
}
