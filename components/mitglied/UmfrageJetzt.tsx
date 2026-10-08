import Link from "next/link";

import { buttonKlassen, textLinkKlassen } from "@/components/ui";
import { formatiereDatum } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { UmfrageAnsicht } from "@/lib/query/umfragen";

type Props = {
  umfrage: UmfrageAnsicht | null;
  eigeneOptionId: string | null;
  freigegeben: boolean;
  texte: Woerterbuch["mitglied"];
  phasen: Woerterbuch["umfrage"]["phasen"];
  sprache: Sprache;
};

/**
 * Die Runde jetzt, als Stimmzettel (Spec 7): Phase in Klartext, deine Wahl
 * gedruckt mit Vermerk von Hand, sonst die eine Primäraktion der Seite. Ohne
 * Freigabe keine Primäraktion, sondern der Hinweis.
 */
export function UmfrageJetzt({ umfrage, eigeneOptionId, freigegeben, texte, phasen, sprache }: Props) {
  if (!umfrage) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="max-w-[68ch] text-body text-text-muted">{texte.umfrageKeine}</p>
        <Link prefetch={false} href="/umfragen" className={textLinkKlassen()}>
          {texte.zuDenUmfragen}
        </Link>
      </div>
    );
  }
  const wahl = umfrage.optionen.find((o) => o.id === eigeneOptionId) ?? null;
  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-buch text-h2 text-text wrap-break-word">{umfrage.titel}</p>
        <p className="text-small text-text-muted">
          {phasen[umfrage.phase]}
          {umfrage.phase === "VORSCHLAG" && umfrage.vorschlagBisAm ? (
            <>
              <span aria-hidden="true"> · </span>
              {t(texte.vorschlaegeBis, { datum: formatiereDatum(umfrage.vorschlagBisAm, sprache) })}
            </>
          ) : null}
        </p>
      </div>
      {umfrage.phase === "ABSTIMMUNG" && wahl ? (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <Link prefetch={false} href={`/blueten/${wahl.slug}`} className={`${textLinkKlassen()} font-buch text-h3 wrap-break-word`}>
            {wahl.handelsname}
          </Link>
          <span className="font-hand text-vermerk text-logo">{texte.deineWahl}</span>
        </div>
      ) : null}
      {umfrage.phase === "ABSTIMMUNG" && !wahl ? (
        freigegeben ? (
          <>
            <p className="text-body text-text">{texte.nochNichtGestimmt}</p>
            <Link prefetch={false} href="/umfragen" className={buttonKlassen("primary")}>
              {texte.zurAbstimmung}
            </Link>
          </>
        ) : (
          <p className="max-w-[68ch] text-body text-text-muted">{texte.stimmeErstNachFreigabe}</p>
        )
      ) : null}
      {umfrage.phase !== "ABSTIMMUNG" ? (
        <Link prefetch={false} href="/umfragen" className={textLinkKlassen()}>
          {texte.zurRunde}
        </Link>
      ) : null}
    </div>
  );
}
