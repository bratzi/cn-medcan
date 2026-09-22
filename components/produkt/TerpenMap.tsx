"use client";

import { useState } from "react";

import { EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  GESCHMACKS_ACHSEN,
  type GeschmacksMatrix,
} from "@/lib/query/bewertung";

/**
 * Terpen-Map als Netzdiagramm in inline SVG - bewusst ohne Chart-Library,
 * damit das Workers-Bundle klein bleibt.
 *
 * Die Geometriewerte unten sind SVG-Nutzerkoordinaten im `viewBox`, kein
 * CSS-Spacing; das 8px-Grid gilt fuer sie nicht.
 */

const MITTE = 140;
const MAX_RADIUS = 96;
const LABEL_RADIUS = 118;
const SKALA_MAX = 5;
/** Treffflaeche je Punkt: bei 320 px Renderbreite sind das rund 45 px. */
const TREFFER_RADIUS = 17;

const NOTE_FORMATTER = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

type Punkt = { x: number; y: number };

function position(index: number, wert: number): Punkt {
  const winkel = (-90 + index * (360 / GESCHMACKS_ACHSEN.length)) * (Math.PI / 180);
  const radius = (Math.min(Math.max(wert, 0), SKALA_MAX) / SKALA_MAX) * MAX_RADIUS;
  return {
    x: MITTE + Math.cos(winkel) * radius,
    y: MITTE + Math.sin(winkel) * radius,
  };
}

function labelPosition(index: number): Punkt & { anchor: "start" | "middle" | "end" } {
  const winkel = (-90 + index * (360 / GESCHMACKS_ACHSEN.length)) * (Math.PI / 180);
  const cos = Math.cos(winkel);
  return {
    x: MITTE + cos * LABEL_RADIUS,
    y: MITTE + Math.sin(winkel) * LABEL_RADIUS,
    anchor: Math.abs(cos) < 0.01 ? "middle" : cos > 0 ? "start" : "end",
  };
}

function ringPfad(stufe: number): string {
  return GESCHMACKS_ACHSEN.map((_, index) => {
    const punkt = position(index, stufe);
    return `${index === 0 ? "M" : "L"}${punkt.x.toFixed(2)} ${punkt.y.toFixed(2)}`;
  }).join(" ") + " Z";
}

export type TerpenMapProps = {
  /** Ergebnis von `verdichteGeschmacksMatrix(...).matrix`. */
  matrix: GeschmacksMatrix;
  /** Ergebnis von `verdichteGeschmacksMatrix(...).anzahlBewertungen`. */
  anzahlBewertungen: number;
  className?: string;
};

