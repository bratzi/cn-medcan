import Link from "next/link";

import { eintragHref } from "@/components/review/eintrag";
import { namenLinkKlassen } from "@/components/ui";
import { formatiereDatum, formatiereWert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { OeffentlicheBewertung } from "@/lib/profil-oeffentlich";

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
            <Link
              prefetch={false}
              href={eintragHref(b.slug, b.id)}
              className={namenLinkKlassen("inline-flex min-h-11 min-w-0 items-center text-body wrap-break-word")}
            >
              {b.handelsname}
            </Link>
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
