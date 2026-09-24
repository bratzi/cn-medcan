import { alsPolygon, istLeereMatrix, netzPunkte } from "@/lib/netz";
import { GESCHMACKS_ACHSEN, type GeschmacksMatrix } from "@/lib/query/bewertung";

const GROESSE = 320;
const MITTE = GROESSE / 2;
const RADIUS = 110;
const MAX = 5;
const RINGE = [1, 2, 3, 4, 5] as const;
const WERT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

/** Alle Achsen auf demselben Wert: ein Ring oder die Achsenenden. */
function gleichmaessig(wert: number, radius = RADIUS) {
  return netzPunkte(GESCHMACKS_ACHSEN.map(() => wert), MAX, radius, MITTE);
}

/**
 * Geschmacksmatrix als Netzdiagramm (Spec 5.1, Sektion 5). Datengrafik in
 * Tinte, nicht in Blattgrün: Grün ist Bedienung. Die Werte stehen zusätzlich
 * als Liste für Screenreader; das SVG ist aria-hidden. Umschlossen vom
 * einzigen Bogen der Seite (Spec 4.3, Wizard Trees, flach als Linie).
 */
export function Netzdiagramm({ matrix }: { matrix: GeschmacksMatrix }) {
  const werte = GESCHMACKS_ACHSEN.map((achse) => matrix[achse.key]);
  if (istLeereMatrix(werte)) {
    return <p className="text-body text-text-muted">Zu diesem Eintrag gibt es keine Geschmacksangaben.</p>;
  }

  const achsenEnden = gleichmaessig(MAX);
  const beschriftung = gleichmaessig(MAX, RADIUS + 28);

  return (
    <figure className="flex flex-col items-center gap-4 rounded-t-full border border-text px-6 pt-16 pb-6">
      <svg viewBox={`0 0 ${GROESSE} ${GROESSE}`} aria-hidden="true" className="w-full max-w-sm text-text">
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
        {achsenEnden.map((punkt, index) => (
          <line
            key={GESCHMACKS_ACHSEN[index].key}
            x1={MITTE}
            y1={MITTE}
            x2={punkt.x}
            y2={punkt.y}
            stroke="currentColor"
            strokeOpacity={0.15}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <polygon
          points={alsPolygon(netzPunkte(werte, MAX, RADIUS, MITTE))}
          fill="currentColor"
          fillOpacity={0.12}
          stroke="currentColor"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        {beschriftung.map((punkt, index) => (
          <text
            key={GESCHMACKS_ACHSEN[index].key}
            x={punkt.x}
            y={punkt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            className="fill-text-muted font-sans"
          >
            {GESCHMACKS_ACHSEN[index].label}
          </text>
        ))}
      </svg>
      <figcaption className="text-small text-text-muted">Geschmack, Skala 0 bis 5</figcaption>
      <ul className="sr-only">
        {GESCHMACKS_ACHSEN.map((achse) => (
          <li key={achse.key}>{`${achse.label}: ${WERT.format(matrix[achse.key])} von 5`}</li>
        ))}
      </ul>
    </figure>
  );
}
