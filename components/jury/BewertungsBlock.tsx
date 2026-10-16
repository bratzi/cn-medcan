import Link from "next/link";

import { AromaKarte } from "@/components/review/AromaKarte";
import { aromaSerien, buchKarte } from "@/components/review/aroma-serien";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import type { EintragDaten } from "@/components/review/eintrag";
import { buttonKlassen } from "@/components/ui";
import { bewertungHref } from "@/lib/alte-adressen";
import { formatiereWert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import { aromaTexte, type Woerterbuch } from "@/lib/i18n/typen";
import type { KatalogTerpen } from "@/lib/query/strains";

/** Gesamteindruck ohne Wirkung: die Jury äußert sich nur zu Aussehen, Geruch, Geschmack, Konsistenz (HWG). */
const EINDRUCK = ["aussehen", "geruch", "geschmack", "konsistenz"] as const;

/**
 * Die verknüpfte Bewertung eines Beitrags: Terpz-Score in Blättern, Gesamteindruck, Aroma-Karte aus
 * der Bewertung, Link „Zur Bewertung“ (bewertungHref). Ohne freigegebene Bewertung gibt es den
 * Block nicht; die Seite lässt ihn dann weg.
 */
export function BewertungsBlock({
  bewertung,
  ziel,
  w,
  sprache,
  katalog,
}: {
  bewertung: EintragDaten;
  ziel: { strainSlug: string; kultivarSlug: string | null; vertreiberId: string | null };
  w: Woerterbuch;
  sprache: Sprache;
  katalog: readonly KatalogTerpen[];
}) {
  const j = w.jury.bewertung;
  const karte = buchKarte(bewertung.terpene, katalog, bewertung.terpenIntensitaet);
  const href = bewertungHref(ziel, bewertung.id);
  return (
    <section aria-labelledby={`jury-bewertung-${bewertung.id}`} className="flex flex-col gap-6 border-y border-border py-8">
      <h2 id={`jury-bewertung-${bewertung.id}`} className="font-buch text-h2 font-medium text-text">
        {j.titel}
      </h2>
      <div className="flex flex-col gap-2">
        <p className="text-small text-text-muted">{j.terpzScore}</p>
        {bewertung.gesamtnote !== null ? (
          <BlattAnzeige note={bewertung.gesamtnote} text={t(j.blaetter, { wert: formatiereWert(bewertung.gesamtnote, sprache) })} />
        ) : null}
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-small text-text-muted">{j.gesamteindruck}</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {EINDRUCK.map((schluessel) => (
            <div key={schluessel} className="flex min-w-0 flex-col gap-1">
              <dt className="text-small text-text-muted">{w.schema.noten[schluessel].label}</dt>
              <dd className="numeric text-h3 text-text">
                {formatiereWert(bewertung[schluessel], sprache)}
                <span className="text-small text-text-muted">{" / 5"}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-small text-text-muted">{j.aroma}</p>
        <AromaKarte
          terpene={karte.terpene}
          serien={aromaSerien(bewertung, w)}
          staerken={karte.staerken}
          ebenen={karte.ebenen}
          texte={aromaTexte(w, sprache)}
          kompakt
          ohneTitel
        />
      </div>
      <p>
        <Link prefetch={false} href={href} className={buttonKlassen("secondary", "md")}>
          {w.jury.zurBewertung}
        </Link>
      </p>
    </section>
  );
}
