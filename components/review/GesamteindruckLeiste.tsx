import { Spur } from "@/components/review/BeschaffenheitsLeiste";
import { cn } from "@/lib/cn";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";
import { formatiereWert } from "@/lib/format";
import type { AromaTexte } from "@/lib/i18n/typen";
import { mehrzahl, t } from "@/lib/i18n/text";



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
  texte,
}: Gesamteindruck & {
  className?: string;
  bedienung?: {
    eigen: Readonly<Partial<Record<NotenKey, number>>>;
    aendern: (key: NotenKey, wert: number) => void;
    /** Bewertungsmaske (T5c): Skala 0 bis 5, Start bei 0 = noch nicht gesetzt. */
    abNull?: boolean;
  };
  /** Bewertungsmaske: Wirkung als zusätzliche Note (Pflicht beim Speichern). */
  mitWirkung?: boolean;
  /** In der Erkundung trägt der Schritt die Überschrift; hier dann nur die Anzahl. */
  ohneTitel?: boolean;
  texte: AromaTexte;
}) {
  const aus = mehrzahl(texte.sprache, texte.aroma.ausBewertungen, anzahl);
  const achsen = mitWirkung ? BEWERTUNGS_ACHSEN : EINDRUCK_ACHSEN;
  const mittelWerte: Partial<Record<NotenKey, number>> = werte;
  if (!bedienung && Object.keys(werte).length === 0) return null;
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {ohneTitel ? (
        anzahl > 0 ? (
          <p className="text-caption text-text-muted">
            {aus}
          </p>
        ) : null
      ) : (
        <h3 className="font-buch text-h3 font-medium text-text">
          {texte.aroma.gesamteindruck}
          {anzahl > 0 ? (
            <span className="ml-2 text-caption font-normal text-text-muted">
              {aus}
            </span>
          ) : null}
        </h3>
      )}
      <dl className="flex flex-col gap-4">
        {achsen.map((achse) => {
          const mittel = mittelWerte[achse.key];
          // Als Regler startet die Note bei 0 = noch nicht gesetzt (T5c, Nutzer 2026-09-30, wie die
          // Aromaregler seit T5b); eine gespeicherte eigene Note bleibt Startwert. Sonst (Anzeige,
          // Spielwiese) Start am Community-Mittel auf der Skala 1 bis 5 (Spur 0 bis 4).
          const abNull = bedienung?.abNull === true;
          const wert = bedienung?.eigen[achse.key] ?? (abNull ? 0 : (mittel ?? 3));
          const versatz = abNull ? 0 : 1;
          const wertText = (w: number) => t(texte.aroma.vonFuenf, { wert: formatiereWert(w + versatz, texte.sprache) });
          return (
            <div key={achse.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-small font-medium text-text">{texte.schema.noten[achse.key].label}</dt>
                <dd className="numeric text-small text-text-muted">{wertText(wert - versatz)}</dd>
              </div>
              <Spur
                label={t(texte.aroma.skala, { label: texte.schema.noten[achse.key].label, von: abNull ? 0 : 1, bis: 5 })}
                wert={wert - versatz}
                max={5 - versatz}
                // Zehntelschritte wie "Diese Charge" (Nutzer 2026-10-03: beide Regler sollen sich
                // gleich anfuehlen). Vorher ganze Stufen; die Spalten liegen seit Migration 0015
                // als REAL in der Datenbank, der gezogene Wert wird also genau so gespeichert.
                schritt={0.1}
                ring={bedienung && mittel !== undefined ? mittel - versatz : undefined}
                aendern={bedienung ? (neu) => bedienung.aendern(achse.key, neu + versatz) : undefined}
                wertText={wertText}
              />
              <div aria-hidden="true" className="flex justify-between text-caption text-text-muted">
                <span>{abNull ? 0 : 1}</span>
                <span>5</span>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
