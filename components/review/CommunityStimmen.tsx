import { ABSCHNITT_TITEL } from "@/components/layout/Seitenkopf";
import { formatiereDatum } from "@/lib/format";
import { berechneGesamtnote } from "@/lib/query/bewertung";
import type { ReviewEintrag } from "@/lib/query/strains";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Die Zweitstimme (Spec TP2 4.3, Punkt 6): Community-Bewertungen getrennt
 * von den eigenen, mit eigenem Mittel. Die Seite zeigt den Abschnitt nur,
 * wenn es mindestens eine gibt.
 */
export function CommunityStimmen({
  bewertungen,
  mittel,
}: {
  bewertungen: readonly ReviewEintrag[];
  mittel: number;
}) {
  const anzahl = bewertungen.length;
  return (
    <section aria-labelledby="community-titel" className="flex flex-col gap-8">
      <h2 id="community-titel" className={ABSCHNITT_TITEL}>
        Stimmen der Community
      </h2>
      <p className="text-body text-text">
        {anzahl === 1 ? "Aus einer Bewertung: " : `Mittel aus ${anzahl} Bewertungen: `}
        <span className="numeric">{NOTE.format(mittel)}</span>
        {" von 5"}
      </p>
      <ul className="flex flex-col divide-y divide-border">
        {bewertungen.map((bewertung) => (
          <li key={bewertung.id} className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[8rem_1fr] sm:gap-8">
            <p className="numeric text-h2 font-normal text-text">
              {NOTE.format(berechneGesamtnote(bewertung))}
              <span aria-hidden="true" className="text-small text-text-muted">
                {" / 5"}
              </span>
              <span className="sr-only"> von 5</span>
            </p>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-small text-text-muted">
                <time dateTime={bewertung.erstelltAm.toISOString()}>{formatiereDatum(bewertung.erstelltAm)}</time>
                {bewertung.chargenNr ? `, Charge ${bewertung.chargenNr}` : null}
              </p>
              {bewertung.notiz ? <p className="max-w-[68ch] text-body text-text">{bewertung.notiz}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
