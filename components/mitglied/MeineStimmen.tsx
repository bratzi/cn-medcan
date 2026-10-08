import Link from "next/link";

import { Bild } from "@/components/medien/Bild";
import { eintragHref } from "@/components/review/eintrag";
import { Badge, textLinkKlassen } from "@/components/ui";
import { ersatzBildId } from "@/lib/bewertungsbilder";
import { formatiereDatum } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { stimmAusgang, type Ausgang, type StimmZeile } from "@/lib/konto";

const VARIANTE: Record<Ausgang, "warning" | "success" | "neutral"> = {
  laeuft: "warning",
  gewonnen: "success",
  nichtGewonnen: "neutral",
};

/**
 * Die Schleife (Spec 7): deine Stimme, ihr Ausgang, die Bewertung daraus.
 * Ausgang als Badge mit Klartext und Formmarker, nie nur Farbe.
 */
export function MeineStimmen({ stimmen, texte, sprache }: { stimmen: readonly StimmZeile[]; texte: Woerterbuch["mitglied"]; sprache: Sprache }) {
  if (stimmen.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-body text-text-muted">{texte.stimmenLeer}</p>
        <Link prefetch={false} href="/umfragen" className={textLinkKlassen()}>
          {texte.zuDenUmfragen}
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-8 min-[640px]:grid-cols-3 min-[1080px]:grid-cols-5">
      {stimmen.map((s) => {
        const ausgang = stimmAusgang(s.phase, s.istGewinner);
        return (
          <li key={s.umfrageId} className="flex min-w-0 flex-col gap-4">
            <div className="aspect-4/5 overflow-hidden bg-surface-sunken">
              <Bild id={ersatzBildId(s.bildPfad, s.slug)} sizes="(min-width: 1080px) 20vw, (min-width: 640px) 33vw, 50vw" dekorativ className="size-full object-contain" />
            </div>
            <div className="flex flex-col gap-2">
              <Badge variante={VARIANTE[ausgang]}>{texte.ausgang[ausgang]}</Badge>
              <Link prefetch={false} href={`/blueten/${s.slug}`} className={`${textLinkKlassen()} font-buch text-body wrap-break-word`}>
                {s.handelsname}
              </Link>
              <p className="text-small text-text-muted wrap-break-word">{s.rundentitel}</p>
              <p className="text-caption text-text-muted numeric">{t(texte.gestimmtAm, { datum: formatiereDatum(s.abgegebenAm, sprache) })}</p>
              {ausgang === "gewonnen" && s.ergebnisReviewId ? (
                <Link prefetch={false} href={eintragHref(s.slug, s.ergebnisReviewId)} className={textLinkKlassen()}>
                  {texte.zurBewertung}
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
