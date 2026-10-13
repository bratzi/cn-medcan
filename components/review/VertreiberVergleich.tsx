import Link from "next/link";

import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { VertreiberEintrag } from "@/lib/query/vertreiber";

type Props = { eintraege: readonly VertreiberEintrag[]; kultivarId: string; texte: Woerterbuch["bluete"]["vertreiber"]; sprache: Sprache };

/**
 * „Diese Blüte bei anderen Vertreibern“ (Spec 2026-10-13): neutral, ohne Kauf- oder Apothekenlink (HWG).
 * Seit Spec „Vertreiber sichtbar“ 3 auch mit nur einem Vertreiber, damit fehlende vorgeschlagen werden.
 */
export function VertreiberVergleich({ eintraege, kultivarId, texte, sprache }: Props) {
  if (eintraege.length === 0) return null;
  const einer = eintraege.length === 1 ? eintraege[0] : null;
  return (
    <section aria-labelledby="vertreiber-vergleich-titel" className="flex flex-col gap-6">
      <h3 id="vertreiber-vergleich-titel" className="text-h3 text-text">
        {texte.vergleichTitel}
      </h3>
      <p className="max-w-[68ch] text-small text-text-muted text-pretty">{texte.vergleichSatz}</p>
      {einer ? (
        <p className="text-body text-text wrap-break-word">{einer.vertreiberName ? t(texte.nurEiner, { vertreiber: einer.vertreiberName }) : texte.nurEinerUnbekannt}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
        {eintraege.map((e) => (
          <li key={e.slug} className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-8">
            <span className="min-w-0">
              <span className="block text-body text-text wrap-break-word">{e.vertreiberName ?? texte.unbekannt}</span>
              <span className="block text-caption text-text-muted wrap-break-word">
                {e.handelsname}
                {e.aktuell ? <span className="text-text"> · {texte.dieseWare}</span> : null}
              </span>
            </span>
            {e.qualitaet !== null ? (
              <BlattAnzeige note={e.qualitaet} text={t(texte.qualitaet, { note: formatiereZahl(e.qualitaet, 1, sprache) })} />
            ) : (
              <span className="text-small text-text-muted">{texte.ohneQualitaet}</span>
            )}
            <span className="text-small text-text-muted numeric">
              {e.restfeuchte !== null ? `${t(texte.restfeuchte, { wert: formatiereZahl(e.restfeuchte, 1, sprache) })} · ` : null}
              {mehrzahl(sprache, texte.anzahl, e.anzahl)}
            </span>
          </li>
        ))}
        </ul>
      )}
      <p className="flex flex-wrap gap-x-8 gap-y-2 text-body">
        <Link prefetch={false} href={`/vorschlagen?kultivar=${kultivarId}`} className={einzelLinkKlassen()}>
          {texte.fehlt}
        </Link>
        {einer ? null : (
          <Link prefetch={false} href={`/blueten?kultivar=${kultivarId}`} className={einzelLinkKlassen()}>
            {texte.alleImKatalog}
          </Link>
        )}
      </p>
    </section>
  );
}
