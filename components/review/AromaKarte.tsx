"use client";

import { useEffect, useRef, useState } from "react";

import {
  achsenImKarte,
  achsenIndex,
  alsPolygon,
  bogen,
  BREITE,
  HOEHE,
  MAX,
  mische,
  netzPunkt,
  RADIUS,
  sanft,
  terpeneImKarte,
  type KartenTerpen,
  type Punkt,
} from "@/lib/aromakarte";
import { cn } from "@/lib/cn";
import { GESCHMACKS_ACHSEN, type GeschmacksMatrix } from "@/lib/query/bewertung";

export type AromaSerie = { name: string; ton: "gruen" | "lila"; matrix: GeschmacksMatrix };

type Props = {
  terpene: readonly KartenTerpen[];
  serien: readonly AromaSerie[];
  titel?: string;
};

const DAUER_MS = 900;
const WERT = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const FARBE = { gruen: "var(--color-accent)", lila: "var(--color-kopierstift)" } as const;
const RINGE = [1, 2, 3, 4, 5] as const;

/** Wo der Wert einer Serie in der Karte sitzt: ein Balken links neben dem Achsenknoten. */
function balkenEnde(knoten: Punkt, wert: number, versatz: number): Punkt {
  return { x: knoten.x - 16 - (wert / MAX) * 110, y: knoten.y + versatz };
}

/**
 * Aroma-Karte (Spec Redesign 14): das optische Kernstück der Auswertung.
 * Ansicht "Karte" wie ein Terpen-Poster: links die Geschmacksachsen mit
 * einem Balken je Serie, rechts die Terpene der Sorte, dazwischen Bögen.
 * Ansicht "Netz": die Knoten fliegen an ihre Achsen, die Balkenenden werden
 * zu den Ecken der Serienflächen. Der Wechsel morpht über requestAnimationFrame;
 * bei reduzierter Bewegung springt er. Die Werte stehen zusätzlich als
 * Tabelle für Screenreader, das SVG ist aria-hidden.
 */
