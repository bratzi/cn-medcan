import { ABSCHNITT_TITEL } from "@/components/layout/Seitenkopf";
import { formatiereDatum, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { mehrzahl, t } from "@/lib/i18n/text";
import { berechneGesamtnote } from "@/lib/query/bewertung";
import type { ReviewEintrag } from "@/lib/query/strains";

/**
 * Die Zweitstimme (Spec TP2 4.3, Punkt 6): Community-Bewertungen getrennt
 * von den eigenen, mit eigenem Mittel. Die Seite zeigt den Abschnitt nur,
 * wenn es mindestens eine gibt.
 */
export function CommunityStimmen({
  bewertungen,
  mittel,
  w,
  sprache,
}: {
  bewertungen: readonly ReviewEintrag[];
  mittel: number;
  w: Woerterbuch;
  sprache: Sprache;
}) {
  const texte = w.bluete;
  const anzahl = bewertungen.length;
  return (
    <section aria-labelledby="community-titel" className="flex flex-col gap-8">
      <h2 id="community-titel" className={ABSCHNITT_TITEL}>
        {texte.communityTitel}
      </h2>
      <p className="text-body text-text">
        {mehrzahl(sprache, texte.communityMittel, anzahl)}{" "}
        <span className="numeric">{formatiereZahl(mittel, 1, sprache)}</span>
        {` ${texte.vonFuenf}`}
      </p>
      <ul className="flex flex-col divide-y divide-border">
        {bewertungen.map((bewertung) => (
          <li key={bewertung.id} className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[8rem_1fr] sm:gap-8">
            <p className="numeric text-h2 font-normal text-text">
              {formatiereZahl(berechneGesamtnote(bewertung), 1, sprache)}
              <span aria-hidden="true" className="text-small text-text-muted">
                {" / 5"}
              </span>
              <span className="sr-only"> {texte.vonFuenf}</span>
            </p>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-small text-text-muted">
                <time dateTime={bewertung.erstelltAm.toISOString()}>{formatiereDatum(bewertung.erstelltAm, sprache)}</time>
                {bewertung.chargenNr ? `, ${t(texte.charge, { charge: bewertung.chargenNr })}` : null}
              </p>
              {bewertung.notiz ? <p className="max-w-[68ch] text-body text-text">{bewertung.notiz}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
