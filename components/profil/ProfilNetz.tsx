import Link from "next/link";

import { NetzGrafik, netzAusGeschmack } from "@/components/profil/NetzGrafik";
import { buttonKlassen } from "@/components/ui";
import { formatiereWert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { PROFIL_AUSSAGEKRAEFTIG_AB } from "@/lib/profil";
import type { Geschmack, ProfilWerte } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";

type Props = {
  werte: ProfilWerte;
  texte: Woerterbuch["profil"];
  achsen: Woerterbuch["label"]["geschmack"];
  sprache: Sprache;
  /** Stand vor der letzten Bewertung; zeichnet die dünne Kontur. Nur im eigenen Profil. */
  vorher?: Geschmack | null;
  /** Fertiger Satz zur Änderung; der Aufrufer baut ihn. */
  aenderung?: string | null;
};

/**
 * Das eigene Aroma-Netz (Spec Profil 5.1): Fläche für „mag ich“, gestrichelt
 * für „mag ich nicht“, Werte relativ zur stärksten Vorliebe auf 0 bis 5.
 * Datengrafik in Tinte; die Werte stehen zusätzlich als Liste für
 * Screenreader, das SVG ist aria-hidden. Nur Aroma, nie Wirkung (HWG).
 */
export function ProfilNetz({ werte, texte, achsen, sprache, vorher = null, aenderung = null }: Props) {
  const { mag, magNicht } = netzAusGeschmack(werte.geschmack);
  const hatMag = mag.some((x) => x > 0);
  const hatMagNicht = magNicht.some((x) => x > 0);
  const kontur = vorher ? netzAusGeschmack(vorher).mag : null;
  const hatKontur = !!kontur && kontur.some((x) => x > 0);

  return (
    <figure className="flex flex-col items-center gap-4">
      <NetzGrafik
        mag={mag}
        magNicht={magNicht}
        kontur={hatKontur ? kontur : null}
        beschriftung={GESCHMACKS_ACHSEN.map((a) => achsen[a.enumWert])}
      />

      {hatMag || hatMagNicht ? (
        <>
          {/* Legende mit Form, nicht nur Farbe. */}
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-small text-text-muted">
            <li className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6 text-text">
                <rect width="24" height="8" fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1.5} />
              </svg>
              {texte.magIch}
            </li>
            {hatMagNicht ? (
              <li className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6 text-text">
                  <line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" strokeWidth={1.5} strokeDasharray="4 4" />
                </svg>
                {texte.magIchNicht}
              </li>
            ) : null}
            {hatKontur ? (
              <li className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6 text-text">
                  <line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1} />
                </svg>
                {texte.vorher}
              </li>
            ) : null}
          </ul>
          <figcaption className="text-small text-text-muted">{texte.netzSkala}</figcaption>
          {aenderung ? <p className="max-w-[48ch] text-center text-small text-text-muted text-pretty">{aenderung}</p> : null}
          <ul className="sr-only">
            {GESCHMACKS_ACHSEN.map((a, i) => {
              const achse = achsen[a.enumWert];
              const text =
                mag[i] > 0
                  ? t(texte.srMag, { achse, wert: formatiereWert(mag[i], sprache) })
                  : magNicht[i] > 0
                    ? t(texte.srMagNicht, { achse, wert: formatiereWert(magNicht[i], sprache) })
                    : t(texte.srNeutral, { achse });
              return <li key={a.key}>{text}</li>;
            })}
          </ul>
        </>
      ) : null}

      {werte.anzahl === 0 ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.leer}</p>
          <Link prefetch={false} href="/blueten" className={buttonKlassen("primary")}>
            {texte.ersteBewertung}
          </Link>
        </div>
      ) : werte.gewichtet === 0 ? (
        <p className="max-w-[48ch] text-center text-body text-text-muted text-pretty">{texte.nurMittelfeld}</p>
      ) : werte.gewichtet < PROFIL_AUSSAGEKRAEFTIG_AB ? (
        <p className="text-center text-small text-text-muted">{t(texte.vorlaeufig, { anzahl: werte.gewichtet })}</p>
      ) : null}
    </figure>
  );
}
