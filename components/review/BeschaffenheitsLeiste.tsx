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

/** Schlüssel eines Reglers: eine Beschaffenheits-Achse oder die Restfeuchte. */
export type BeschaffenheitsSchluessel = keyof Beschaffenheit | "feuchte";

/**
 * Macht die Spuren zu Reglern (Aroma-Erkundung): `eigen` sind die selbst
 * gezogenen Werte, der Vergleichswert (Mittel) erscheint dann als Ring.
 */
export type BeschaffenheitsBedienung = {
  eigen: Readonly<Partial<Record<BeschaffenheitsSchluessel, number>>>;
  aendern: (schluessel: BeschaffenheitsSchluessel, wert: number) => void;
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

type SpurProps = {
  label: string;
  wert: number;
  max: number;
  schritt: number;
  /** Gutbereich (Restfeuchte) statt Füllbalken. */
  band?: readonly [number, number];
  /** Vergleichswert als Ring, nur wenn der eigene Wert abweicht. */
  ring?: number;
  /** Ist er gesetzt, wird die Spur zum Regler. */
  aendern?: (wert: number) => void;
};

/**
 * Eine Spur 0 bis max. Als Regler: Wert aus der Zeigerposition (wie die
 * Sweet-Spot-Spur), rastet am Vergleichswert ein; Tastatur über ein
 * unsichtbares Range-Input darüber.
 */
export function Spur({ label, wert, max, schritt, band, ring, aendern }: SpurProps) {
  const anteil = (w: number) => (Math.min(Math.max(w, 0), max) / max) * 100;
  const wertAm = (spur: HTMLElement, clientX: number) => {
    const rect = spur.getBoundingClientRect();
    const roh = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1) * max;
    if (ring !== undefined && Math.abs(roh - ring) <= max * 0.03) return ring;
    return Math.round(Math.round(roh / schritt) * schritt * 10) / 10;
  };
  return (
    <div
      className={cn(
        "relative h-2 rounded-full bg-border outline-offset-8 outline-focus-ring has-[input:focus-visible]:outline-2",
        // Als Regler (Nutzer 2026-09-25: leichter zu bedienen): dickere Spur und
        // 44 px Trefferhöhe über ein Pseudo-Element, der Griff größer.
        aendern && "h-3 cursor-pointer touch-none before:absolute before:inset-x-0 before:-inset-y-4 before:content-['']",
      )}
      onPointerDown={
        aendern
          ? (e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              e.currentTarget.querySelector("input")?.focus();
              aendern(wertAm(e.currentTarget, e.clientX));
            }
          : undefined
      }
      onPointerMove={
        aendern
          ? (e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) aendern(wertAm(e.currentTarget, e.clientX));
            }
          : undefined
      }
    >
      {band ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 rounded-full bg-accent-subtle"
          style={{ left: `${anteil(band[0])}%`, width: `${anteil(band[1]) - anteil(band[0])}%` }}
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${anteil(wert)}%` }} />
      )}
      {ring !== undefined && ring !== wert ? (
        <span
          aria-hidden="true"
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-kopierstift/40"
          style={{ left: `${anteil(ring)}%` }}
        />
      ) : null}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-kopierstift shadow-sm",
          aendern ? "size-7" : "size-4",
        )}
        style={{ left: `${anteil(wert)}%` }}
      />
      {aendern ? (
        <input
          type="range"
          min={0}
          max={max}
          step={schritt}
          value={wert}
          aria-label={label}
          onChange={(e) => aendern(Number(e.target.value))}
          className="pointer-events-none absolute inset-x-0 top-1/2 h-8 w-full -translate-y-1/2 opacity-0"
        />
      ) : null}
    </div>
  );
}

/**
 * Beschaffenheit der Blüte neben der Aroma-Karte: Restfeuchte in Prozent mit
 * Gutbereich, dazu Chlorophyll, Bud-Dichte, Terpendichte und Trichomfarbe je
 * 0 bis 5 (mehr ist besser). Achsen ohne Wert entfallen; ohne jeden Wert
 * rendert die Leiste nichts. Mit `bedienung` sind die Spuren Regler.
 */
export function BeschaffenheitsLeiste({
  werte,
  feuchte,
  anzahl,
  titel = "Beschaffenheit",
  className,
  bedienung,
  ohneTitel = false,
}: BeschaffenheitsWerte & {
  titel?: string;
  className?: string;
  bedienung?: BeschaffenheitsBedienung;
  /** In der Erkundung trägt der Schritt die Überschrift; hier dann nur die Anzahl. */
  ohneTitel?: boolean;
}) {
  const achsen = BESCHAFFENHEIT_ACHSEN.filter((achse) => werte[achse.key] !== undefined || bedienung);
  const zeigeFeuchte = feuchte !== null || bedienung;
  if (achsen.length === 0 && !zeigeFeuchte) return null;
  const eigeneFeuchte = bedienung?.eigen.feuchte;
  const feuchteWert = eigeneFeuchte ?? feuchte ?? 10;
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {ohneTitel ? (
        anzahl ? (
          <p className="text-caption text-text-muted">
            aus {anzahl} {anzahl === 1 ? "Bewertung" : "Bewertungen"}
          </p>
        ) : null
      ) : (
        <h3 className="font-buch text-h3 font-medium text-text">
          {titel}
          {anzahl ? (
            <span className="ml-2 text-caption font-normal text-text-muted">
              aus {anzahl} {anzahl === 1 ? "Bewertung" : "Bewertungen"}
            </span>
          ) : null}
        </h3>
      )}
      <dl className="flex flex-col gap-4">
        {zeigeFeuchte ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-small font-medium text-text">Restfeuchte</dt>
              <dd className="numeric text-small text-text-muted">{WERT.format(feuchteWert)} %</dd>
            </div>
            <Spur
              label="Restfeuchte in Prozent"
              wert={feuchteWert}
              max={FEUCHTE_MAX}
              schritt={0.1}
              band={FEUCHTE_GUT}
              ring={bedienung && feuchte !== null ? feuchte : undefined}
              aendern={bedienung ? (wert) => bedienung.aendern("feuchte", wert) : undefined}
            />
            <div aria-hidden="true" className="flex justify-between text-caption text-text-muted">
              <span>trocken</span>
              <span>8 bis 13 % gut</span>
              <span>feucht</span>
            </div>
          </div>
        ) : null}
        {achsen.map((achse) => {
          const mittel = werte[achse.key];
          const wert = bedienung?.eigen[achse.key] ?? mittel ?? 2.5;
          return (
            <div key={achse.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-small font-medium text-text">{achse.label}</dt>
                <dd className="numeric text-small text-text-muted">{WERT.format(wert)} von 5</dd>
              </div>
              <Spur
                label={`${achse.label}, 0 bis 5`}
                wert={wert}
                max={5}
                schritt={0.1}
                ring={bedienung ? mittel : undefined}
                aendern={bedienung ? (neu) => bedienung.aendern(achse.key, neu) : undefined}
              />
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
