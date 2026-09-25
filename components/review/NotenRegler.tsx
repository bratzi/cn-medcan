"use client";

import { useState } from "react";

import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";

/**
 * Die Pflichtnoten im Bewertungsformular als Regler 1 bis 5, ganze Schritte
 * (die Spalten sind Int). Solange ein Regler nicht bewegt ist, fehlt die Note
 * und die Server-Prüfung meldet sie; es gibt keinen stillen Vorgabewert.
 */
export function NotenRegler() {
  const [noten, setNoten] = useState<Record<string, number>>({});
  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
      {BEWERTUNGS_ACHSEN.map((achse) => {
        const wert = noten[achse.key];
        const gesetzt = wert !== undefined;
        const id = `note-regler-${achse.key}`;
        return (
          <div key={achse.key} className="flex flex-col gap-2">
            <label htmlFor={id} className="flex items-baseline justify-between gap-4">
              <span className="text-small font-medium text-text">{achse.label}</span>
              <span className={gesetzt ? "numeric text-h3 font-medium text-kopierstift" : "text-small text-text-muted"}>
                {gesetzt ? `${wert} von 5` : "bitte bewerten"}
              </span>
            </label>
            <input
              id={id}
              type="range"
              min={1}
              max={5}
              step={1}
              value={wert ?? 3}
              onChange={(e) => setNoten((alt) => ({ ...alt, [achse.key]: Number(e.target.value) }))}
              onPointerDown={() => setNoten((alt) => (achse.key in alt ? alt : { ...alt, [achse.key]: 3 }))}
              className={gesetzt ? "w-full accent-accent" : "w-full opacity-50 accent-accent"}
            />
            {gesetzt ? <input type="hidden" name={`note-${achse.key}`} value={wert} /> : null}
            <div aria-hidden="true" className="flex justify-between text-caption text-text-muted">
              {[1, 2, 3, 4, 5].map((stufe) => (
                <span key={stufe} className="numeric w-4 text-center">
                  {stufe}
                </span>
              ))}
            </div>
            <p className="text-caption text-text-muted">{achse.erlaeuterung}</p>
          </div>
        );
      })}
    </div>
  );
}
