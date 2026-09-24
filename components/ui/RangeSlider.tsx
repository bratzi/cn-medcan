"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

export type RangeSliderProps = {
  min: number;
  max: number;
  schritt?: number;
  wert: [number, number];
  onChange: (wert: [number, number]) => void;
  label: string;
  /** Formatiert den Wert fuer Anzeige und `aria-valuetext`. */
  formatiere?: (n: number) => string;
  className?: string;
};

/**
 * Zwei-Griff-Bereichsauswahl aus zwei gestapelten nativen Range-Inputs.
 * Bewusst nativ: Tastaturbedienung, Touch und Screenreader kommen vom Browser,
 * jeder Griff hat sein eigenes Label. Der Balken oben ist nur Redundanz:
 * die Zahlen stehen immer als Text daneben.
 */
export function RangeSlider({
  min,
  max,
  schritt = 1,
  wert,
  onChange,
  label,
  formatiere,
  className,
}: RangeSliderProps) {
  const basisId = useId();
  const minId = `${basisId}-min`;
  const maxId = `${basisId}-max`;

  const [aktuellMin, aktuellMax] = wert;
  const zeige = formatiere ?? ((n: number) => String(n));

  const spanne = max - min || 1;
  const startProzent = ((aktuellMin - min) / spanne) * 100;
  const breiteProzent = ((aktuellMax - aktuellMin) / spanne) * 100;

  const setzeMin = (roh: number) => {
    onChange([Math.min(roh, aktuellMax), aktuellMax]);
  };

  const setzeMax = (roh: number) => {
    onChange([aktuellMin, Math.max(roh, aktuellMin)]);
  };

  const eingabeKlassen =
    "h-11 w-full cursor-pointer bg-transparent " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

  return (
    <fieldset className={cn("flex flex-col gap-2 border-0 p-0", className)}>
      <legend className="text-small font-medium text-text">{label}</legend>

      <p className="text-small text-text-muted">
        <span className="numeric">{zeige(aktuellMin)}</span>
        {" bis "}
        <span className="numeric">{zeige(aktuellMax)}</span>
      </p>

      {/* Redundante Visualisierung des gewaehlten Bereichs. */}
      <div
        aria-hidden="true"
        className="h-2 w-full overflow-hidden rounded-sm bg-surface-sunken"
      >
        <div
          className="h-full rounded-sm bg-accent"
          style={{
            marginInlineStart: `${startProzent}%`,
            width: `${Math.max(breiteProzent, 1)}%`,
          }}
        />
      </div>

      <label htmlFor={minId} className="text-caption text-text-muted">
        Minimum
      </label>
      <input
        id={minId}
        type="range"
        min={min}
        max={max}
        step={schritt}
        value={aktuellMin}
        aria-label={`${label}: Minimum`}
        aria-valuetext={zeige(aktuellMin)}
        onChange={(event) => setzeMin(Number(event.target.value))}
        className={eingabeKlassen}
      />

      <label htmlFor={maxId} className="text-caption text-text-muted">
        Maximum
      </label>
      <input
        id={maxId}
        type="range"
        min={min}
        max={max}
        step={schritt}
        value={aktuellMax}
        aria-label={`${label}: Maximum`}
        aria-valuetext={zeige(aktuellMax)}
        onChange={(event) => setzeMax(Number(event.target.value))}
        className={eingabeKlassen}
      />
    </fieldset>
  );
}
