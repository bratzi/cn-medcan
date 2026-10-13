import Link from "next/link";

import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { einzelLinkKlassen, textLinkKlassen } from "@/components/ui/textlink";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { VertreiberBeispiel } from "@/lib/query/vertreiber-beispiel";

const ZEILEN_MAX = 4;

type Props = { beispiel: VertreiberBeispiel; texte: Woerterbuch["start"]["vertreiber"]; sprache: Sprache };

/**
 * Beispielkarte des Vertreiber-Kapitels (Spec 2026-10-13 Vertreiber sichtbar, Abschnitt 1).
 * Reihenfolge kommt aus ladeVertreiberDerBluete (Bewertungen, dann Name), nie nach Qualität (HWG).
 */
export function VertreiberBeispielKarte({ beispiel, texte, sprache }: Props) {
  const { zeilen } = beispiel;
  const sichtbar = zeilen.slice(0, ZEILEN_MAX);
  const rest = zeilen.length - sichtbar.length;
  const bewertet = zeilen.filter((z) => z.anzahl > 0);
  const meistBewertet = bewertet[0] ?? null;
  const einladen = bewertet.length <= 1 ? (zeilen.find((z) => z.anzahl === 0) ?? null) : null;

  return (
    <div className="flex flex-col gap-6 border border-border-strong bg-surface-raised p-8 shadow-md sm:p-12">
      <p className="font-buch text-h2 font-medium text-balance text-text wrap-break-word">{t(texte.beispiel, { name: beispiel.name })}</p>
      <ul aria-label={t(texte.liste, { name: beispiel.name })} className="flex flex-col divide-y divide-border border-y border-border">
        {sichtbar.map((z) => (
          <li key={z.slug} className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
            <span className="min-w-0">
              <span className="block text-body text-text wrap-break-word">{z.vertreiberName ?? texte.unbekannt}</span>
              <span className="block text-caption text-text-muted wrap-break-word">{z.handelsname}</span>
            </span>
            {z.qualitaet !== null && z.anzahl > 0 ? (
              <span className="flex flex-col gap-2">
                <BlattAnzeige note={z.qualitaet} text={t(texte.qualitaet, { note: formatiereZahl(z.qualitaet, 1, sprache) })} />
                <span className="text-small text-text-muted numeric">{mehrzahl(sprache, texte.anzahl, z.anzahl)}</span>
              </span>
            ) : (
              <span className="text-small text-text-muted">{texte.ohneCharge}</span>
            )}
          </li>
        ))}
      </ul>
      {rest > 0 ? <p className="text-small text-text-muted">{mehrzahl(sprache, texte.weitere, rest)}</p> : null}
      {einladen ? (
        <p className="max-w-[60ch] text-body text-pretty text-text">
          {texte.einladung}{" "}
          <Link prefetch={false} href={`/blueten/${einladen.slug}#bewerten`} className={textLinkKlassen()}>
            {t(texte.einladungLink, { vertreiber: einladen.vertreiberName ?? texte.unbekannt })}
          </Link>
        </p>
      ) : null}
      <p className="flex flex-wrap gap-x-8 gap-y-2 text-body">
        {meistBewertet ? (
          <Link prefetch={false} href={`/blueten/${meistBewertet.slug}`} className={einzelLinkKlassen()}>
            {t(texte.zurBluete, { name: beispiel.name })}
          </Link>
        ) : null}
        <Link prefetch={false} href={`/blueten?kultivar=${beispiel.kultivarId}`} className={einzelLinkKlassen()}>
          {mehrzahl(sprache, texte.alleImKatalog, zeilen.length)}
        </Link>
      </p>
      <p className="text-caption text-text-muted">{texte.hinweis}</p>
    </div>
  );
}
