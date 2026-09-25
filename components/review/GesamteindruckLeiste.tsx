import { Spur } from "@/components/review/BeschaffenheitsLeiste";
import { cn } from "@/lib/cn";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";

const WERT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

/**
 * Die allgemeinen Noten auf der Bewertungskarte, unabhängig von den Terpenen.
 * Wirkung steht bewusst nicht auf der öffentlichen Karte (HWG-Nähe).
 */
export const EINDRUCK_ACHSEN = BEWERTUNGS_ACHSEN.filter((achse) => achse.key !== "wirkung");

export type EindruckKey = (typeof EINDRUCK_ACHSEN)[number]["key"];

/** Alle Noten, mit Wirkung: nur in der Bewertungsmaske (Pflichtfeld), nie öffentlich. */
export type NotenKey = (typeof BEWERTUNGS_ACHSEN)[number]["key"];

export type Gesamteindruck = { werte: Partial<Record<EindruckKey, number>>; anzahl: number };

/** Mittel je Note über alle Bewertungen, eine Nachkommastelle. */
export function mittleNoten(reviews: readonly Partial<Record<EindruckKey, number>>[]): Gesamteindruck {
  const werte: Partial<Record<EindruckKey, number>> = {};
  for (const { key } of EINDRUCK_ACHSEN) {
    const zahlen = reviews.flatMap((review) => (typeof review[key] === "number" ? [review[key]!] : []));
    if (zahlen.length > 0) werte[key] = Math.round((zahlen.reduce((a, b) => a + b, 0) / zahlen.length) * 10) / 10;
  }
  return { werte, anzahl: reviews.length };
}

/**
 * Gesamteindruck 1 bis 5 je Note. Mit `bedienung` verschiebbar (eigener Wert,
 * Ring am Mittel), wie die Beschaffenheit; gespeichert wird hier nichts.
 */
export function GesamteindruckLeiste({
  werte,
  anzahl,
  className,
  bedienung,
  mitWirkung = false,
  ohneTitel = false,
}: Gesamteindruck & {
  className?: string;
  bedienung?: {
    eigen: Readonly<Partial<Record<NotenKey, number>>>;
    aendern: (key: NotenKey, wert: number) => void;
  };
  /** Bewertungsmaske: Wirkung als zusätzliche Note (Pflicht beim Speichern). */
  mitWirkung?: boolean;
  /** In der Erkundung trägt der Schritt die Überschrift; hier dann nur die Anzahl. */
  ohneTitel?: boolean;
}) {
  const achsen = mitWirkung ? BEWERTUNGS_ACHSEN : EINDRUCK_ACHSEN;
  const mittelWerte: Partial<Record<NotenKey, number>> = werte;
  if (!bedienung && Object.keys(werte).length === 0) return null;
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {ohneTitel ? (
        anzahl > 0 ? (
          <p className="text-caption text-text-muted">
            aus {anzahl} {anzahl === 1 ? "Bewertung" : "Bewertungen"}
          </p>
        ) : null
      ) : (
        <h3 className="font-buch text-h3 font-medium text-text">
          Gesamteindruck
          {anzahl > 0 ? (
            <span className="ml-2 text-caption font-normal text-text-muted">
              aus {anzahl} {anzahl === 1 ? "Bewertung" : "Bewertungen"}
            </span>
          ) : null}
        </h3>
      )}
      <dl className="flex flex-col gap-4">
        {achsen.map((achse) => {
          const mittel = mittelWerte[achse.key];
          const wert = bedienung?.eigen[achse.key] ?? mittel ?? 3;
          // Skala 1 bis 5 auf die Spur 0 bis 4 abgebildet.
          return (
            <div key={achse.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-small font-medium text-text">{achse.label}</dt>
                <dd className="numeric text-small text-text-muted">{WERT.format(wert)} von 5</dd>
              </div>
              <Spur
                label={`${achse.label}, 1 bis 5`}
                wert={wert - 1}
                max={4}
                schritt={1}
                ring={bedienung && mittel !== undefined ? mittel - 1 : undefined}
                aendern={bedienung ? (neu) => bedienung.aendern(achse.key, neu + 1) : undefined}
              />
              <div aria-hidden="true" className="flex justify-between text-caption text-text-muted">
                <span>1</span>
                <span>5</span>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
