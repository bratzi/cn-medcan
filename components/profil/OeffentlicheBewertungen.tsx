import Link from "next/link";

import { eintragHref, sortenEintragHref } from "@/components/review/eintrag";
import { namenLinkKlassen } from "@/components/ui";
import { formatiereDatum, formatiereWert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { OeffentlicheBewertung } from "@/lib/profil-oeffentlich";
import { wareZeile } from "@/lib/ware-zeile";

type Props = {
  bewertungen: OeffentlicheBewertung[];
  anzahl: number;
  texte: Woerterbuch["profilOeffentlich"];
  w: Woerterbuch;
  sprache: Sprache;
};

/**
 * Freigegebene Bewertungen eines öffentlichen Profils (Spec Profil 9), neueste
 * zuerst, je Zeile ein Sprung ins Buch. Handelsnamen ungekürzt, Umbruch statt
 * Ellipse; der Link ist 44 px hoch (Touch-Ziel).
 */
export function OeffentlicheBewertungen({ bewertungen, anzahl, texte, w, sprache }: Props) {
  if (bewertungen.length === 0) return <p className="text-body text-text-muted">{texte.bewertungenLeer}</p>;
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {bewertungen.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-x-4">
            <div className="flex min-w-0 flex-col">
              <Link
                prefetch={false}
                href={b.ware ? sortenEintragHref({ slug: b.slug, vertreiberId: b.ware.vertreiberId }, b.id) : eintragHref(b.slug, b.id)}
                className={namenLinkKlassen("inline-flex min-h-11 min-w-0 items-center text-body wrap-break-word")}
              >
                {b.handelsname}
              </Link>
              {b.ware && wareZeile(b.ware, { ueber: w.buch.ueber }) ? (
                <span className="text-small text-text-muted wrap-break-word">{wareZeile(b.ware, { ueber: w.buch.ueber })}</span>
              ) : null}
            </div>
            <span className="text-small text-text-muted">
              <span className="numeric">
                {b.gesamtnote === null
                  ? texte.ohneNote
                  : t(w.bewerten.blattWert, { wert: formatiereWert(b.gesamtnote, sprache) })}
              </span>
              <span aria-hidden="true"> · </span>
              <time dateTime={b.erstelltAm.toISOString()} className="numeric">
                {formatiereDatum(b.erstelltAm, sprache)}
              </time>
            </span>
          </li>
        ))}
      </ul>
      {anzahl > bewertungen.length ? (
        <p className="text-caption text-text-muted">{t(texte.neueste, { anzahl: bewertungen.length })}</p>
      ) : null}
    </div>
  );
}
