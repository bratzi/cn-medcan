import Link from "next/link";

import { namenLinkKlassen } from "@/components/ui";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { CommunityVergleich as Daten } from "@/lib/profil-typen";

type Props = { daten: Daten; texte: Woerterbuch["profil"]; sprache: Sprache };

/** Du gegen die Community (Spec Profil 4.5): ein Satz, dann die größten Abweichungen. */
export function CommunityVergleich({ daten, texte, sprache }: Props) {
  if (daten.differenz === null) {
    return <p className="max-w-[68ch] text-body text-text-muted text-pretty">{texte.communityLeer}</p>;
  }
  const betrag = formatiereZahl(Math.abs(daten.differenz), 1, sprache);
  // Unter 0,1 Abstand gilt als gleich: die Differenz ist auf 0,1 gerundet.
  const satz =
    Math.abs(daten.differenz) < 0.1
      ? texte.gleich
      : t(daten.differenz < 0 ? texte.strenger : texte.milder, { wert: betrag });
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-[68ch] text-body text-text text-pretty">{satz}</p>
      {daten.abweichungen.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-small font-medium text-text">{texte.abweichungen}</h3>
          <ol className="flex flex-col gap-2">
            {daten.abweichungen.map((a) => (
              <li key={a.slug} className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-border pt-2">
                <Link
                  prefetch={false}
                  href={`/blueten/${a.slug}`}
                  className={namenLinkKlassen("inline-flex min-h-11 items-center font-buch text-body wrap-break-word")}
                >
                  {a.handelsname}
                </Link>
                <span className="numeric text-small text-text-muted">
                  {t(texte.duNote, { note: formatiereZahl(a.eigene, 1, sprache) })}
                  <span aria-hidden="true">{" · "}</span>
                  {t(texte.communityNote, { note: formatiereZahl(a.community, 1, sprache) })}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