export function TerpenMap({ matrix, anzahlBewertungen, className }: TerpenMapProps) {
  const [aktiv, setAktiv] = useState<number | null>(null);

  if (anzahlBewertungen === 0) {
    return (
      <EmptyState
        className={className}
        titel="Noch keine Geschmacksdaten"
        beschreibung="Für dieses Produkt liegen noch keine freigegebenen Bewertungen vor. Die Terpen-Map erscheint, sobald die erste Bewertung freigegeben ist."
      />
    );
  }

  const werteText = GESCHMACKS_ACHSEN.map(
    (achse) => `${achse.label} ${NOTE_FORMATTER.format(matrix[achse.key])} von ${NOTE_FORMATTER.format(SKALA_MAX)}`,
  ).join(", ");

  const flaeche =
    GESCHMACKS_ACHSEN.map((achse, index) => {
      const punkt = position(index, matrix[achse.key]);
      return `${index === 0 ? "M" : "L"}${punkt.x.toFixed(2)} ${punkt.y.toFixed(2)}`;
    }).join(" ") + " Z";

  const aktiveAchse = aktiv === null ? null : GESCHMACKS_ACHSEN[aktiv];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <p className="text-small text-text-muted">
        {`Durchschnitt aus ${anzahlBewertungen} ${anzahlBewertungen === 1 ? "Bewertung" : "Bewertungen"}, Skala 0 bis 5.`}
      </p>

      <svg
        viewBox="0 0 280 280"
        role="img"
        aria-label={`Netzdiagramm der Geschmacksachsen. ${werteText}.`}
        className="h-auto w-full max-w-80 text-text"
      >
        {/* Netzlinien 1 bis 5 */}
        {[1, 2, 3, 4, 5].map((stufe) => (
          <path
            key={stufe}
            d={ringPfad(stufe)}
            fill="none"
            stroke="var(--color-border-strong)"
            strokeWidth={1}
          />
        ))}

        {/* Achsenstrahlen */}
        {GESCHMACKS_ACHSEN.map((achse, index) => {
          const ende = position(index, SKALA_MAX);
          return (
            <line
              key={achse.key}
              x1={MITTE}
              y1={MITTE}
              x2={ende.x}
              y2={ende.y}
              stroke="var(--color-border-strong)"
              strokeWidth={1}
            />
          );
        })}

        {/* Messflaeche: halbtransparenter Akzent, Kontur im Akzent */}
        <path
          d={flaeche}
          fill="var(--color-accent)"
          fillOpacity={0.25}
          stroke="var(--color-accent)"
          strokeWidth={2}
        />

        {/* Achsenbeschriftungen */}
        {GESCHMACKS_ACHSEN.map((achse, index) => {
          const label = labelPosition(index);
          return (
            <text
              key={achse.key}
              x={label.x}
              y={label.y}
              textAnchor={label.anchor}
              dominantBaseline="middle"
              fill="currentColor"
              fontSize={13}
            >
              {achse.label}
            </text>
          );
        })}

        {/* Fokussierbare Messpunkte */}
        {GESCHMACKS_ACHSEN.map((achse, index) => {
          const punkt = position(index, matrix[achse.key]);
          const istAktiv = aktiv === index;
          return (
            <g
              key={achse.key}
              tabIndex={0}
              role="button"
              aria-label={`${achse.label}: ${NOTE_FORMATTER.format(matrix[achse.key])} von ${NOTE_FORMATTER.format(SKALA_MAX)}`}
              onMouseEnter={() => setAktiv(index)}
              onMouseLeave={() => setAktiv(null)}
              onFocus={() => setAktiv(index)}
              onBlur={() => setAktiv(null)}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {/* Unsichtbare, ausreichend grosse Treffflaeche */}
              <circle
                cx={punkt.x}
                cy={punkt.y}
                r={TREFFER_RADIUS}
                fill="transparent"
              />
              <circle
                cx={punkt.x}
                cy={punkt.y}
                r={istAktiv ? 6 : 4}
                fill="var(--color-accent)"
                stroke="var(--color-surface)"
                strokeWidth={2}
              />
            </g>
          );
        })}
      </svg>

      {/* Aktiver Wert als Text - fuer Maus und Tastatur identisch. */}
      <p aria-live="polite" className="min-h-6 text-body text-text">
        {aktiveAchse
          ? `${aktiveAchse.label}: ${NOTE_FORMATTER.format(matrix[aktiveAchse.key])} von ${NOTE_FORMATTER.format(SKALA_MAX)}`
          : "Punkt auswählen oder mit der Tabulatortaste ansteuern, um einen Einzelwert zu lesen."}
      </p>

      {/*
        Pflicht aus dem Design-System: nicht allein visuell kodieren. Die
        Werteliste steht immer da, unabhaengig vom Diagramm.
      */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
        {GESCHMACKS_ACHSEN.map((achse) => (
          <div key={achse.key} className="flex items-baseline justify-between gap-2">
            <dt className="text-small text-text-muted">{achse.label}</dt>
            <dd className="numeric text-small font-medium text-text">
              {NOTE_FORMATTER.format(matrix[achse.key])}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
