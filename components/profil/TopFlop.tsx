import Link from "next/link";

import { namenLinkKlassen } from "@/components/ui";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { BewertungsKurz } from "@/lib/profil-typen";

type Props = { top: BewertungsKurz[]; flop: BewertungsKurz[]; texte: Woerterbuch["profil"]; sprache: Sprache };

/** Deine besten und schwächsten drei (Spec Profil 5.3), je mit Note und Link zur Blüte. */
export function TopFlop({ top, flop, texte, sprache }: Props) {
  const liste = (eintraege: BewertungsKurz[]) => (
    <ol className="flex flex-col gap-2">
      {eintraege.map((e) => (
        <li key={e.slug} className="flex items-baseline justify-between gap-4 border-t border-border pt-2">
          <Link
            prefetch={false}
            href={`/blueten/${e.slug}`}
            className={namenLinkKlassen("inline-flex min-h-11 items-center font-buch text-body wrap-break-word")}
          >
            {e.handelsname}
          </Link>
          <span className="numeric shrink-0 text-small text-text-muted">
            {t(texte.note, { note: formatiereZahl(e.note, 1, sprache) })}
          </span>
        </li>
      ))}
    </ol>
  );
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <section className="flex flex-col gap-2">
        <h3 className="text-small font-medium text-text">{texte.top}</h3>
        {liste(top)}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-small font-medium text-text">{texte.flop}</h3>
        {flop.length > 0 ? liste(flop) : <p className="text-small text-text-muted text-pretty">{texte.flopLeer}</p>}
      </section>
    </div>
  );
}
