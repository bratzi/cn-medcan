import Link from "next/link";

import { buttonKlassen } from "@/components/ui";
import { formatiereWert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { alsPolygon, netzPunkte } from "@/lib/netz";
import type { ProfilWerte } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";

const GROESSE = 320;
const MITTE = GROESSE / 2;
const RADIUS = 110;
const MAX = 5;
const RINGE = [1, 2, 3, 4, 5] as const;
// Wie PROFIL_AUSSAGEKRAEFTIG_AB in lib/profil.ts (Spec Profil 2.10). Die Datei
// entsteht parallel; beim Zusammenführen ersetzt der Import diese Konstante.
const AUSSAGEKRAEFTIG_AB = 3;

/** Alle Achsen auf demselben Wert: ein Ring oder die Achsenenden. */
function gleichmaessig(wert: number, radius = RADIUS) {
  return netzPunkte(GESCHMACKS_ACHSEN.map(() => wert), MAX, radius, MITTE);
}

type Props = {
  werte: ProfilWerte;
  texte: Woerterbuch["profil"];
  achsen: Woerterbuch["label"]["geschmack"];
  sprache: Sprache;
};

/**
 * Das eigene Aroma-Netz (Spec Profil 5.1): Fläche für „mag ich“, gestrichelt
 * für „mag ich nicht“, Werte relativ zur stärksten Vorliebe auf 0 bis 5.
 * Datengrafik in Tinte; die Werte stehen zusätzlich als Liste für
 * Screenreader, das SVG ist aria-hidden. Nur Aroma, nie Wirkung (HWG).
 */
export function ProfilNetz({ werte, texte, achsen, sprache }: Props) {
  const mag = GESCHMACKS_ACHSEN.map((a) => Math.max(0, werte.geschmack[a.enumWert]) * MAX);
  const magNicht = GESCHMACKS_ACHSEN.map((a) => Math.max(0, -werte.geschmack[a.enumWert]) * MAX);
  const hatMag = mag.some((x) => x > 0);
  const hatMagNicht = magNicht.some((x) => x > 0);
  const beschriftung = gleichmaessig(MAX, RADIUS + 28);

  return (
    <figure className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm">
        <svg viewBox={`0 0 ${GROESSE} ${GROESSE}`} aria-hidden="true" className="block w-full text-text">
          {RINGE.map((ring) => (
            <polygon
              key={ring}
              points={alsPolygon(gleichmaessig(ring))}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.15}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {gleichmaessig(MAX).map((p, i) => (
            <line
              key={GESCHMACKS_ACHSEN[i].key}
              x1={MITTE}
              y1={MITTE}
              x2={p.x}
              y2={p.y}
              stroke="currentColor"
              strokeOpacity={0.15}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {hatMag ? (
            <polygon
              data-netz="mag"
              points={alsPolygon(netzPunkte(mag, MAX, RADIUS, MITTE))}
              fill="currentColor"
              fillOpacity={0.12}
              stroke="currentColor"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {hatMagNicht ? (
            <polygon
              data-netz="mag-nicht"
              points={alsPolygon(netzPunkte(magNicht, MAX, RADIUS, MITTE))}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        {beschriftung.map((p, i) => (
          <span
            key={GESCHMACKS_ACHSEN[i].key}
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 text-caption whitespace-nowrap text-text-muted"
            style={{ left: `${(p.x / GROESSE) * 100}%`, top: `${(p.y / GROESSE) * 100}%` }}
          >
            {achsen[GESCHMACKS_ACHSEN[i].enumWert]}
          </span>
        ))}
      </div>

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
          </ul>
          <figcaption className="text-small text-text-muted">{texte.netzSkala}</figcaption>
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
      ) : werte.gewichtet < AUSSAGEKRAEFTIG_AB ? (
        <p className="text-center text-small text-text-muted">{t(texte.vorlaeufig, { anzahl: werte.gewichtet })}</p>
      ) : null}
    </figure>
  );
}
