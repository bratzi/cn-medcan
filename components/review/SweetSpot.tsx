"use client";

import { cn } from "@/lib/cn";
import { INTENSITAETS_STUFEN } from "@/lib/query/bewertung";

export type SweetSpotZeile = {
  terpen: string;
  /** Wert der Bewertung oder Mittel der Community, 1 bis 5. */
  wert: number;
  /** Nur beim Mittel: wie viele Bewertungen dahinterstehen. */
  anzahl?: number;
  /** Vom Hersteller nicht angegeben. */
  ergaenzt?: boolean;
};

const WERT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

function einordnung(wert: number): string {
  if (wert < 0.5) return "nicht geschmeckt";
  const naechste = INTENSITAETS_STUFEN.reduce((a, b) => (Math.abs(b.wert - wert) < Math.abs(a.wert - wert) ? b : a));
  return naechste.label;
}

/** Skala 0 bis 5, wie die Aroma-Karte; 0 heißt nicht geschmeckt. */
const MAX = 5;

function anteil(wert: number): number {
  return (Math.min(Math.max(wert, 0), MAX) / MAX) * 100;
}

/**
 * Wert unter dem Zeiger: genau die Position des sichtbaren Punkts, ohne den
 * Daumen-Einzug des nativen Reglers. Nahe am Vergleichswert rastet er dort
 * ein, damit gleiche Werte auch übereinander stehen.
 */
function wertAmZeiger(spur: HTMLElement, clientX: number, vergleich?: number): number {
  const rect = spur.getBoundingClientRect();
  const roh = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1) * MAX;
  if (vergleich !== undefined && Math.abs(roh - vergleich) <= 0.15) return vergleich;
  return Math.round(roh * 10) / 10;
}

type Bedienung = {
  /** Eigener Wert je Terpen; ist er gesetzt, wird die Spur zum Regler. */
  eigen: Readonly<Record<string, number>>;
  aendern: (terpen: string, wert: number) => void;
  aktivieren?: (terpen: string | null) => void;
};

/**
 * Terpen-Intensität (Spec Redesign 15): je Terpen eine Skala von zu schwach
 * bis zu stark, der Sweet Spot liegt in der Mitte. Zu viel Terpen macht den
 * Geschmack aufdringlich, zu wenig lässt ihn flach wirken; gesucht ist die
 * Stufe 3. Die Markierung sitzt bei wert / 5 der Breite, 0 heißt nicht geschmeckt.
 *
 * Mit `bedienung` wird jede Spur zum Regler: der Punkt zeigt den eigenen
 * Wert, ein blasser Ring den Wert der Bewertung oder Community.
 */
export function SweetSpot({
  zeilen,
  titel,
  bedienung,
  quer = false,
}: {
  zeilen: readonly SweetSpotZeile[];
  titel?: string;
  bedienung?: Bedienung;
  /** Spuren als Karten nebeneinander, horizontal scrollbar (wie der Katalog). */
  quer?: boolean;
}) {
  if (zeilen.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h3 className={cn("font-buch font-medium text-text text-balance", quer ? "text-h3" : "text-h2")}>
        {titel ? `${titel}: ` : null}
        <em className="farbverlauf hand-betont">Sweet Spot</em> gesucht
      </h3>
      <ul
        className={
          quer
            ? "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3"
            : "flex flex-col gap-6"
        }
        onPointerLeave={() => bedienung?.aktivieren?.(null)}>
        {zeilen.map((zeile) => {
          const eigen = bedienung?.eigen[zeile.terpen];
          const gezeigt = eigen ?? zeile.wert;
          return (
            <li
              key={zeile.terpen}
              className={cn(
                "flex flex-col gap-2",
                quer && "w-60 shrink-0 snap-start rounded-lg border border-border bg-surface-raised p-4",
                quer && gezeigt < 0.05 && "opacity-70",
              )}
              onPointerEnter={() => bedienung?.aktivieren?.(zeile.terpen)}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className={cn("font-buch font-medium text-text", quer ? "text-body" : "text-h3")}>
                  {zeile.terpen}
                  {zeile.ergaenzt ? <span className="ml-2 text-caption font-normal text-text-muted">nicht angegeben</span> : null}
                </span>
                <span className="numeric text-small text-text-muted">
                  {`${einordnung(gezeigt)} · ${WERT.format(gezeigt)} von 5`}
                  {bedienung && zeile.anzahl ? ` · Community ${WERT.format(zeile.wert)}` : ""}
                  {!bedienung && zeile.anzahl ? ` · ${zeile.anzahl} Bewertungen` : ""}
                </span>
              </div>
              <div
                className={cn(
                  "sweet-spot-spur relative h-3 rounded-full outline-offset-8 outline-focus-ring has-[input:focus-visible]:outline-2",
                  bedienung && "cursor-pointer touch-none",
                )}
                onPointerDown={
                  bedienung
                    ? (e) => {
                        const spur = e.currentTarget;
                        spur.setPointerCapture(e.pointerId);
                        spur.querySelector("input")?.focus();
                        bedienung.aendern(zeile.terpen, wertAmZeiger(spur, e.clientX, zeile.anzahl ? zeile.wert : undefined));
                      }
                    : undefined
                }
                onPointerMove={
                  bedienung
                    ? (e) => {
                        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                        bedienung.aendern(
                          zeile.terpen,
                          wertAmZeiger(e.currentTarget, e.clientX, zeile.anzahl ? zeile.wert : undefined),
                        );
                      }
                    : undefined
                }
              >
                {bedienung && zeile.anzahl ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-kopierstift/40"
                    style={{ left: `${anteil(zeile.wert)}%` }}
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-kopierstift shadow-sm"
                  style={{ left: `${anteil(gezeigt)}%` }}
                />
                {bedienung ? (
                  <input
                    type="range"
                    min={0}
                    max={MAX}
                    step={0.1}
                    value={gezeigt}
                    aria-label={`${zeile.terpen}: Intensität`}
                    aria-valuetext={`${einordnung(gezeigt)}, ${WERT.format(gezeigt)} von 5`}
                    onFocus={() => bedienung.aktivieren?.(zeile.terpen)}
                    onBlur={() => bedienung.aktivieren?.(null)}
                    onChange={(e) => bedienung.aendern(zeile.terpen, Number(e.target.value))}
                    className="pointer-events-none absolute inset-x-0 top-1/2 h-11 w-full -translate-y-1/2 opacity-0"
                  />
                ) : null}
              </div>
              <div aria-hidden="true" className="relative h-5 text-caption text-text-muted">
                <span className="absolute left-0">zu schwach</span>
                <span className="absolute -translate-x-1/2" style={{ left: `${anteil(3)}%` }}>
                  Sweet Spot
                </span>
                <span className="absolute right-0">zu stark</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
