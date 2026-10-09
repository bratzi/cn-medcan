import type { ReactNode } from "react";

import { GeschmackIcon, TerpenIcon } from "@/components/review/AromaIcon";
import { farbKreis, vollFarbe } from "@/lib/aroma-farben";
import { alsPolygon, netzPunkte, type NetzPunkt } from "@/lib/netz";
import { NETZ_MAX } from "@/lib/netz-skala";
import type { Geschmack } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";
import { TERPEN_ACHSEN, hauptAroma } from "@/lib/terpen-achsen";

const GROESSE = 320;
const MITTE = GROESSE / 2;
const RADIUS = 110;
/** Radius der Achsenmarken: außerhalb des äußeren Rings, innerhalb der Grafik. */
const MARKEN_RADIUS = RADIUS + 30;
export { NETZ_MAX };
const RINGE = [1, 2, 3, 4, 5] as const;
/** Eine Achse des Netzes: Schlüssel, Farbe der Marke und des Blütenkeils, Icon (Spec 2026-10-09 A). */
export type NetzAchse = { key: string; farbe: string; icon: ReactNode };

/** Die zehn Geschmacksachsen, wie das Netz sie seit jeher zeigt. */
export function geschmacksAchsen(): NetzAchse[] {
  return GESCHMACKS_ACHSEN.map((a) => ({ key: a.key, farbe: vollFarbe(a.enumWert), icon: <GeschmackIcon geschmack={a.enumWert} className="size-5" /> }));
}

/** Die zehn festen Terpen-Achsen, Farbe aus dem stärksten Aroma des Terpens. */
export function terpenAchsen(): NetzAchse[] {
  return TERPEN_ACHSEN.map((a) => ({
    key: a.schluessel,
    farbe: vollFarbe(hauptAroma(a.schluessel)),
    icon: <TerpenIcon name={a.schluessel} className="size-5" />,
  }));
}

/** Alle Achsen auf demselben Wert: ein Ring oder die Achsenenden. */
function gleichmaessig(wert: number, anzahl: number, radius = RADIUS) {
  return netzPunkte(Array.from({ length: anzahl }, () => wert), NETZ_MAX, radius, MITTE);
}

/** Lage der Marke von Achse `index` in Prozent der Grafik (0..100), für die Lesung außen. */
export function markenLage(index: number, anzahl: number): { x: number; y: number } {
  const p = gleichmaessig(NETZ_MAX, anzahl, MARKEN_RADIUS)[index];
  return { x: (p.x / GROESSE) * 100, y: (p.y / GROESSE) * 100 };
}

/** Lage in Prozent der Grafik, für HTML über dem SVG (Blüte, Marken). */
function prozent(p: NetzPunkt): { x: string; y: string } {
  return { x: `${Math.round((p.x / GROESSE) * 1000) / 10}%`, y: `${Math.round((p.y / GROESSE) * 1000) / 10}%` };
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
  /** Achsenmarken mit Icon in der Farbe des Geschmacks; aus für das Mini-Netz. */
  marken?: boolean;
  /** Achsen in Zeichenreihenfolge; Standard sind die Geschmäcker. `mag`/`magNicht` haben dieselbe Länge. */
  achsen?: readonly NetzAchse[];
  /** Hervorgehobene Achse (Zeiger oder Fokus auf ihrer Marke); null ohne. */
  aktiv?: number | null;
  /**
   * Macht die Marken zu Knöpfen (Aroma-Netz im Browser). `beschreibung` trägt je Achse den
   * Satz für Screenreader, das SVG bleibt stumm.
   */
  bedienung?: { beschreibung: readonly string[]; waehle: (achse: number | null) => void } | null;
  className?: string;
};

/**
 * Die Grafik des Aroma-Netzes (Profil, Startseite, Mini-Netz), ohne Texte.
 *
 * Seit 2026-10-09 (Nutzer: mehr Farbe, Icons statt Schrift, award-winning): die
 * Fläche „mag ich“ ist eine Aroma-Blüte, ein Farbkreis in den Farben der
 * Geschmäcker, zugeschnitten auf das Netz (clip-path). Jede Achse endet in einer
 * runden Marke mit ihrem Icon; der Name steht nicht mehr daneben, er erscheint
 * im Aroma-Netz beim Überfahren. Ringe, Speichen, Rand und Strichlinie bleiben
 * Tinte, damit die Form auch ohne Farbe lesbar ist. Das SVG ist aria-hidden.
 */
