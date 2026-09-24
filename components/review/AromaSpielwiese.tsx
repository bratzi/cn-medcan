"use client";

import { useState } from "react";

import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
import { herstellerProfil, type KartenTerpen } from "@/lib/aromakarte";
import { GESCHMACKS_ACHSEN, leereGeschmacksMatrix, type GeschmacksMatrix } from "@/lib/query/bewertung";

const WERT = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const REGLER =
  "h-11 w-full cursor-pointer accent-kopierstift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/**
 * Offene Bewertung zum Ausprobieren (Spec Redesign 20): ohne Anmeldung,
 * speichert nichts. Acht Regler, daneben die Aroma-Karte; die gerade
 * bewegte Achse wird hervorgehoben, ihre Bögen treten nach vorn. Startet
 * bei den Herstellerangaben, damit man sofort sieht, was eine Abweichung
 * bewirkt.
 */
export function AromaSpielwiese({
  terpene,
  titel = "Probier es aus",
}: {
  terpene: readonly KartenTerpen[];
  titel?: string;
}) {
  const hersteller = herstellerProfil(terpene);
  const [matrix, setMatrix] = useState<GeschmacksMatrix>(() => ({ ...(hersteller ?? leereGeschmacksMatrix()) }));
  const [aktiv, setAktiv] = useState<number | null>(null);

  const serien: AromaSerie[] = [
    ...(hersteller ? [{ name: "Laut Hersteller", ton: "gruen" as const, matrix: hersteller }] : []),
    { name: "Dein Eindruck", ton: "lila", matrix },
  ];

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
      <div className="flex flex-col gap-4" onPointerLeave={() => setAktiv(null)}>
        {GESCHMACKS_ACHSEN.map((achse, index) => (
          <label key={achse.key} className="flex flex-col gap-1" onPointerEnter={() => setAktiv(index)}>
            <span className="flex justify-between text-small font-medium text-text">
              {achse.label}
              <span className="numeric text-text-muted">{WERT.format(matrix[achse.key])}</span>
            </span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={matrix[achse.key]}
              onFocus={() => setAktiv(index)}
              onBlur={() => setAktiv(null)}
              onChange={(e) => {
                setAktiv(index);
                setMatrix((alt) => ({ ...alt, [achse.key]: Number(e.target.value) }));
              }}
              className={REGLER}
            />
          </label>
        ))}
        <button
          type="button"
          onClick={() => setMatrix({ ...(hersteller ?? leereGeschmacksMatrix()) })}
          className="self-start text-small text-accent underline underline-offset-4 hover:text-accent-hover"
        >
          Zurück auf Herstellerangabe
        </button>
      </div>
      <div className="lg:sticky lg:top-24">
        <AromaKarte titel={titel} terpene={terpene} serien={serien} hervorheben={aktiv} />
      </div>
    </div>
  );
}
