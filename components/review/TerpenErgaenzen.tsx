"use client";

import { useId, useState } from "react";

import type { GeschmacksKategorie } from "@/db/enums";

export type KatalogEintrag = { name: string; geschmack: GeschmacksKategorie };

/**
 * Ein Terpen ergänzen, das der Hersteller nicht angibt, das man aber zu
 * schmecken meint. Zeigt nur Terpene, die noch nicht in der Liste stehen.
 */
export function TerpenErgaenzen({
  katalog,
  vorhanden,
  hinzufuegen,
}: {
  katalog: readonly KatalogEintrag[];
  vorhanden: readonly string[];
  hinzufuegen: (terpen: KatalogEintrag) => void;
}) {
  const id = useId();
  const [wahl, setWahl] = useState("");
  const frei = katalog.filter((terpen) => !vorhanden.includes(terpen.name));
  if (frei.length === 0) return null;
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label htmlFor={id} className="flex flex-col gap-1 text-small font-medium text-text">
        Weiteres Terpen geschmeckt?
        <select
          id={id}
          value={wahl}
          onChange={(e) => setWahl(e.target.value)}
          className="h-11 min-w-48 rounded-md border border-border-strong bg-surface px-3 text-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <option value="">Terpen wählen</option>
          {frei.map((terpen) => (
            <option key={terpen.name} value={terpen.name}>
              {terpen.name}
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
        }}
        className="h-11 rounded-full border border-border-strong px-5 text-small font-medium text-text hover:border-accent hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        Ergänzen
      </button>
    </div>
  );
}
