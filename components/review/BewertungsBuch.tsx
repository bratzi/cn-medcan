import { ABSCHNITT_TITEL } from "@/components/layout/Seitenkopf";
import { Buch } from "@/components/review/Buch";
import { BuchDoppelseite } from "@/components/review/BuchDoppelseite";
import { alsEintrag, eintragAnker } from "@/components/review/eintrag";
import { buttonKlassen } from "@/components/ui";
import type { KartenTerpen } from "@/lib/aromakarte";
import { buchReihenfolge } from "@/lib/buch";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { teileBewertungen } from "@/lib/query/bewertung";
import type { KennwerteZeile, ReviewEintrag } from "@/lib/query/strains";

/**
 * Die Bewertungen einer Sorte als Buch (Masterplan Bewertung v2, T7, Nutzer
 * 2026-09-29): ersetzt auf der Blütenseite die eigenen Doppelseiten
 * untereinander und die Liste der Community. Über dem Buch der Median aller
 * Gesamtnoten aus den gespeicherten Kennwerten (beim Speichern berechnet, wie
 * die Blätter der Seiten); ohne Kennwert kein Wert (nie 0 oder NaN). Ohne
 * Community-Bewertung der Weg zur ersten. Ganz ohne Bewertung kein Buch.
 */
export function BewertungsBuch({
  reviews,
  kennwerte,
  produkt,
  w,
  sprache,
}: {
  reviews: readonly ReviewEintrag[];
  kennwerte: Pick<KennwerteZeile, "gesamtnoteMedian" | "anzahl"> | null;
  produkt: { handelsname: string; slug: string; terpene?: KartenTerpen[]; bildPfad?: string | null };
  w: Woerterbuch;
  sprache: Sprache;
}) {
  const { community } = teileBewertungen(reviews);
  const median = kennwerte?.gesamtnoteMedian ?? null;
  const seiten = buchReihenfolge(reviews);
  return (
    <section aria-labelledby="bewertungen-titel" className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-4">
        <h2 id="bewertungen-titel" className={ABSCHNITT_TITEL}>
          {w.buch.titel}
        </h2>
        {median !== null && kennwerte ? (
          <p className="text-body text-text">
            {mehrzahl(sprache, w.buch.median, kennwerte.anzahl)}{" "}
            <span className="numeric">{formatiereZahl(median, 1, sprache)}</span>
            {` ${w.bluete.vonFuenf}`}
          </p>
        ) : null}
        {community.length > 0 ? null : (
          <>
            <p className="max-w-[60ch] text-body text-text-muted text-pretty">
              {t(w.bluete.communityLeer, { handelsname: produkt.handelsname })}
            </p>
            <a href="#bewerten" className={buttonKlassen("secondary", "md")}>
              {w.bluete.ersteBewertung}
            </a>
          </>
        )}
      </div>
      {seiten.length > 0 ? (
        <Buch
          bezeichnung={t(w.buch.bereich, { handelsname: produkt.handelsname })}
          texte={{
            tastatur: w.buch.tastatur,
            seite: w.buch.seite,
            zurueck: w.buch.zurueck,
            weiter: w.buch.weiter,
            anhalten: w.buch.anhalten,
            abspielen: w.buch.abspielen,
          }}
          seiten={seiten.map((review) => ({
            anker: eintragAnker(review.id),
            inhalt: (
              <BuchDoppelseite eintrag={alsEintrag(review, produkt)} ueberschrift="h3" w={w} sprache={sprache} />
            ),
          }))}
        />
      ) : null}
    </section>
  );
}
