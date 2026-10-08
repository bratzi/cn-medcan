import Link from "next/link";

import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { Bild } from "@/components/medien/Bild";
import { namenLinkKlassen } from "@/components/ui";
import { formatiereDatum, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { RanglistenKarte as Karte } from "@/lib/query/rangliste";
import type { Rangliste } from "@/lib/rangliste";

type Props = {
  karte: Karte;
  nach: Rangliste;
  texte: Woerterbuch["rangliste"];
  sprache: Sprache;
};

/**
 * Eine Sorte in der Rangliste (Spec Bewertungsbuch 5): Bild, Rang, Name als
 * der eine Link (die ganze Karte ist Klickfläche), Schnitt mit Blättern,
 * Anzahl, Note des Betreibers, Abstand nur im Reiter „uneins“.
 */
export function RanglistenKarte({ karte, nach, texte, sprache }: Props) {
  const schnitt = formatiereZahl(karte.schnitt, 1, sprache);
  return (
    <article className="relative flex flex-col gap-4 border-t border-border-strong pt-4">
      <div className="flex aspect-square items-center justify-center overflow-hidden bg-surface-sunken">
        <Bild
          id={karte.bildId}
          sizes="(min-width: 1080px) 25vw, 50vw"
          dekorativ
        />
      </div>
      <div className="flex items-baseline gap-4">
        <span aria-label={t(texte.rang, { rang: karte.rang })} className="numeric text-h2">
          {karte.rang}
        </span>
        <h3 className="min-w-0">
          <Link
            prefetch={false}
            href={`/blueten/${karte.slug}`}
            className={namenLinkKlassen("font-buch text-h3 wrap-break-word after:absolute after:inset-0")}
          >
            {karte.handelsname}
          </Link>
        </h3>
      </div>
      {karte.hersteller ? <p className="text-small text-text-muted">{karte.hersteller}</p> : null}
      <BlattAnzeige note={karte.schnitt} text={t(texte.schnitt, { zahl: schnitt })} />
      <p className="numeric text-small text-text-muted">{mehrzahl(sprache, texte.anzahl, karte.anzahl)}</p>
      <ul className="flex flex-col gap-2 text-small text-text-muted">
        {karte.betreiber !== null ? (
          <li className="numeric">{t(texte.betreiber, { zahl: formatiereZahl(karte.betreiber, 1, sprache) })}</li>
        ) : null}
        {nach === "uneins" && karte.abstand !== null ? (
          <li className="numeric">{t(texte.abstand, { zahl: formatiereZahl(karte.abstand, 1, sprache) })}</li>
        ) : null}
        <li className="numeric">{t(texte.zuletzt, { datum: formatiereDatum(new Date(karte.zuletzt), sprache) })}</li>
      </ul>
    </article>
  );
}
