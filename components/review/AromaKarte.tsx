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
  terpenStaerken,
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
  /** Von außen hervorgehobene Achse (Regler in der Spielwiese); schlägt das Überfahren. */
  hervorheben?: number | null;
  /** Stärke je Terpen (0 bis 1) für das Leuchten der Pfade; sonst aus den Herstellerangaben. */
  staerken?: Readonly<Record<string, number>>;
  /** Namen der Terpene, die der Hersteller nicht angibt: Pfad gestrichelt. */
  ergaenzt?: readonly string[];
  /**
   * Macht die Balken links zu Reglern: man zieht den eigenen Wert je
   * Geschmacksrichtung direkt in der Karte (0 bis 5). `vergleich` zeigt einen
   * Ring, an dem der Griff einrastet.
   */
  regler?: {
    werte: GeschmacksMatrix;
    vergleich?: GeschmacksMatrix;
    aendern: (key: keyof GeschmacksMatrix, wert: number) => void;
  };
  /** Alle bekannten Terpene: zeigt zur aktiven Geschmacksrichtung, welche Terpene sie tragen. */
  lernen?: readonly { name: string; geschmack: KartenTerpen["geschmack"] }[];
};

const DAUER_MS = 900;
const WERT = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const FARBE = { gruen: "var(--color-accent)", lila: "var(--color-kopierstift)" } as const;
const GRAU = "var(--color-border-strong)";
const RINGE = [1, 2, 3, 4, 5] as const;
const SKALA = [0, 1, 2, 3, 4, 5] as const;
const GLEIT_MS = 420;

/**
 * Gleitet Zahlenwerte weich zum Ziel, damit Balken und Flächen sichtbar
 * wachsen oder schrumpfen, wenn sich die Werte ändern. Reduzierte Bewegung: Sprung.
 */
