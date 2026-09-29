"use client";

import { useId, useRef, useState } from "react";

import type { GeschmacksKategorie } from "@/db/enums";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import type { AromaTexte } from "@/lib/i18n/typen";

export type KatalogEintrag = { name: string; geschmack: GeschmacksKategorie };

/**
 * Ein Terpen ergänzen, das der Hersteller nicht angibt, das man aber zu
 * schmecken meint. Zeigt nur Terpene, die noch nicht in der Liste stehen.
 * Seit T5 (Masterplan Bewertung v2) wieder in der Maske: das Terpen kommt als
 * eigene Sweet-Spot-Spur dazu und steht in der Karte als „von dir ergänzt“.
 */
export function TerpenErgaenzen({
  katalog,
  vorhanden,
  hinzufuegen,
  texte,
}: {
  katalog: readonly KatalogEintrag[];
  vorhanden: readonly string[];
  hinzufuegen: (terpen: KatalogEintrag) => void;
  texte: AromaTexte;
}) {
  const et = texte.aroma.ergaenzen;
  const id = useId();
  const auswahl = useRef<HTMLSelectElement>(null);
  const [wahl, setWahl] = useState("");
  const frei = katalog.filter((terpen) => !vorhanden.includes(terpen.name));
  if (frei.length === 0) return null;
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label htmlFor={id} className="flex flex-col gap-2 text-small font-medium text-text">
        {et.frage}
        <select
          ref={auswahl}
          id={id}
          value={wahl}
          onChange={(e) => setWahl(e.target.value)}
          className="h-11 min-w-48 rounded-md border border-border-strong bg-surface px-4 text-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <option value="">{et.waehlen}</option>
          {frei.map((terpen) => (
            <option key={terpen.name} value={terpen.name}>
              {terpenAnzeige(terpen.name, texte.sprache)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={!wahl}
        onClick={() => {
          const terpen = frei.find((t) => t.name === wahl);
          if (terpen) hinzufuegen(terpen);
          setWahl("");
          // Der Knopf ist danach gesperrt; der Fokus geht zurück an die Auswahl statt verloren.
          auswahl.current?.focus();
        }}
        className="h-11 rounded-full border border-border-strong px-6 text-small font-medium text-text hover:border-accent hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {et.ergaenzen}
      </button>
    </div>
  );
}
