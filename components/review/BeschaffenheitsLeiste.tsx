import { QUALITAET_MITTE } from "@/lib/bewertung-v2";
import { cn } from "@/lib/cn";
import { BESCHAFFENHEIT_ACHSEN, type Beschaffenheit } from "@/lib/query/bewertung";
import { formatiereWert } from "@/lib/format";
import type { AromaTexte } from "@/lib/i18n/typen";
import { mehrzahl, t } from "@/lib/i18n/text";
import { rasten, tasteZuWert } from "@/lib/regler-raster";



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
  /** Sweet Spot: die Spur leuchtet zur Mitte hin statt sich von links zu füllen. */
  mitte?: number;
  /** Ist er gesetzt, wird die Spur zum Regler. */
  aendern?: (wert: number) => void;
  /** Ansage des Werts für Screenreader (aria-valuetext), etwa „3 von 5“. */
  wertText?: (wert: number) => string;
};

/**
 * Eine Spur 0 bis max. Als Regler: Wert aus der Zeigerposition (wie die
 * Sweet-Spot-Spur), rastet am Vergleichswert ein; Tastatur über ein
 * unsichtbares Range-Input darüber.
 */
export function Spur({ label, wert, max, schritt, band, ring, mitte, aendern, wertText }: SpurProps) {
  const anteil = (w: number) => (Math.min(Math.max(w, 0), max) / max) * 100;
  const wertAm = (spur: HTMLElement, clientX: number) => {
    const rect = spur.getBoundingClientRect();
    const roh = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1) * max;
    return rasten(roh, { schritt, max, ziel: ring });
  };
  return (
    <div
      className={cn(
        "relative h-2 rounded-full outline-offset-8 outline-focus-ring has-[input:focus-visible]:outline-2",
        // Als Regler (Nutzer 2026-09-25: leichter zu bedienen): dickere Spur und
        // 44 px Trefferhöhe über ein Pseudo-Element, der Griff größer.
        aendern && "h-3 cursor-pointer touch-none before:absolute before:inset-x-0 before:-inset-y-4 before:content-['']",
        mitte === undefined ? "bg-border" : "sweet-spot-mitte",
      )}
      style={mitte === undefined ? undefined : ({ "--mitte": `${anteil(mitte)}%` } as React.CSSProperties)}
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
      {mitte !== undefined ? null : band ? (
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
          // step="any": der Community-Wert liegt oft neben dem Raster und darf nicht auf die
          // nächste Stufe gezogen werden; die Pfeiltasten rechnet tasteZuWert (T5c).
          step="any"
          value={wert}
          aria-label={label}
          aria-valuetext={wertText?.(wert)}
          onKeyDown={(e) => {
            const neu = tasteZuWert(e.key, wert, { schritt, max, ziel: ring });
            if (neu === null) return;
            e.preventDefault();
            aendern(neu);
          }}
          onChange={(e) => aendern(rasten(Number(e.target.value), { schritt, max, ziel: ring }))}
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
  titel,
  className,
  bedienung,
  ohneTitel = false,
  sweetSpot = false,
  texte,
}: BeschaffenheitsWerte & {
  titel?: string;
  className?: string;
  bedienung?: BeschaffenheitsBedienung;
  /**
   * Bewertung v2 (Masterplan T4): Qualität der Charge mit Sweet Spot in der
   * Mitte der Skala (QUALITAET_MITTE), nicht „mehr ist besser“. Die Spur
   * leuchtet zur Mitte hin, darunter steht die Mittenmarke.
   */
  sweetSpot?: boolean;
  /** In der Erkundung trägt der Schritt die Überschrift; hier dann nur die Anzahl. */
  ohneTitel?: boolean;
  texte: AromaTexte;
}) {
  const aus = mehrzahl(texte.sprache, texte.aroma.ausBewertungen, anzahl ?? 0);
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
            {aus}
          </p>
        ) : null
      ) : (
        <h3 className="font-buch text-h3 font-medium text-text">
          {titel ?? texte.aroma.beschaffenheit.titel}
          {anzahl ? (
            <span className="ml-2 text-caption font-normal text-text-muted">
              {aus}
            </span>
          ) : null}
        </h3>
      )}
      <dl className="flex flex-col gap-4">
        {zeigeFeuchte ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-small font-medium text-text">{texte.aroma.beschaffenheit.restfeuchte}</dt>
              <dd className="numeric text-small text-text-muted">{formatiereWert(feuchteWert, texte.sprache)} %</dd>
            </div>
            <Spur
              label={texte.aroma.beschaffenheit.restfeuchteProzent}
              wert={feuchteWert}
              max={FEUCHTE_MAX}
              schritt={0.1}
              band={FEUCHTE_GUT}
              ring={bedienung && feuchte !== null ? feuchte : undefined}
              aendern={bedienung ? (wert) => bedienung.aendern("feuchte", wert) : undefined}
              wertText={(wert) => `${formatiereWert(wert, texte.sprache)} %`}
            />
            <div aria-hidden="true" className="flex justify-between text-caption text-text-muted">
              <span>{texte.aroma.beschaffenheit.trocken}</span>
              <span>{texte.aroma.beschaffenheit.gut}</span>
              <span>{texte.aroma.beschaffenheit.feucht}</span>
            </div>
          </div>
        ) : null}
        {achsen.map((achse) => {
          const mittel = werte[achse.key];
          const wert = bedienung?.eigen[achse.key] ?? mittel ?? 2.5;
          return (
            <div key={achse.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-small font-medium text-text">{texte.schema.beschaffenheit[achse.key].label}</dt>
                <dd className="numeric text-small text-text-muted">{t(texte.aroma.vonFuenf, { wert: formatiereWert(wert, texte.sprache) })}</dd>
              </div>
              <Spur
                label={t(texte.aroma.skala, { label: texte.schema.beschaffenheit[achse.key].label, von: 0, bis: 5 })}
                wert={wert}
                max={5}
                schritt={0.1}
                ring={bedienung ? mittel : undefined}
                wertText={(wert) => t(texte.aroma.vonFuenf, { wert: formatiereWert(wert, texte.sprache) })}
                mitte={sweetSpot ? QUALITAET_MITTE : undefined}
                aendern={bedienung ? (neu) => bedienung.aendern(achse.key, neu) : undefined}
              />
              {/* Drei gleiche Spalten: die Mittenmarke steht genau unter der Skalenmitte (2,5 von 5). */}
              <div aria-hidden="true" className={cn("text-caption text-text-muted", sweetSpot ? "grid grid-cols-3" : "flex justify-between")}>
                <span>{texte.schema.beschaffenheit[achse.key].links}</span>
                {sweetSpot ? <span className="text-center font-medium text-text">{texte.aroma.sweetSpot.marke}</span> : null}
                <span className="text-right">{texte.schema.beschaffenheit[achse.key].rechts}</span>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