function useGleitend(ziel: readonly number[], sofortRef?: { current: boolean }): number[] {
  const [wert, setWert] = useState<number[]>(() => [...ziel]);
  const aktuell = useRef<number[]>([...ziel]);
  const schluessel = ziel.join(",");
  useEffect(() => {
    const zielWerte = schluessel.split(",").map(Number);
    const start = [...aktuell.current];
    const sofort =
      sofortRef?.current === true ||
      start.length !== zielWerte.length ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const beginn = performance.now();
    let rahmen = 0;
    const schritt = (jetzt: number) => {
      const anteil = sofort ? 1 : sanft(Math.min((jetzt - beginn) / GLEIT_MS, 1));
      const neu = zielWerte.map((z, i) => (start[i] ?? z) + (z - (start[i] ?? z)) * anteil);
      aktuell.current = neu;
      setWert(neu);
      if (anteil < 1) rahmen = requestAnimationFrame(schritt);
    };
    rahmen = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(rahmen);
  }, [schluessel, sofortRef]);
  return wert;
}

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
export function AromaKarte({
  terpene,
  serien: roheSerien,
  titel = "Aroma-Karte",
  hervorheben = null,
  staerken,
  ergaenzt = [],
  regler,
  lernen,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Beim Ziehen folgen die Balken dem Griff sofort, sonst gleiten sie.
  const ziehtRef = useRef(false);
  const [ansicht, setAnsicht] = useState<"karte" | "netz">("karte");
  const [t, setT] = useState(0);
  const [ueberfahren, setAktiv] = useState<number | null>(null);
  const aktiv = hervorheben ?? ueberfahren;
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

  // Werte gleiten weich, damit sichtbar wird, dass die Balkenlänge die Skala abbildet.
  const flach = roheSerien.flatMap((serie) => GESCHMACKS_ACHSEN.map((achse) => serie.matrix[achse.key]));
  const gleitend = useGleitend(flach, ziehtRef);
  const serien: AromaSerie[] = roheSerien.map((serie, s) => ({
    ...serie,
    matrix: Object.fromEntries(
      GESCHMACKS_ACHSEN.map((achse, i) => [achse.key, gleitend[s * GESCHMACKS_ACHSEN.length + i] ?? serie.matrix[achse.key]]),
    ) as GeschmacksMatrix,
  }));
  const staerke = staerken ?? terpenStaerken(terpene);
  /** Farbig ist nur, was gerade aktiv ist: die hervorgehobene Achse, sonst jede Achse mit Wert. */
  const achseFarbig = (index: number) =>
    aktiv === null ? serien.some((serie) => serie.matrix[GESCHMACKS_ACHSEN[index].key] > 0.05) : aktiv === index;

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
        <svg ref={svgRef} viewBox={`0 0 ${BREITE} ${HOEHE}`} aria-hidden="true" className="block w-full text-text">
          <defs>
            {/* Sweet-Spot-Stil der Regler-Spur: rechts 0, links 5 (Balken wachsen nach links). */}
            <linearGradient id="spur-verlauf" x1="1" x2="0" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--color-border)" />
              <stop offset="60%" stopColor="var(--color-accent-subtle)" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
          </defs>
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
              const kraft = staerke[terpen.name] ?? 0;
              // Ein Terpen bei 0 bleibt grau, auch auf aktiver Achse.
              const farbig = achseFarbig(achse) && kraft > 0;
              const farbe = FARBE[achse % 2 === 0 ? "gruen" : "lila"];
              return (
                <path
                  key={terpen.name}
                  d={bogen(knoten[achse], terpenKnoten[index])}
                  fill="none"
                  stroke={farbig ? farbe : GRAU}
                  strokeLinecap="round"
                  strokeDasharray={ergaenzt.includes(terpen.name) ? "6 8" : undefined}
                  opacity={farbig ? 0.45 + 0.55 * kraft : 0.35}
                  style={{
                    strokeWidth: farbig ? 1.5 + 7 * kraft : 1.5,
                    filter: farbig && kraft > 0.15 ? `drop-shadow(0 0 ${2 + 10 * kraft}px ${farbe})` : "none",
                  }}
                  className="transition-[opacity,stroke-width,filter,stroke] duration-normal"
                />
              );
            })}
            {terpenKnoten.map((punkt, index) => (
              <circle
                key={terpene[index].name}
                cx={punkt.x}
                cy={punkt.y}
                r={6}
                fill={(staerke[terpene[index].name] ?? 0) > 0 ? "currentColor" : GRAU}
              />
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
                  stroke={achseFarbig(index) ? FARBE[serie.ton] : GRAU}
                  strokeWidth={aktiv === index ? 6 : 4}
                  strokeLinecap="round"
                  opacity={(serie.matrix[GESCHMACKS_ACHSEN[index].key] > 0.05 ? kartenSichtbar : 0) * (achseFarbig(index) ? 1 : 0.6)}
                />
              ))}
              {serienPunkte[s].map((punkt, index) => (
                <circle
                  key={`p-${GESCHMACKS_ACHSEN[index].key}`}
                  cx={punkt.x}
                  cy={punkt.y}
                  r={aktiv === index ? 6 : 4}
                  fill={achseFarbig(index) || t > 0.5 ? FARBE[serie.ton] : GRAU}
                  opacity={serie.matrix[GESCHMACKS_ACHSEN[index].key] > 0.05 ? 1 : t}
                />
              ))}
            </g>
          ))}

          {/* Regler: je Achse eine Spur im Sweet-Spot-Stil, Griff am eigenen Wert. */}
          {regler && kartenSichtbar > 0.5
            ? karte.map((knoten, index) => {
                const key = GESCHMACKS_ACHSEN[index].key;
                const links = balkenEnde(knoten, MAX, 0).x;
                const rechts = balkenEnde(knoten, 0, 0).x;
                const griff = balkenEnde(knoten, regler.werte[key], 0).x;
                const ring = regler.vergleich ? balkenEnde(knoten, regler.vergleich[key], 0).x : null;
                const wertAus = (clientX: number, clientY: number) => {
                  const ctm = svgRef.current?.getScreenCTM();
                  if (!ctm) return regler.werte[key];
                  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
                  const roh = Math.min(Math.max(((rechts - p.x) / (rechts - links)) * MAX, 0), MAX);
                  const vergleich = regler.vergleich?.[key];
                  if (vergleich !== undefined && Math.abs(roh - vergleich) <= 0.15) return vergleich;
                  return Math.round(roh * 10) / 10;
                };
                return (
                  <g key={`r-${key}`} opacity={kartenSichtbar}>
                    <rect
                      x={links - 4}
                      y={knoten.y - 4}
                      width={rechts - links + 8}
                      height={8}
                      rx={4}
                      fill="url(#spur-verlauf)"
                      opacity={aktiv === index ? 0.9 : 0.35}
                      className="transition-opacity duration-fast"
                    />
                    {ring !== null ? (
                      <circle cx={ring} cy={knoten.y} r={8} fill="none" stroke={FARBE.lila} strokeOpacity={0.45} strokeWidth={2} />
                    ) : null}
                    <circle
                      cx={griff}
                      cy={knoten.y}
                      r={aktiv === index ? 9 : 7}
                      fill={FARBE.lila}
                      stroke="var(--color-surface)"
                      strokeWidth={2.5}
                      style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.3))" }}
                    />
                    {/* Trefferfläche: Ziehen setzt den Wert; Tastatur über die Regler unter der Karte. */}
                    <rect
                      x={links - 12}
                      y={knoten.y - 16}
                      width={rechts - links + 24}
                      height={32}
                      fill="transparent"
                      className="cursor-grab touch-none active:cursor-grabbing"
                      style={{ pointerEvents: "all" }}
                      onPointerEnter={() => setAktiv(index)}
                      onPointerDown={(e) => {
                        e.currentTarget.setPointerCapture(e.pointerId);
                        ziehtRef.current = true;
                        setAktiv(index);
                        regler.aendern(key, wertAus(e.clientX, e.clientY));
                      }}
                      onPointerMove={(e) => {
                        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                        regler.aendern(key, wertAus(e.clientX, e.clientY));
                      }}
                      onPointerUp={() => {
                        ziehtRef.current = false;
                      }}
                    />
                  </g>
                );
              })
            : null}

          {/* Skala über den Balken: Länge = Wert 0 bis 5. */}
          <g opacity={kartenSichtbar * 0.7}>
            {SKALA.map((stufe) => {
              const x = balkenEnde(karte[0], stufe, 0).x;
              const y = karte[0].y - 26;
              return (
                <g key={stufe}>
                  <line
                    x1={x}
                    y1={y + 4}
                    x2={x}
                    y2={karte[karte.length - 1].y + 10}
                    stroke="currentColor"
                    strokeOpacity={0.15}
                    strokeDasharray="2 4"
                  />
                  <text x={x} y={y} textAnchor="middle" fontSize={11} fill="currentColor" fillOpacity={0.6}>
                    {stufe}
                  </text>
                </g>
              );
            })}
          </g>
          {aktiv !== null && kartenSichtbar > 0.5
            ? serien.map((serie, s) => {
                const ende = serienPunkte[s][aktiv];
                return (
                  <text
                    key={`w-${serie.name}`}
                    x={ende.x - 8}
                    y={ende.y + (s === 0 ? -8 : 16)}
                    textAnchor="end"
                    fontSize={12}
                    fontWeight={600}
                    fill={FARBE[serie.ton]}
                  >
                    {WERT.format(serie.matrix[GESCHMACKS_ACHSEN[aktiv].key])}
                  </text>
                );
              })
            : null}

          {knoten.map((punkt, index) => (
            <circle
              key={GESCHMACKS_ACHSEN[index].key}
              cx={punkt.x}
              cy={punkt.y}
              r={aktiv === index ? 8 : 6}
              fill="currentColor"
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
              left: `${((t < 0.5 ? punkt.x - 150 * kartenSichtbar : punkt.x) / BREITE) * 100}%`,
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
            className={cn(
              "absolute -translate-y-1/2 pl-4 font-buch font-medium whitespace-nowrap transition-colors duration-normal",
              terpene.length > 6 ? "text-small" : "text-h3",
              (staerke[terpene[index].name] ?? 0) > 0 ? "text-text" : "text-text-muted",
            )}
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
          : regler
            ? "Zieh die lila Punkte links: Wie stark hast du jede Geschmacksrichtung geschmeckt?"
            : "Über eine Geschmacksrichtung fahren, um die Werte zu vergleichen."}
      </p>
      {aktiveAchse && lernen ? <TerpenLernen achse={aktiv!} lernen={lernen} /> : null}

      {regler ? (
        <fieldset className="sr-only">
          <legend>Dein Eindruck je Geschmacksrichtung, 0 bis 5</legend>
          {GESCHMACKS_ACHSEN.map((achse, index) => (
            <label key={achse.key}>
              {achse.label}
              <input
                type="range"
                min={0}
                max={MAX}
                step={0.1}
                value={regler.werte[achse.key]}
                onFocus={() => setAktiv(index)}
                onBlur={() => setAktiv(null)}
                onChange={(e) => regler.aendern(achse.key, Number(e.target.value))}
              />
            </label>
          ))}
        </fieldset>
      ) : null}

      <div className="sr-only">
      <table>
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
      </div>
    </figure>
  );
}

/** Lerneffekt: welche Terpene eine Geschmacksrichtung tragen. */
function TerpenLernen({ achse, lernen }: { achse: number; lernen: NonNullable<Props["lernen"]> }) {
  const namen = lernen.filter((terpen) => achsenIndex(terpen.geschmack) === achse).map((terpen) => terpen.name);
  if (namen.length === 0) return null;
  return (
    <p className="-mt-4 text-small text-text-muted text-pretty">
      <span className="font-medium text-text">{GESCHMACKS_ACHSEN[achse].label}</span> steckt vor allem in{" "}
      {namen.map((name, index) => (
        <span key={name}>
          {index > 0 ? (index === namen.length - 1 ? " und " : ", ") : null}
          <span className="font-medium text-accent">{name}</span>
        </span>
      ))}
      .
    </p>
  );
}