export function NetzGrafik({
  mag,
  magNicht,
  kontur = null,
  marken = false,
  achsen,
  aktiv = null,
  bedienung = null,
  className = "w-full max-w-sm",
}: Props) {
  const hatMag = mag.some((x) => x > 0);
  const hatMagNicht = magNicht.some((x) => x > 0);
  const hatKontur = !!kontur && kontur.some((x) => x > 0);
  const magPunkte = netzPunkte(mag, NETZ_MAX, RADIUS, MITTE);
  const liste = achsen ?? geschmacksAchsen();
  const bluete = farbKreis(liste.map((a) => a.farbe));
  const enden = gleichmaessig(NETZ_MAX, liste.length);
  const orte = gleichmaessig(NETZ_MAX, liste.length, MARKEN_RADIUS);
  const zuschnitt = `polygon(${magPunkte.map((p) => { const q = prozent(p); return `${q.x} ${q.y}`; }).join(", ")})`;

  return (
    <div className={`relative ${className}`}>
      {hatMag ? (
        <div
          aria-hidden="true"
          data-netz="bluete"
          className="netz-bluete absolute inset-0"
          style={{ background: bluete, clipPath: zuschnitt }}
        />
      ) : null}
      <svg viewBox={`0 0 ${GROESSE} ${GROESSE}`} aria-hidden="true" className="relative block w-full text-text">
        {RINGE.map((ring) => (
          <polygon
            key={ring}
            points={alsPolygon(gleichmaessig(ring, liste.length))}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {enden.map((p, i) => (
          <line
            key={liste[i].key}
            x1={MITTE}
            y1={MITTE}
            x2={p.x}
            y2={p.y}
            stroke={aktiv === i ? liste[i].farbe : "currentColor"}
            strokeOpacity={aktiv === i ? 1 : 0.15}
            strokeWidth={aktiv === i ? 2 : 1}
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
            points={alsPolygon(magPunkte)}
            fill="currentColor"
            fillOpacity={0.12}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
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
        {/* Punkte an den Ecken in der Farbe des Geschmacks, mit Ring im Seitengrund. */}
        {magPunkte.map((p, i) =>
          mag[i] > 0 ? (
            <circle
              key={liste[i].key}
              data-netz="punkt"
              cx={p.x}
              cy={p.y}
              r={aktiv === i ? 6 : 4}
              fill={liste[i].farbe}
              stroke="var(--color-surface)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          ) : null,
        )}
      </svg>
      {marken
        ? orte.map((p, i) => {
            const achse = liste[i];
            const lage = prozent(p);
            const stil = {
              left: lage.x,
              top: lage.y,
              "--netz-farbe": achse.farbe,
            } as React.CSSProperties;
            const zustand = aktiv === null ? undefined : aktiv === i ? "an" : "aus";
            const inhalt = (
              <span className="netz-marke-kreis grid size-9 place-items-center rounded-full">
                {achse.icon}
              </span>
            );
            return bedienung ? (
              <button
                key={achse.key}
                type="button"
                aria-label={bedienung.beschreibung[i]}
                aria-pressed={aktiv === i}
                data-zustand={zustand}
                className="netz-marke absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                style={stil}
                onPointerEnter={(e) => { if (e.pointerType === "mouse") bedienung.waehle(i); }}
                onPointerLeave={(e) => { if (e.pointerType === "mouse") bedienung.waehle(null); }}
                onFocus={() => bedienung.waehle(i)}
                onBlur={() => bedienung.waehle(null)}
                onClick={() => bedienung.waehle(i)}
              >
                {inhalt}
              </button>
            ) : (
              <span
                key={achse.key}
                aria-hidden="true"
                data-zustand={zustand}
                className="netz-marke absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center"
                style={stil}
              >
                {inhalt}
              </span>
            );
          })
        : null}
    </div>
  );
}
