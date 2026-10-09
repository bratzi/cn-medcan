import Link from "next/link";

import { NetzGrafik } from "@/components/profil/NetzGrafik";
import { AromaNetz, aromaNetzTexte, type NetzStand } from "@/components/profil/AromaNetz";
import { buttonKlassen } from "@/components/ui";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { PROFIL_AUSSAGEKRAEFTIG_AB } from "@/lib/profil";
import type { ProfilWerte, VerlaufSchritt } from "@/lib/profil-typen";

const LEER = Array.from({ length: 10 }, () => 0);

type Props = {
  werte: ProfilWerte;
  texte: Woerterbuch["profil"];
  achsen: Woerterbuch["label"]["geschmack"];
  sprache: Sprache;
  /** Gespeicherter Verlauf (älteste zuerst); ab zwei Schritten zeigt das Netz die Zeitleiste. Nur im eigenen Profil. */
  verlauf?: readonly VerlaufSchritt[];
  /** Breite des Netzes; die Startseite stellt es schmaler. */
  className?: string;
};

/**
 * Das Aroma-Netz eines Profils (Spec Profil 5.1, seit 2026-10-09 mit Verlauf):
 * Aroma-Blüte für „mag ich“, gestrichelt für „mag ich nicht“, Werte relativ zur
 * stärksten Vorliebe auf 0 bis 5. Den Verlauf zeigt dasselbe Netz (Nutzer
 * 2026-10-09: zwei Netze nebeneinander wirkten doppelt). Darunter die Hinweise
 * zum Stand. Nur Aroma, nie Wirkung (HWG).
 */
export function ProfilNetz({ werte, texte, achsen, sprache, verlauf = [], className }: Props) {
  const staende: NetzStand[] =
    verlauf.length >= 2 ? verlauf.map((s) => ({ geschmack: s.geschmack, datum: s.datum, anzahl: s.anzahl })) : [{ geschmack: werte.geschmack }];

  return (
    <figure className="flex flex-col items-center gap-4">
      {werte.anzahl > 0 ? (
        <AromaNetz staende={staende} texte={aromaNetzTexte(texte)} achsen={achsen} sprache={sprache} className={className} />
      ) : (
        // Leere Skizze: Ringe und Marken ohne Fläche, darunter der Weg zur ersten Bewertung.
        <NetzGrafik mag={LEER} magNicht={LEER} marken className={className ?? "w-full max-w-md"} />
      )}

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
        <figcaption className="text-center text-small text-text-muted">{t(texte.vorlaeufig, { anzahl: werte.gewichtet })}</figcaption>
      ) : null}
    </figure>
  );
}
