import { cn } from "@/lib/cn";
import { BESCHAFFENHEIT_ACHSEN, type Beschaffenheit } from "@/lib/query/bewertung";

const WERT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

/** Restfeuchte: Skala 0 bis 20 %, gut ist 8 bis 13 %. */
const FEUCHTE_MAX = 20;
const FEUCHTE_GUT = [8, 13] as const;

export type BeschaffenheitsWerte = {
  /** Wert je Achse, 0 bis 5 (Einzelbewertung oder Mittel). */
  werte: Beschaffenheit;
  /** Restfeuchte in Prozent. */
  feuchte: number | null;
  /** Nur beim Mittel: wie viele Bewertungen dahinterstehen. */
  anzahl?: number;
};

/** Mittel über mehrere Bewertungen, je Achse nur über die, die sie angeben. */
export function mittleBeschaffenheit(
  alle: readonly { beschaffenheit: Beschaffenheit; feuchte: number | null }[],
): BeschaffenheitsWerte {
  const werte: Beschaffenheit = {};
  for (const { key } of BESCHAFFENHEIT_ACHSEN) {
    const zahlen = alle.flatMap((eintrag) => (eintrag.beschaffenheit[key] === undefined ? [] : [eintrag.beschaffenheit[key]!]));
    if (zahlen.length > 0) werte[key] = Math.round((zahlen.reduce((a, b) => a + b, 0) / zahlen.length) * 10) / 10;
  }
  const feuchten = alle.flatMap((eintrag) => (eintrag.feuchte === null ? [] : [eintrag.feuchte]));
  const feuchte = feuchten.length > 0 ? Math.round((feuchten.reduce((a, b) => a + b, 0) / feuchten.length) * 10) / 10 : null;
  return { werte, feuchte, anzahl: alle.length };
}

function Spur({ anteil, band }: { anteil: number; band?: readonly [number, number] }) {
  return (
    <div className="relative h-2 rounded-full bg-border">
      {band ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 rounded-full bg-accent-subtle"
          style={{ left: `${band[0]}%`, width: `${band[1] - band[0]}%` }}
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${anteil}%` }} />
      )}
      <span
        aria-hidden="true"
        className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-kopierstift shadow-sm"
        style={{ left: `${anteil}%` }}
      />
    </div>
  );
}

/**
 * Beschaffenheit der Blüte neben der Aroma-Karte: Restfeuchte in Prozent mit
 * Gutbereich, dazu Chlorophyll, Bud-Dichte, Terpendichte und Trichomfarbe je
 * 0 bis 5 (mehr ist besser). Achsen ohne Wert entfallen; ohne jeden Wert
 * rendert die Leiste nichts.
 */
export function BeschaffenheitsLeiste({
  werte,
  feuchte,
  anzahl,
  titel = "Beschaffenheit",
  className,
}: BeschaffenheitsWerte & { titel?: string; className?: string }) {
  const achsen = BESCHAFFENHEIT_ACHSEN.filter((achse) => werte[achse.key] !== undefined);
  if (achsen.length === 0 && feuchte === null) return null;
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <h3 className="font-buch text-h3 font-medium text-text">
        {titel}
        {anzahl ? <span className="ml-2 text-caption font-normal text-text-muted">aus {anzahl} {anzahl === 1 ? "Bewertung" : "Bewertungen"}</span> : null}
      </h3>
      <dl className="flex flex-col gap-4">
        {feuchte !== null ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-small font-medium text-text">Restfeuchte</dt>
              <dd className="numeric text-small text-text-muted">{WERT.format(feuchte)} %</dd>
            </div>
            <Spur
              anteil={(Math.min(feuchte, FEUCHTE_MAX) / FEUCHTE_MAX) * 100}
              band={[(FEUCHTE_GUT[0] / FEUCHTE_MAX) * 100, (FEUCHTE_GUT[1] / FEUCHTE_MAX) * 100]}
            />
            <div aria-hidden="true" className="flex justify-between text-caption text-text-muted">
              <span>trocken</span>
              <span>8 bis 13 % gut</span>
              <span>feucht</span>
            </div>
          </div>
        ) : null}
        {achsen.map((achse) => {
          const wert = werte[achse.key]!;
          return (
            <div key={achse.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-small font-medium text-text">{achse.label}</dt>
                <dd className="numeric text-small text-text-muted">{WERT.format(wert)} von 5</dd>
              </div>
              <Spur anteil={(wert / 5) * 100} />
              <div aria-hidden="true" className="flex justify-between text-caption text-text-muted">
                <span>{achse.links}</span>
                <span>{achse.rechts}</span>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
