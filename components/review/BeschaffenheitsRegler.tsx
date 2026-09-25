"use client";

import { useState } from "react";

import { BESCHAFFENHEIT_ACHSEN } from "@/lib/query/bewertung";

const WERT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

type Regler = {
  name: string;
  label: string;
  hinweis: string;
  min: number;
  max: number;
  step: number;
  start: number;
  links: string;
  rechts: string;
  einheit: string;
};

const REGLER: readonly Regler[] = [
  {
    name: "feuchtigkeit",
    label: "Restfeuchte",
    hinweis: "Zwischen 8 und 13 % ist gut.",
    min: 0,
    max: 20,
    step: 0.1,
    start: 10,
    links: "trocken",
    rechts: "feucht",
    einheit: " %",
  },
  ...BESCHAFFENHEIT_ACHSEN.map((achse) => ({
    name: `beschaffenheit-${achse.key}`,
    label: achse.label,
    hinweis: achse.hinweis,
    min: 0,
    max: 5,
    step: 0.5,
    start: 2.5,
    links: achse.links,
    rechts: achse.rechts,
    einheit: " von 5",
  })),
];

/**
 * Beschaffenheit im Bewertungsformular: je Wert ein Regler. Solange man ihn
 * nicht bewegt, gilt er als nicht bewertet und wird nicht mitgeschickt.
 */
export function BeschaffenheitsRegler() {
  const [werte, setWerte] = useState<Record<string, number>>({});
  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
      {REGLER.map((regler) => {
        const wert = werte[regler.name];
        const gesetzt = wert !== undefined;
        return (
          <div key={regler.name} className="flex flex-col gap-2">
            <label htmlFor={`regler-${regler.name}`} className="flex items-baseline justify-between gap-4">
              <span className="text-small font-medium text-text">{regler.label}</span>
              <span className="numeric text-small text-text-muted">
                {gesetzt ? `${WERT.format(wert)}${regler.einheit}` : "nicht bewertet"}
              </span>
            </label>
            <input
              id={`regler-${regler.name}`}
              type="range"
              min={regler.min}
              max={regler.max}
              step={regler.step}
              value={wert ?? regler.start}
              onChange={(e) => setWerte((alt) => ({ ...alt, [regler.name]: Number(e.target.value) }))}
              className={gesetzt ? "w-full accent-accent" : "w-full opacity-50 accent-accent"}
            />
            {gesetzt ? <input type="hidden" name={regler.name} value={wert} /> : null}
            <div aria-hidden="true" className="flex justify-between text-caption text-text-muted">
              <span>{regler.links}</span>
              <span>{regler.rechts}</span>
            </div>
            <p className="text-caption text-text-muted">
              {regler.hinweis}
              {gesetzt ? (
                <button
                  type="button"
                  onClick={() =>
                    setWerte((alt) => {
                      const neu = { ...alt };
                      delete neu[regler.name];
                      return neu;
                    })
                  }
                  className="ml-2 text-accent underline underline-offset-4"
                >
                  zurücksetzen
                </button>
              ) : null}
            </p>
          </div>
        );
      })}
    </div>
  );
}
