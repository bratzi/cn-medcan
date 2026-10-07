import { alsPolygon, netzPunkte } from "@/lib/netz";
import type { Geschmack } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";

const GROESSE = 320;
const MITTE = GROESSE / 2;
const RADIUS = 110;
export const NETZ_MAX = 5;
const RINGE = [1, 2, 3, 4, 5] as const;

/** Alle Achsen auf demselben Wert: ein Ring oder die Achsenenden. */
function gleichmaessig(wert: number, radius = RADIUS) {
  return netzPunkte(GESCHMACKS_ACHSEN.map(() => wert), NETZ_MAX, radius, MITTE);
}

/** Werte 0..5 je Achse in der Reihenfolge von GESCHMACKS_ACHSEN: Fläche „mag ich“, Strichlinie „mag ich nicht“. */
export function netzAusGeschmack(g: Geschmack): { mag: number[]; magNicht: number[] } {
  return {
    mag: GESCHMACKS_ACHSEN.map((a) => Math.max(0, g[a.enumWert] ?? 0) * NETZ_MAX),
    magNicht: GESCHMACKS_ACHSEN.map((a) => Math.max(0, -(g[a.enumWert] ?? 0)) * NETZ_MAX),
  };
}

type Props = {
  mag: readonly number[];
  magNicht: readonly number[];
  /** Dünne Kontur eines früheren Stands („mag ich“-Teil, 0..5); null ohne. */
  kontur?: readonly number[] | null;
  /** Achsennamen in GESCHMACKS_ACHSEN-Reihenfolge; null für das Mini-Netz ohne Beschriftung. */
  beschriftung?: readonly string[] | null;
  className?: string;
};

/**
 * Nur die Grafik des Aroma-Netzes, ohne Texte (Profil, Verlauf, Mini-Netz).
 * Tinte statt Blattgrün; das SVG ist aria-hidden, die Werte nennt der Aufrufer.
 */
export function NetzGrafik({ mag, magNicht, kontur = null, beschriftung = null, className = "w-full max-w-sm" }: Props) {
  const hatMag = mag.some((x) => x > 0);
  const hatMagNicht = magNicht.some((x) => x > 0);
  const hatKontur = !!kontur && kontur.some((x) => x > 0);
  const orte = gleichmaessig(NETZ_MAX, RADIUS + 28);

  return (
    <div className={`relative ${className}`}>
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
        {gleichmaessig(NETZ_MAX).map((p, i) => (
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
        {hatKontur && kontur ? (
          <polygon
            data-netz="vorher"
            points={alsPolygon(netzPunkte(kontur, NETZ_MAX, RADIUS, MITTE))}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.45}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {hatMag ? (
          <polygon
            data-netz="mag"
            points={alsPolygon(netzPunkte(mag, NETZ_MAX, RADIUS, MITTE))}
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
            points={alsPolygon(netzPunkte(magNicht, NETZ_MAX, RADIUS, MITTE))}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>
      {beschriftung
        ? orte.map((p, i) => (
            <span
              key={GESCHMACKS_ACHSEN[i].key}
              aria-hidden="true"
              className="absolute -translate-x-1/2 -translate-y-1/2 text-caption whitespace-nowrap text-text-muted"
              style={{ left: `${(p.x / GROESSE) * 100}%`, top: `${(p.y / GROESSE) * 100}%` }}
            >
              {beschriftung[i]}
            </span>
          ))
        : null}
    </div>
  );
}