export function AromaKarte({ terpene, serien, titel = "Aroma-Karte" }: Props) {
  const [ansicht, setAnsicht] = useState<"karte" | "netz">("karte");
  const [t, setT] = useState(0);
  const [aktiv, setAktiv] = useState<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const ziel = ansicht === "netz" ? 1 : 0;
    // Reduzierte Bewegung: derselbe Weg, nur ohne Dauer, also ein Sprung im nächsten Frame.
    const dauer = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : DAUER_MS;
    const start = tRef.current;
    const beginn = performance.now();
    let rahmen = 0;
    const schritt = (jetzt: number) => {
      const anteil = dauer === 0 ? 1 : Math.min((jetzt - beginn) / dauer, 1);
      const wert = start + (ziel - start) * sanft(anteil);
      tRef.current = wert;
      setT(wert);
      if (anteil < 1) rahmen = requestAnimationFrame(schritt);
    };
    rahmen = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(rahmen);
  }, [ansicht]);

  const karte = achsenImKarte();
  const knoten = karte.map((punkt, index) => mische(punkt, netzPunkt(index, MAX, RADIUS + 34), t));
  const terpenKnoten = terpeneImKarte(terpene.length);
  const kartenSichtbar = 1 - t;

  const serienPunkte = serien.map((serie, s) =>
    GESCHMACKS_ACHSEN.map((achse, index) =>
      mische(balkenEnde(karte[index], serie.matrix[achse.key], s * 6 - 3), netzPunkt(index, serie.matrix[achse.key]), t),
    ),
  );

  const aktiveAchse = aktiv === null ? null : GESCHMACKS_ACHSEN[aktiv];

  return (
    <figure className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <figcaption className="font-buch text-h2 font-medium text-text">{titel}</figcaption>
        <div role="group" aria-label="Ansicht" className="inline-flex rounded-full border border-border-strong p-1">
          {(["karte", "netz"] as const).map((wahl) => (
            <button
              key={wahl}
              type="button"
              aria-pressed={ansicht === wahl}
              onClick={() => setAnsicht(wahl)}
              className={cn(
                "inline-flex h-9 items-center rounded-full px-4 text-small font-medium transition-colors duration-fast ease-standard",
                ansicht === wahl ? "bg-accent text-accent-fg" : "text-text hover:text-accent-hover",
              )}
            >
              {wahl === "karte" ? "Karte" : "Netz"}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex flex-wrap gap-6 text-small text-text">
        {serien.map((serie) => (
          <li key={serie.name} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="inline-block size-3 rounded-full" style={{ background: FARBE[serie.ton] }} />
            {serie.name}
          </li>
        ))}
      </ul>

      <div className="relative w-full" onMouseLeave={() => setAktiv(null)}>
        <svg viewBox={`0 0 ${BREITE} ${HOEHE}`} aria-hidden="true" className="block w-full text-text">
          {/* Netz-Raster, blendet mit dem Morph ein. */}
          <g opacity={t * 0.18}>
            {RINGE.map((ring) => (
              <polygon
                key={ring}
                points={alsPolygon(GESCHMACKS_ACHSEN.map((_, index) => netzPunkt(index, ring)))}
                fill="none"
                stroke="currentColor"
              />
            ))}
            {GESCHMACKS_ACHSEN.map((achse, index) => {
              const ende = netzPunkt(index, MAX);
              return <line key={achse.key} x1={BREITE / 2} y1={HOEHE / 2} x2={ende.x} y2={ende.y} stroke="currentColor" />;
            })}
          </g>

          {/* Bögen Achse zu Terpen, nur in der Karte. */}
          <g opacity={kartenSichtbar}>
            {terpene.map((terpen, index) => {
              const achse = achsenIndex(terpen.geschmack);
              if (achse < 0) return null;
              const hervor = aktiv === null || aktiv === achse;
              return (
                <path
                  key={terpen.name}
                  d={bogen(knoten[achse], terpenKnoten[index])}
                  fill="none"
                  stroke={FARBE[achse % 2 === 0 ? "gruen" : "lila"]}
                  strokeWidth={hervor ? 4 : 2}
                  strokeLinecap="round"
                  opacity={hervor ? 0.9 : 0.2}
                  className="transition-[opacity,stroke-width] duration-normal"
                />
              );
            })}
            {terpenKnoten.map((punkt, index) => (
              <circle key={terpene[index].name} cx={punkt.x} cy={punkt.y} r={6} fill="currentColor" />
            ))}
          </g>

          {/* Serien: Balken in der Karte, Flächen im Netz. */}
          {serien.map((serie, s) => (
            <g key={serie.name}>
              <polygon
                points={alsPolygon(serienPunkte[s])}
                fill={FARBE[serie.ton]}
                fillOpacity={0.18 * t}
                stroke={FARBE[serie.ton]}
                strokeOpacity={t}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
              {serienPunkte[s].map((punkt, index) => (
                <line
                  key={GESCHMACKS_ACHSEN[index].key}
                  x1={mische({ x: karte[index].x - 16, y: karte[index].y + s * 6 - 3 }, punkt, t).x}
                  y1={punkt.y}
                  x2={punkt.x}
                  y2={punkt.y}
                  stroke={FARBE[serie.ton]}
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={kartenSichtbar * (aktiv === null || aktiv === index ? 1 : 0.3)}
                />
              ))}
              {serienPunkte[s].map((punkt, index) => (
                <circle
                  key={`p-${GESCHMACKS_ACHSEN[index].key}`}
                  cx={punkt.x}
                  cy={punkt.y}
                  r={aktiv === index ? 6 : 4}
                  fill={FARBE[serie.ton]}
                />
              ))}
            </g>
          ))}

          {knoten.map((punkt, index) => (
            <circle
              key={GESCHMACKS_ACHSEN[index].key}
              cx={punkt.x}
              cy={punkt.y}
              r={aktiv === index ? 8 : 6}
              fill={FARBE[index % 2 === 0 ? "gruen" : "lila"]}
            />
          ))}
        </svg>

        {/* Beschriftung als HTML in fester Größe; zugleich die Ziele fürs Hervorheben. */}
        {knoten.map((punkt, index) => (
          <button
            key={GESCHMACKS_ACHSEN[index].key}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onMouseEnter={() => setAktiv(index)}
            onFocus={() => setAktiv(index)}
            className={cn(
              "absolute -translate-y-1/2 text-small font-medium uppercase tracking-wide whitespace-nowrap",
              t < 0.5 ? "-translate-x-full pr-4" : "-translate-x-1/2",
              aktiv === index ? "text-text" : "text-text-muted",
            )}
            style={{
              left: `${((t < 0.5 ? punkt.x - 130 * kartenSichtbar : punkt.x) / BREITE) * 100}%`,
              top: `${(punkt.y / HOEHE) * 100}%`,
            }}
          >
            {GESCHMACKS_ACHSEN[index].label}
          </button>
        ))}
        {terpenKnoten.map((punkt, index) => (
          <span
            key={terpene[index].name}
            aria-hidden="true"
            className="absolute -translate-y-1/2 pl-4 font-buch text-h3 font-medium whitespace-nowrap text-text"
            style={{ left: `${(punkt.x / BREITE) * 100}%`, top: `${(punkt.y / HOEHE) * 100}%`, opacity: kartenSichtbar }}
          >
            {terpene[index].name}
          </span>
        ))}
      </div>

      <p aria-live="polite" className="numeric min-h-6 text-small text-text">
        {aktiveAchse
          ? `${aktiveAchse.label}: ` +
            serien.map((serie) => `${serie.name} ${WERT.format(serie.matrix[aktiveAchse.key])}`).join(" · ")
          : "Über eine Geschmacksrichtung fahren, um die Werte zu vergleichen."}
      </p>

      <table className="sr-only">
        <caption>{`${titel}, Skala 0 bis 5`}</caption>
        <thead>
          <tr>
            <th scope="col">Geschmack</th>
            {serien.map((serie) => (
              <th key={serie.name} scope="col">
                {serie.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GESCHMACKS_ACHSEN.map((achse) => (
            <tr key={achse.key}>
              <th scope="row">{achse.label}</th>
              {serien.map((serie) => (
                <td key={serie.name}>{WERT.format(serie.matrix[achse.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
