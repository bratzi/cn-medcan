"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";

import {
  achsenImKarte,
  balkenLaenge,
  alsPolygon,
  bogen,
  BREITE,
  HOEHE,
  MAX,
  mische,
  mitteVon,
  netzPunkt,
  achsenLage,
  begleitBoegen,
  RADIUS,
  sanft,
  terpenBoegen,
  terpeneImKarte,
  terpenStaerken,
  type KartenTerpen,
  type Punkt,
} from "@/lib/aromakarte";
import { cn } from "@/lib/cn";
import { GESCHMACKS_ACHSEN, type GeschmacksMatrix } from "@/lib/query/bewertung";
import { GeschmackIcon, TerpenIcon } from "@/components/review/AromaIcon";
import { aromaSatz, BEGLEITSTOFFE } from "@/lib/terpen-aromen";

export type AromaSerie = { name: string; ton: "gruen" | "lila"; matrix: GeschmacksMatrix };

type Props = {
  terpene: readonly KartenTerpen[];
  serien: readonly AromaSerie[];
  titel?: string;
  /** Name über der Karte ausblenden (Terpz-Schritt, Nutzer 2026-09-26: gehört dort nicht hin). */
  ohneTitel?: boolean;
  /** Von außen hervorgehobene Achse (Regler in der Spielwiese); schlägt das Überfahren. */
  hervorheben?: number | null;
  /** Stärke je Terpen (0 bis 1) für das Leuchten der Pfade; sonst aus den Herstellerangaben. */
  staerken?: Readonly<Record<string, number>>;
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

/**
 * Farbe der Bögen je Geschmacksrichtung (Nutzer 2026-09-26): Zitrus gelb,
 * Süß pink, Kräutrig moosgrün, Minzig minzgrün, Holzig braun, Würzig zimt,
 * Erdig erdbraun, Diesel grau; Fruchtig und Blumig als bunter Verlauf
 * (Verweis auf die Verläufe in <defs>, null = Verlauf).
 */
const LINIEN_FARBE: Record<string, string | null> = {
  ZITRUS: "#f2d129",
  FRUCHTIG: null,
  SUESS: "#ff5fa8",
  BLUMIG: null,
  KRAEUTRIG: "#7d9a3c",
  MINZIG: "#5fe0b8",
  HOLZIG: "#9b6a3f",
  WUERZIG: "#c98a3e",
  ERDIG: "#7a5536",
  DIESEL: "#9aa1a8",
};
const VERLAUF: Record<string, readonly string[]> = {
  FRUCHTIG: ["#ff4d4d", "#ff9f1c", "#ffd23f", "#b5179e"],
  BLUMIG: ["#c77dff", "#ff70a6", "#ffd670", "#8ecae6"],
};
const RINGE = [1, 2, 3, 4, 5] as const;
const SKALA = [0, 1, 2, 3, 4, 5] as const;
const GLEIT_MS = 420;
const ANSICHTEN = ["karte", "netz"] as const;

/**
 * Pfeiltasten im Ansichts-Schalter (APG Radiogroup): rechts/unten zur nächsten,
 * links/oben zur vorigen Ansicht, jeweils umlaufend; Pos1/Ende springen an den
 * Rand. Andere Tasten: null, der Browser behält sie.
 */
export function naechsteAnsicht(taste: string, index: number, anzahl = ANSICHTEN.length): number | null {
  switch (taste) {
    case "ArrowRight":
    case "ArrowDown":
      return (index + 1) % anzahl;
    case "ArrowLeft":
    case "ArrowUp":
      return (index - 1 + anzahl) % anzahl;
    case "Home":
      return 0;
    case "End":
      return anzahl - 1;
    default:
      return null;
  }
}

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
function balkenEnde(knoten: Punkt, wert: number, versatz: number, laenge = 110): Punkt {
  return { x: knoten.x - 16 - (wert / MAX) * laenge, y: knoten.y + versatz };
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
  terpene: ungeordnet,
  serien: roheSerien,
  titel = "Aroma-Karte",
  ohneTitel = false,
  hervorheben = null,
  staerken,
  regler,
  lernen,
}: Props) {
  const terpene = ungeordnet;
  const svgRef = useRef<SVGSVGElement>(null);
  const spurId = `spur-${useId().replace(/:/g, "")}`;
  // Beim Ziehen folgen die Balken dem Griff sofort, sonst gleiten sie.
  const ziehtRef = useRef(false);
  const [ansicht, setAnsicht] = useState<"karte" | "netz">("karte");
  const [t, setT] = useState(0);
  const [ueberfahren, setAktiv] = useState<number | null>(null);
  // Überfahrenes Terpen oder überfahrener Begleitstoff rechts (Nutzer 2026-09-26:
  // Hervorheben in beide Richtungen). Schließt die überfahrene Achse aus und umgekehrt.
  const [terpenAktiv, setTerpenAktiv] = useState<string | null>(null);
  const achseUeberfahren = (index: number) => {
    setAktiv(index);
    setTerpenAktiv(null);
  };
  const terpenUeberfahren = (name: string) => {
    setTerpenAktiv(name);
    setAktiv(null);
  };
  // Achse, deren Regler per Tastatur fokussiert ist (nur :focus-visible): zeichnet
  // einen Fokusring am Griff, getrennt vom Hervorheben beim Überfahren.
  const [tastatur, setTastatur] = useState<number | null>(null);
  const aktiv = hervorheben ?? ueberfahren;
  const tRef = useRef(0);
  // Misst die tatsächliche Breite der Karte: null vor der ersten Messung
  // (SSR/erster Frame), danach die viewBox-Breite bei gleichem Maßstab wie
  // früher (1,2), damit Striche, Schrift und Knoten fein bleiben und die
  // Karte nur länger wird, nicht größer.
  const messRef = useRef<HTMLDivElement>(null);
  const [breite, setBreite] = useState<number | null>(null);

  useEffect(() => {
    const element = messRef.current;
    if (!element) return;
    const beobachter = new ResizeObserver((eintraege) => {
      const gemessen = eintraege[0]?.contentRect.width;
      if (!gemessen) return;
      setBreite(Math.max(BREITE, Math.round(gemessen)));
    });
    beobachter.observe(element);
    return () => beobachter.disconnect();
  }, []);

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
  // Welche Richtungen ein Terpen oder Begleitstoff spürbar trägt (Anteil ab 20 %, stärkste zuerst):
  // verbindet beim Überfahren beide Seiten der Karte.
  const traeger = new Map<string, { achse: number; anteil: number }[]>([
    ...terpene.map(
      (terpen) =>
        [terpen.name, terpenBoegen(terpen).filter((b) => b.anteil >= 0.2).sort((a, b) => b.anteil - a.anteil)] as const,
    ),
    ...BEGLEITSTOFFE.map(
      (stoff) =>
        [stoff.name, begleitBoegen(stoff.noten).filter((b) => b.anteil >= 0.2).sort((a, b) => b.anteil - a.anteil)] as const,
    ),
  ]);
  /** Achse gehört zum überfahrenen Terpen. */
  const achseVerbunden = (index: number) =>
    terpenAktiv !== null && (traeger.get(terpenAktiv) ?? []).some((b) => b.achse === index);
  /** Achse ist betont: selbst überfahren oder vom überfahrenen Terpen getragen. */
  const achseBetont = (index: number) => aktiv === index || achseVerbunden(index);
  /** Terpen ist betont: selbst überfahren oder trägt die überfahrene Achse. */
  const terpenBetont = (name: string) =>
    terpenAktiv === name || (aktiv !== null && (traeger.get(name) ?? []).some((b) => b.achse === aktiv));
  const etwasUeberfahren = aktiv !== null || terpenAktiv !== null;

  // Vor der ersten Messung wie früher im Maßstab 640 (dann per max-w-3xl
  // dargestellt); danach die gemessene viewBox-Breite. Das Netz (RADIUS)
  // bleibt bei jeder Breite gleich groß, nur sein Mittelpunkt wandert mit.
  const aktBreite = breite ?? BREITE;
  const mitte = mitteVon(aktBreite);
  const karte = achsenImKarte(aktBreite);
  const balken = balkenLaenge(aktBreite);
  const knoten = karte.map((punkt, index) => mische(punkt, netzPunkt(index, MAX, RADIUS + 34, mitte), t));
  // Rechte Spalte: Terpene und Begleitstoffe (Ester, Thiole; keine Terpene) gemeinsam nach
  // dem Mittel ihrer Achsen geordnet, damit sich die Bögen wenig kreuzen (Nutzer 2026-09-26).
  const begleiter = BEGLEITSTOFFE.map((stoff) => ({ ...stoff, boegen: begleitBoegen(stoff.noten) })).filter(
    (stoff) => stoff.boegen.length > 0,
  );
  const reihe = [
    ...terpene.map((terpen, index) => ({ schluessel: `t-${index}`, lage: achsenLage(terpenBoegen(terpen)), name: terpen.name })),
    ...begleiter.map((stoff, index) => ({ schluessel: `b-${index}`, lage: achsenLage(stoff.boegen), name: stoff.name })),
  ].sort((a, b) => a.lage - b.lage || a.name.localeCompare(b.name, "de"));
  const spalte = terpeneImKarte(reihe.length, aktBreite);
  const platz = new Map(reihe.map((eintrag, index) => [eintrag.schluessel, spalte[index]]));
  const terpenKnoten = terpene.map((_, index) => platz.get(`t-${index}`)!);
  const begleitKnoten = begleiter.map((_, index) => platz.get(`b-${index}`)!);
  /** Höchster Wert einer Serie auf der Achse: ab 0,05 ist die Note spürbar. */
  const achsenWert = (achse: number) =>
    Math.max(0, ...serien.map((serie) => serie.matrix[GESCHMACKS_ACHSEN[achse].key]));
  const kartenSichtbar = 1 - t;

  const serienPunkte = serien.map((serie, s) =>
    GESCHMACKS_ACHSEN.map((achse, index) =>
      mische(
        balkenEnde(karte[index], serie.matrix[achse.key], s * 6 - 3, balken),
        netzPunkt(index, serie.matrix[achse.key], RADIUS, mitte),
        t,
      ),
    ),
  );

  const aktiveAchse = aktiv === null ? null : GESCHMACKS_ACHSEN[aktiv];
  // Sättigung und Glow der Bögen nur im Stand der Karte: während des Morphs ändert
  // jeder Bogen in jedem Frame seine Form, ein drop-shadow auf 30 bis 50 Pfaden
  // müsste dann jedes Mal neu gerastert werden. Unterwegs zählen nur Deckkraft und
  // Strichbreite; am Ziel blendet der Filter über die Transition ein (Endzustand
  // wie zuvor). Im Netz sind die Bögen unsichtbar. Das Gleiten der Werte ändert
  // die Bögen nicht (ihre Form hängt nur an t), dort bleibt der Filter stehen.
  const bogenFilter = t === 0;
  // Fokusring der Tastatur: am Griff in der Karte, am Wert im Netz, folgt dem Morph.
  const fokusPunkt =
    regler && tastatur !== null
      ? mische(
          balkenEnde(karte[tastatur], regler.werte[GESCHMACKS_ACHSEN[tastatur].key], 0, balken),
          netzPunkt(tastatur, regler.werte[GESCHMACKS_ACHSEN[tastatur].key], RADIUS, mitte),
          t,
        )
      : null;

  return (
    <figure aria-label={titel} className="flex flex-col gap-6">
      {/* Kopf der Karte: links der Name in Logoschrift mit Verlauf, rechts Ansicht und Legende. */}
      <div className={cn("flex flex-wrap items-start gap-8", ohneTitel ? "justify-end" : "justify-between")}>
      {ohneTitel ? null : (
        <p className="farbverlauf font-hand text-erzaehlung text-balance wrap-break-word leading-[0.9]">{titel}</p>
      )}
      <div className="flex flex-col items-end gap-6">
      <div className="flex flex-wrap items-center justify-end gap-4">
        {/* Ansichts-Schalter als Radiogroup (APG): ein Tabstopp, Pfeiltasten wählen.
            Druck-Rückmeldung per scale 0.97, nur ohne reduzierte Bewegung. */}
        <div role="radiogroup" aria-label="Ansicht" className="inline-flex rounded-full border border-border-strong p-1">
          {ANSICHTEN.map((wahl, index) => (
            <button
              key={wahl}
              type="button"
              role="radio"
              aria-checked={ansicht === wahl}
              tabIndex={ansicht === wahl ? 0 : -1}
              onClick={() => setAnsicht(wahl)}
              onKeyDown={(e) => {
                const ziel = naechsteAnsicht(e.key, index);
                if (ziel === null) return;
                e.preventDefault();
                setAnsicht(ANSICHTEN[ziel]);
                e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[ziel]?.focus();
              }}
              className={cn(
                "inline-flex h-9 items-center rounded-full px-4 text-small font-medium",
                "transition-[color,background-color,scale] duration-[var(--duration-fast),var(--duration-fast),120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:active:scale-[0.97]",
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
      </div>
      </div>

      <div
        ref={messRef}
        className={cn("relative w-full", breite === null && "mx-auto max-w-3xl")}
        onMouseLeave={() => {
          setAktiv(null);
          setTerpenAktiv(null);
        }}
      >
        <svg ref={svgRef} viewBox={`0 0 ${aktBreite} ${HOEHE}`} aria-hidden="true" className="block w-full text-text">
          <defs>
            {/* Sweet-Spot-Stil der Regler-Spur: rechts 0, links 5 (Balken wachsen nach links). */}
            <linearGradient id={spurId} x1="1" x2="0" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--color-border)" />
              <stop offset="60%" stopColor="var(--color-accent-subtle)" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
            {/* Bunte Verläufe für Fruchtig und Blumig, entlang der Bögen von der Achse zu den Terpenen. */}
            {Object.entries(VERLAUF).map(([geschmack, farben]) => (
              <linearGradient
                key={geschmack}
                id={`${spurId}-${geschmack}`}
                gradientUnits="userSpaceOnUse"
                x1={karte[0]?.x ?? 0}
                x2={terpenKnoten[0]?.x ?? aktBreite}
                y1={0}
                y2={0}
              >
                {farben.map((farbe, i) => (
                  <stop key={farbe} offset={`${(i / (farben.length - 1)) * 100}%`} stopColor={farbe} />
                ))}
              </linearGradient>
            ))}
          </defs>
          {/* Netz-Raster, blendet mit dem Morph ein. */}
          <g opacity={t * 0.18}>
            {RINGE.map((ring) => (
              <polygon
                key={ring}
                points={alsPolygon(GESCHMACKS_ACHSEN.map((_, index) => netzPunkt(index, ring, RADIUS, mitte)))}
                fill="none"
                stroke="currentColor"
              />
            ))}
            {GESCHMACKS_ACHSEN.map((achse, index) => {
              const ende = netzPunkt(index, MAX, RADIUS, mitte);
              return <line key={achse.key} x1={mitte.x} y1={mitte.y} x2={ende.x} y2={ende.y} stroke="currentColor" />;
            })}
          </g>

          {/* Bögen Achse zu Terpen, nur in der Karte. */}
          <g opacity={kartenSichtbar}>
            {terpene.flatMap((terpen, index) =>
              terpenBoegen(terpen).map(({ achse, anteil: notenAnteil }) => {
                // Überfahrenes Terpen: seine Bögen leuchten auch, wenn es nicht angegeben ist
                // (Lerneffekt, Mindeststärke 0,6); alle anderen Bögen treten zurück.
                const imFokus = terpenAktiv === terpen.name;
                const gedimmt = terpenAktiv !== null && !imFokus;
                const kraft = imFokus ? Math.max(staerke[terpen.name] ?? 0, 0.6) : (staerke[terpen.name] ?? 0);
                // Vorhanden: das Terpen trägt (Stärke > 0) und die Richtung ist aktiv; sonst gestrichelt grau.
                const vorhanden = imFokus || (achseFarbig(achse) && kraft > 0);
                const geschmack = GESCHMACKS_ACHSEN[achse].enumWert;
                const grundfarbe = LINIEN_FARBE[geschmack];
                const farbe = grundfarbe ?? `url(#${spurId}-${geschmack})`;
                const leuchtfarbe = grundfarbe ?? VERLAUF[geschmack]?.[1] ?? "white";
                // Ausprägung 0 bis 1: Stärke des Terpens mal Anteil der Note. Schwach = ausgegraut
                // (entsättigt, blass), stark = satt und mit Glow (Nutzer 2026-09-26).
                const auspraegung = kraft * (0.4 + 0.6 * notenAnteil);
                // Nebennoten zeichnen feiner als die Hauptnote (Anteil 0 bis 1).
                const gewicht = 0.35 + 0.65 * notenAnteil;
                const breite = (1 + 3.5 * kraft) * gewicht;
                const pfad = bogen(knoten[achse], terpenKnoten[index]);
                // Versatz je Bogen, damit die Lichtpunkte nicht im Gleichschritt laufen.
                const versatz = `${-((index * 0.37 + achse * 0.13) % 3).toFixed(2)}s`;
                return (
                  <Fragment key={`${terpen.name}-${achse}`}>
                    <path
                      d={pfad}
                      fill="none"
                      stroke={vorhanden ? farbe : GRAU}
                      strokeLinecap="round"
                      strokeDasharray={vorhanden ? undefined : "6 8"}
                      opacity={(vorhanden ? 0.35 + 0.65 * auspraegung : 0.22) * (gedimmt ? 0.2 : 1)}
                      style={{
                        strokeWidth: vorhanden ? breite : 0.8,
                        filter:
                          vorhanden && bogenFilter
                            ? `saturate(${(0.1 + 0.9 * auspraegung).toFixed(2)})${
                                auspraegung > 0.45 ? ` drop-shadow(0 0 ${(2 + 8 * auspraegung).toFixed(1)}px ${leuchtfarbe})` : ""
                              }`
                            : "none",
                      }}
                      // Unterwegs ohne filter in der Transition: der Filter fällt sofort
                      // weg, statt 250 ms lang auf wandernden Pfaden überzublenden.
                      className={
                        bogenFilter
                          ? "transition-[opacity,stroke-width,filter,stroke] duration-normal"
                          : "transition-[opacity,stroke-width,stroke] duration-normal"
                      }
                    />
                    {/* Aktive Bögen glühen und pulsieren im Takt der Delta-Balken links, in
                        ihrer eigenen Farbe; ein Lichtpunkt läuft vom Geschmack zum Terpen
                        (Nutzer 2026-09-26, globals.css .bogen-puls/.bogen-fluss). Im Netz
                        (t = 1) sind sie unsichtbar und laufen dann nicht endlos weiter. */}
                    {vorhanden && !gedimmt && t < 1 ? (
                      <>
                        <path
                          d={pfad}
                          fill="none"
                          stroke={farbe}
                          strokeLinecap="round"
                          className="bogen-puls"
                          style={
                            {
                              "--bogen-farbe": leuchtfarbe,
                              "--bogen-breite": `${breite.toFixed(2)}px`,
                              "--bogen-glow": (4 + 10 * auspraegung).toFixed(1),
                            } as React.CSSProperties
                          }
                        />
                        <path
                          d={pfad}
                          pathLength={100}
                          fill="none"
                          stroke={farbe}
                          strokeLinecap="round"
                          strokeDasharray="6 194"
                          className="bogen-fluss"
                          style={
                            {
                              "--bogen-farbe": leuchtfarbe,
                              strokeWidth: Math.max(2, breite * 1.5),
                              opacity: 0.5 + 0.5 * auspraegung,
                              animationDelay: versatz,
                            } as React.CSSProperties
                          }
                        />
                      </>
                    ) : null}
                  </Fragment>
                );
              }),
            )}
            {/* Begleitstoffe gepunktet in neutraler Farbe: sie sind keine Terpene. */}
            {begleiter.flatMap((stoff, index) =>
              stoff.boegen.map(({ achse, anteil }) => {
                const imFokus = terpenAktiv === stoff.name;
                const spuerbar = imFokus || achsenWert(achse) > 0.05;
                return (
                  <path
                    key={`${stoff.name}-${achse}`}
                    d={bogen(knoten[achse], begleitKnoten[index])}
                    fill="none"
                    stroke={imFokus ? "var(--color-text)" : spuerbar ? "var(--color-text-muted)" : GRAU}
                    strokeLinecap="round"
                    strokeDasharray="2 6"
                    opacity={(spuerbar ? 0.5 + 0.4 * anteil : 0.3) * (terpenAktiv !== null && !imFokus ? 0.2 : 1)}
                    style={{ strokeWidth: imFokus ? 1.5 + 2 * anteil : spuerbar ? 0.8 + 1.2 * anteil : 0.8 }}
                    className="transition-[opacity,stroke-width,stroke] duration-normal"
                  />
                );
              }),
            )}
            {begleitKnoten.map((punkt, index) => (
              <circle
                key={begleiter[index].name}
                cx={punkt.x}
                cy={punkt.y}
                r={terpenBetont(begleiter[index].name) ? 7 : 5}
                fill="none"
                stroke={terpenBetont(begleiter[index].name) ? "currentColor" : GRAU}
                strokeWidth={1.5}
              />
            ))}
            {/* Knoten wachsen wie die Punkte der Geschmacksachsen, wenn ihr Terpen betont ist. */}
            {terpenKnoten.map((punkt, index) => (
              <circle
                key={terpene[index].name}
                cx={punkt.x}
                cy={punkt.y}
                r={terpenBetont(terpene[index].name) ? 8 : 6}
                fill={(staerke[terpene[index].name] ?? 0) > 0 || terpenBetont(terpene[index].name) ? "currentColor" : GRAU}
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
                  strokeWidth={achseBetont(index) ? 6 : 4}
                  strokeLinecap="round"
                  opacity={(serie.matrix[GESCHMACKS_ACHSEN[index].key] > 0.05 ? kartenSichtbar : 0) * (achseFarbig(index) ? 1 : 0.6)}
                />
              ))}
              {serienPunkte[s].map((punkt, index) => (
                <circle
                  key={`p-${GESCHMACKS_ACHSEN[index].key}`}
                  cx={punkt.x}
                  cy={punkt.y}
                  r={achseBetont(index) ? 6 : 4}
                  fill={achseFarbig(index) || t > 0.5 ? FARBE[serie.ton] : GRAU}
                  opacity={serie.matrix[GESCHMACKS_ACHSEN[index].key] > 0.05 ? 1 : t}
                />
              ))}
            </g>
          ))}

          {/* Delta je Achse (Nutzer 2026-09-26): das Stück, um das der längere Balken
              übersteht, glüht und pulsiert in dessen Farbe (globals.css, .delta-puls). */}
          {serien.length >= 2 && kartenSichtbar > 0.5
            ? GESCHMACKS_ACHSEN.map((achse, index) => {
                const werte = serien.map((serie) => serie.matrix[achse.key]);
                const lang = werte[0] >= werte[1] ? 0 : 1;
                const kurz = 1 - lang;
                if (Math.abs(werte[0] - werte[1]) < 0.1) return null;
                const von = serienPunkte[kurz][index];
                const bis = serienPunkte[lang][index];
                return (
                  <line
                    key={`delta-${achse.key}`}
                    x1={von.x}
                    y1={bis.y}
                    x2={bis.x}
                    y2={bis.y}
                    stroke={FARBE[serien[lang].ton]}
                    strokeLinecap="round"
                    className="delta-puls"
                    style={{ opacity: kartenSichtbar, "--delta-farbe": FARBE[serien[lang].ton] } as React.CSSProperties}
                  />
                );
              })
            : null}

          {/* Regler: je Achse eine Spur im Sweet-Spot-Stil, Griff am eigenen Wert. */}
          {regler && kartenSichtbar > 0.5
            ? karte.map((knoten, index) => {
                const key = GESCHMACKS_ACHSEN[index].key;
                const links = balkenEnde(knoten, MAX, 0, balken).x;
                const rechts = balkenEnde(knoten, 0, 0, balken).x;
                const griff = balkenEnde(knoten, regler.werte[key], 0, balken).x;
                const ring = regler.vergleich ? balkenEnde(knoten, regler.vergleich[key], 0, balken).x : null;
                const wertAus = (clientX: number, clientY: number) => {
                  const ctm = svgRef.current?.getScreenCTM();
                  if (!ctm) return regler.werte[key];
                  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
                  const roh = Math.min(Math.max(((rechts - p.x) / (rechts - links)) * MAX, 0), MAX);
                  const vergleich = regler.vergleich?.[key];
                  if (vergleich !== undefined && Math.abs(roh - vergleich) <= 0.15) return vergleich;
                  // Halbe Schritte wie beim Speichern: leichter zu treffen (Nutzer 2026-09-25).
                  return Math.round(roh * 2) / 2;
                };
                return (
                  <g key={`r-${key}`} opacity={kartenSichtbar}>
                    <rect
                      x={links - 4}
                      y={knoten.y - 5}
                      width={rechts - links + 8}
                      height={10}
                      rx={5}
                      fill={`url(#${spurId})`}
                      opacity={aktiv === index ? 0.9 : 0.35}
                      className="transition-opacity duration-fast"
                    />
                    {ring !== null ? (
                      <circle cx={ring} cy={knoten.y} r={11.5} fill="none" stroke={FARBE.gruen} strokeOpacity={0.8} strokeWidth={2} />
                    ) : null}
                    <circle
                      cx={griff}
                      cy={knoten.y}
                      r={aktiv === index ? 12 : 10}
                      fill={FARBE.lila}
                      stroke="var(--color-surface)"
                      strokeWidth={2.5}
                      style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.3))" }}
                    />
                    {/* Trefferfläche: Ziehen setzt den Wert; Tastatur über die Regler unter der Karte. */}
                    <rect
                      x={links - 12}
                      y={knoten.y - 22}
                      width={rechts - links + 24}
                      height={44}
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

          {/* Tastaturfokus (nur :focus-visible der Regler unter der Karte): ein eigener
              Ring im Fokus-Token um den Griff, 2 px bei jeder Breite der Karte,
              im Kontrastmodus in der Systemfarbe. Überfahren zeigt ihn nicht. */}
          {fokusPunkt ? (
            <circle
              cx={fokusPunkt.x}
              cy={fokusPunkt.y}
              r={16}
              fill="none"
              stroke="var(--color-focus-ring)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
              className="forced-colors:stroke-[color:Highlight]"
            />
          ) : null}

          {/* Skala über den Balken: Länge = Wert 0 bis 5. */}
          <g opacity={kartenSichtbar * 0.7}>
            {SKALA.map((stufe) => {
              const x = balkenEnde(karte[0], stufe, 0, balken).x;
              // Über der Beschriftung der ersten Achse, die seit 2026-09-27 über ihrem Balken steht.
              const y = karte[0].y - 34;
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
              r={achseBetont(index) ? 8 : 6}
              fill="currentColor"
            />
          ))}
        </svg>

        {/* Beschriftung als HTML in fester Größe; zugleich die Ziele fürs Hervorheben. In der
            Karte steht sie über dem Balken, sonst streicht ein gefüllter Balken sie durch. */}
        {knoten.map((punkt, index) => (
          <button
            key={GESCHMACKS_ACHSEN[index].key}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onMouseEnter={() => achseUeberfahren(index)}
            onFocus={() => achseUeberfahren(index)}
            className={cn(
              "absolute inline-flex -translate-y-1/2 items-center gap-1.5 text-small font-medium uppercase tracking-wide whitespace-nowrap",
              t < 0.5 ? "-translate-x-full pr-4" : "-translate-x-1/2",
              achseBetont(index) ? "text-text" : "text-text-muted",
            )}
            style={{
              // Mindestens 124 vom Rand, damit der längste Name (Icon + KRÄUTRIG, rund 118 px)
              // auf schmalen Karten nicht links hinausragt.
              left: `${((t < 0.5 ? Math.max(punkt.x - 150 * kartenSichtbar, 124) : punkt.x) / aktBreite) * 100}%`,
              top: `${((punkt.y - 20 * kartenSichtbar) / HOEHE) * 100}%`,
            }}
          >
            <GeschmackIcon geschmack={GESCHMACKS_ACHSEN[index].enumWert} />
            {GESCHMACKS_ACHSEN[index].label}
          </button>
        ))}
        {/* Terpene rechts sind wie die Geschmäcker links Ziele fürs Hervorheben (Nutzer
            2026-09-26): ihre Bögen leuchten, die getragenen Richtungen links werden betont. */}
        {terpenKnoten.map((punkt, index) => {
          const name = terpene[index].name;
          return (
            <button
              key={name}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onMouseEnter={() => terpenUeberfahren(name)}
              onFocus={() => terpenUeberfahren(name)}
              className={cn(
                "absolute inline-flex -translate-y-1/2 items-center gap-1.5 pl-4 font-buch font-medium whitespace-nowrap transition-colors duration-normal",
                terpene.length > 6 ? "text-small" : "text-h3",
                (etwasUeberfahren ? terpenBetont(name) : (staerke[name] ?? 0) > 0) ? "text-text" : "text-text-muted",
              )}
              style={{ left: `${(punkt.x / aktBreite) * 100}%`, top: `${(punkt.y / HOEHE) * 100}%`, opacity: kartenSichtbar }}
            >
              <TerpenIcon name={name} />
              {name}
            </button>
          );
        })}
        {begleitKnoten.map((punkt, index) => (
          <button
            key={begleiter[index].name}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onMouseEnter={() => terpenUeberfahren(begleiter[index].name)}
            onFocus={() => terpenUeberfahren(begleiter[index].name)}
            className={cn(
              "absolute flex -translate-y-1/2 flex-col items-start pl-4 text-left whitespace-nowrap transition-colors duration-normal",
              terpenBetont(begleiter[index].name) ? "text-text" : "text-text-muted",
            )}
            style={{ left: `${(punkt.x / aktBreite) * 100}%`, top: `${(punkt.y / HOEHE) * 100}%`, opacity: kartenSichtbar }}
          >
            {/* Hinweis in eigener Zeile, sonst ragt er über schmale Karten (Doppelseite) hinaus. */}
            <span className="inline-flex items-center gap-1.5 text-small italic">
              <TerpenIcon name={begleiter[index].name} />
              {begleiter[index].name}
            </span>
            <span className="text-caption font-normal">{begleiter[index].hinweis}</span>
          </button>
        ))}
      </div>

      {/* Infotext unter der Karte (Nutzer 2026-09-26, 2026-09-27): zentriert wie eine Legende im Buch.
          Die Höhe ist fest reserviert, damit die Sektion beim Überfahren nicht springt; der Inhalt
          blendet beim Wechsel nur über (Deckkraft). */}
      <div aria-live="polite" className="grid min-h-64 justify-items-center sm:min-h-48">
        {aktiveAchse ? (
          <InfoTafel
            key={`achse-${aktiveAchse.key}`}
            art="Geschmacksrichtung"
            icon={<GeschmackIcon geschmack={aktiveAchse.enumWert} className={ICON_TITEL} />}
            titel={aktiveAchse.label}
            bezugTitel={lernen ? "Steckt vor allem in" : undefined}
            bezug={lernen ? tragendeStoffe(aktiv!, lernen).map((name) => (
              <Pille key={name} icon={<TerpenIcon name={name} className={ICON_PILLE} />}>
                {name}
              </Pille>
            )) : []}
          >
            <span className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {serien.map((serie) => (
                <span key={serie.name} className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: FARBE[serie.ton] }} />
                  <span className="text-text-muted">{serie.name}</span>
                  <span className="numeric text-text">{WERT.format(serie.matrix[aktiveAchse.key])}</span>
                </span>
              ))}
            </span>
          </InfoTafel>
        ) : terpenAktiv !== null ? (
          <InfoTafel
            key={`terpen-${terpenAktiv}`}
            art={BEGLEITSTOFFE.some((stoff) => stoff.name === terpenAktiv) ? "Begleitstoff" : "Terpen"}
            icon={<TerpenIcon name={terpenAktiv} className={ICON_TITEL} />}
            titel={terpenAktiv}
            bezugTitel="Trägt vor allem"
            bezug={(traeger.get(terpenAktiv) ?? []).map(({ achse }) => (
              <Pille
                key={achse}
                icon={<GeschmackIcon geschmack={GESCHMACKS_ACHSEN[achse].enumWert} className={ICON_PILLE} />}
              >
                {GESCHMACKS_ACHSEN[achse].label}
              </Pille>
            ))}
          >
            {aromaSatz(terpenAktiv)}
          </InfoTafel>
        ) : (
          <p
            key="hinweis"
            className="max-w-md pt-8 text-center font-buch text-body text-text-muted italic text-balance transition-opacity duration-normal ease-out starting:opacity-0"
          >
            {regler
              ? "Zieh die lila Punkte links: Wie stark hast du jede Geschmacksrichtung geschmeckt?"
              : "Fahr über eine Geschmacksrichtung oder ein Terpen, um die Verbindungen zu sehen."}
          </p>
        )}
      </div>

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
                onFocus={(e) => {
                  setAktiv(index);
                  setTastatur(e.currentTarget.matches(":focus-visible") ? index : null);
                }}
                onBlur={() => {
                  setAktiv(null);
                  setTastatur(null);
                }}
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

/** Icon vor dem Namen im Infotext: abgesetzt, in Größe der Zeile. */
const ICON_TITEL = "size-6! shrink-0 text-text-muted";
/** Icon in einer Pille: klein, gedämpft, damit der Name führt. */
const ICON_PILLE = "size-4! shrink-0 text-text-muted";

/**
 * Legende unter der Karte: kleine Versalzeile, Name mit abgesetztem Icon, ein Satz, darunter die
 * Verbindungen als Pillen. Drei Grade (caption, h3, body), zentriert.
 */
function InfoTafel({
  art,
  icon,
  titel,
  bezugTitel,
  bezug,
  children,
}: {
  art: string;
  icon: React.ReactNode;
  titel: string;
  bezugTitel?: string;
  bezug: readonly React.ReactNode[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-2 text-center transition-opacity duration-normal ease-out starting:opacity-0">
      <p className="text-caption tracking-wide text-text-muted uppercase">{art}</p>
      <p className="inline-flex items-center gap-2 font-buch text-h3 text-text">
        <span aria-hidden="true" className="flex">
          {icon}
        </span>
        {titel}
      </p>
      {children ? <p className="max-w-md font-buch text-body text-text-muted italic text-pretty">{children}</p> : null}
      {bezug.length > 0 ? (
        <div className="mt-2 flex flex-col items-center gap-2">
          {bezugTitel ? <p className="text-caption tracking-wide text-text-muted uppercase">{bezugTitel}</p> : null}
          <ul className="flex flex-wrap justify-center gap-2">{bezug}</ul>
        </div>
      ) : null}
    </div>
  );
}

/** Eine Verbindung als ruhige Pille: Icon abgesetzt links, Name rechts. */
function Pille({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex h-8 items-center gap-2 rounded-full border border-border px-4 text-caption text-text">
      <span aria-hidden="true" className="flex">
        {icon}
      </span>
      {children}
    </li>
  );
}

/** Lerneffekt: Terpene und Begleitstoffe, die spürbar auf diese Richtung einzahlen (Anteil ab 20 %). */
function tragendeStoffe(achse: number, lernen: NonNullable<Props["lernen"]>): string[] {
  const namen = lernen
    .filter((terpen) =>
      terpenBoegen({ ...terpen, konzentrationProzent: null, rang: 99 }).some((b) => b.achse === achse && b.anteil >= 0.2),
    )
    .map((terpen) => terpen.name);
  const stoffe = BEGLEITSTOFFE.filter((stoff) =>
    begleitBoegen(stoff.noten).some((b) => b.achse === achse && b.anteil >= 0.2),
  ).map((stoff) => stoff.name);
  return [...namen, ...stoffe];
}
