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
  balkenVergleich,
  begleitBoegen,
  bogenSchicht,
  flussDauer,
  herstellerKraft,
  leuchtendeTerpene,
  linienBreite,
  MIN_BREITE,
  radiusVon,
  sanft,
  SPUERBAR,
  streifen,
  terpenBoegen,
  terpeneImKarte,
  terpenStaerken,
  type KartenTerpen,
  type Punkt,
  type TerpenEbene,
} from "@/lib/aromakarte";
import { cn } from "@/lib/cn";
import { GESCHMACKS_ACHSEN, type GeschmacksMatrix } from "@/lib/query/bewertung";
import { GeschmackIcon, TerpenIcon } from "@/components/review/AromaIcon";
import { BEGLEITSTOFFE } from "@/lib/terpen-aromen";
import { formatiereZahl } from "@/lib/format";
import { rasten, tasteZuWert } from "@/lib/regler-raster";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import { t as text } from "@/lib/i18n/text";
import type { AromaTexte } from "@/lib/i18n/typen";

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
   * Ebene je Terpen (Masterplan Bewertung v2, T5): Herstellerangabe, vom Nutzer
   * ergänzt oder nur über den Geschmack verbunden (Geist). Ohne Angabe gilt jedes
   * Terpen als Herstellerangabe (Doppelseite: dort stehen nur diese).
   */
  ebenen?: Readonly<Record<string, TerpenEbene>>;
  /**
   * Macht die Balken links zu Reglern: man zieht den eigenen Wert je
   * Geschmacksrichtung direkt in der Karte (0 bis 5). `vergleich` ist der
   * Community-Median (T5, zuvor die Herstellerangabe): ein grüner Ring, an dem
   * der Griff einrastet. Ohne Median kein Ring, dafür ein Hinweis.
   */
  regler?: {
    werte: GeschmacksMatrix;
    vergleich?: GeschmacksMatrix;
    aendern: (key: keyof GeschmacksMatrix, wert: number) => void;
  };
  /**
   * Woran sich die Farbe des Bewertungsbalkens misst (T5b, Nutzer 2026-09-29):
   * "median" in der Maske (der grüne Ring am Regler, der grüne Herstellerbalken
   * entfällt), "serie" in der Anzeige (die grüne Serie als Soll-Strich). Bewegt
   * wird nur die lila Serie, die angezeigte Bewertung.
   */
  bezug?: "median" | "serie";
  /** Alle bekannten Terpene: zeigt zur aktiven Geschmacksrichtung, welche Terpene sie tragen. */
  lernen?: readonly { name: string; geschmack: KartenTerpen["geschmack"] }[];
  /**
   * Dicht für die Buchseite ab lg (T7b, Nutzer 2026-09-30): Schalter und
   * Legende in einer Zeile, die Tafel beim Überfahren liegt über dem unteren
   * Rand der Karte statt darunter Platz zu halten. Unter lg wie sonst.
   */
  kompakt?: boolean;
  texte: AromaTexte;
};

const DAUER_MS = 900;
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
/** Deckkraft der Geister (T5): blass, ein überfahrener Geist tritt hervor, bleibt aber grau. */
const GEIST_DECKKRAFT = { blass: 0.22, fokus: 0.7 } as const;
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
  titel: titelRoh,
  ohneTitel = false,
  hervorheben = null,
  staerken,
  ebenen,
  regler,
  bezug = "serie",
  lernen,
  kompakt = false,
  texte,
}: Props) {
  const titel = titelRoh ?? texte.aroma.karte.titel;
  const sprache = texte.sprache;
  const kt = texte.aroma.karte;
  const skalaTitel = `${texte.aroma.erkundung.intensitaet}: ${text(texte.aroma.sweetSpot.ueberschrift, { marke: texte.aroma.sweetSpot.marke })}`;
  const WERT = { format: (wert: number) => formatiereZahl(wert, 1, sprache) };
  const achsenName = (index: number) => texte.geschmack[GESCHMACKS_ACHSEN[index].enumWert];
  const satz = (name: string) => (texte.aroma.satz as Record<string, string>)[name.trim().toLowerCase()] ?? null;
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
      setBreite(Math.max(MIN_BREITE, Math.round(gemessen)));
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
  // Karte v2 (T5b, Nutzer 2026-09-29): bewegt wird nur die angezeigte Bewertung, die lila
  // Serie (in der Maske die eigenen Regler). Ihr Balken misst sich am Bezug: in der Maske
  // am Community-Median (Ring), in der Anzeige an der grünen Serie (Soll-Strich).
  const bewertung = serien.find((serie) => serie.ton === "lila") ?? null;
  const bewertungZiel = roheSerien.find((serie) => serie.ton === "lila") ?? null;
  const sollSerie = bezug === "serie" ? (serien.find((serie) => serie.ton === "gruen") ?? null) : null;
  const bezugMatrix = bezug === "median" ? (regler?.vergleich ?? null) : (sollSerie?.matrix ?? null);
  /** Wert der Bewertung auf einer Achse (gleitend), 0 ohne Bewertung. */
  const wertAuf = (achse: number) => bewertung?.matrix[GESCHMACKS_ACHSEN[achse].key] ?? 0;
  const vergleich = (achse: number) => balkenVergleich(wertAuf(achse), bezugMatrix?.[GESCHMACKS_ACHSEN[achse].key]);
  /** Farbig ist nur, was gerade aktiv ist: die hervorgehobene Achse, sonst jede Achse mit Wert. */
  const achseFarbig = (index: number) => (aktiv === null ? wertAuf(index) > SPUERBAR : aktiv === index);
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
  const ebeneVon = (name: string): TerpenEbene => (ebenen ? (ebenen[name] ?? "geist") : "hersteller");
  const alleEbenen = Object.fromEntries(terpene.map((terpen) => [terpen.name, ebeneVon(terpen.name)]));
  // Streifen allein aus der Herstellerangabe: eigene Stufen verändern ihn nie (T5b).
  const angegebene = terpene.filter((terpen) => ebeneVon(terpen.name) === "hersteller");
  const kraft = herstellerKraft(angegebene);
  // Gewählte Richtung: nur Terpene der Sorte (Hersteller, ergänzt) leuchten, Geister bleiben blass (T5).
  const leuchtend = new Set(aktiv === null ? [] : leuchtendeTerpene(aktiv, terpene, alleEbenen));
  /** Terpen ist betont: selbst überfahren oder als Terpen der Sorte Träger der überfahrenen Achse. */
  const terpenBetont = (name: string) => terpenAktiv === name || leuchtend.has(name);
  /** Begleitstoffe sind keine Terpene und haben keine Ebene: sie folgen der Achse wie bisher. */
  const begleitBetont = (name: string) =>
    terpenAktiv === name || (aktiv !== null && (traeger.get(name) ?? []).some((b) => b.achse === aktiv));
  const vorhandeneEbenen = new Set(Object.values(alleEbenen));
  /** Hinweis im Infotext eines Terpens außerhalb der Herstellerangabe (Begleitstoffe haben keinen). */
  const ebenenHinweis = (name: string) => {
    if (BEGLEITSTOFFE.some((stoff) => stoff.name === name)) return undefined;
    const ebene = ebeneVon(name);
    return ebene === "geist" ? kt.geistHinweis : ebene === "ergaenzt" ? kt.ergaenztHinweis : undefined;
  };
  const etwasUeberfahren = aktiv !== null || terpenAktiv !== null;

  // Vor der ersten Messung wie früher im Maßstab 640 (dann per max-w-3xl
  // dargestellt); danach die gemessene viewBox-Breite. Das Netz (RADIUS)
  // bleibt bei jeder Breite gleich groß, nur sein Mittelpunkt wandert mit.
  const aktBreite = breite ?? BREITE;
  const mitte = mitteVon(aktBreite);
  const radius = radiusVon(aktBreite);
  const schmal = aktBreite < BREITE;
  const karte = achsenImKarte(aktBreite);
  const balken = balkenLaenge(aktBreite);
  const knoten = karte.map((punkt, index) => mische(punkt, netzPunkt(index, MAX, radius + 34, mitte), t));
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
  const kartenSichtbar = 1 - t;

  // Ein Balken je Achse (T5b), mittig auf der Spur; die Netzpunkte wie bisher.
  const serienPunkte = serien.map((serie) =>
    GESCHMACKS_ACHSEN.map((achse, index) =>
      mische(
        balkenEnde(karte[index], serie.matrix[achse.key], 0, balken),
        netzPunkt(index, serie.matrix[achse.key], radius, mitte),
        t,
      ),
    ),
  );

  const aktiveAchse = aktiv === null ? null : GESCHMACKS_ACHSEN[aktiv];
  // Fokusring der Tastatur: am Griff in der Karte, am Wert im Netz, folgt dem Morph.
  const fokusPunkt =
    regler && tastatur !== null
      ? mische(
          balkenEnde(karte[tastatur], regler.werte[GESCHMACKS_ACHSEN[tastatur].key], 0, balken),
          netzPunkt(tastatur, regler.werte[GESCHMACKS_ACHSEN[tastatur].key], radius, mitte),
          t,
        )
      : null;

  return (
    <figure aria-label={titel} className={cn("flex flex-col gap-6", kompakt && "lg:relative lg:gap-4")}>
      {/* Kopf der Karte: links der Name in Logoschrift mit Verlauf und, mit Reglern, die Skala;
          rechts Ansicht und Legende. */}
      <div className={cn("flex flex-wrap items-start gap-8", ohneTitel && !regler ? "justify-end" : "justify-between")}>
      {ohneTitel ? null : (
        <p className={cn("farbverlauf font-hand text-erzaehlung text-balance wrap-break-word leading-[0.9]", kompakt && "lg:hidden")}>{titel}</p>
      )}
      {/* Skala links (T5): was die Regler messen, und was der grüne Ring ist. Ohne Median steht
          statt des Rings der Hinweis, nie eine 0 (Review Focus 1). */}
      {regler ? (
        <div className="flex flex-col gap-2">
          <p className="text-caption font-medium uppercase tracking-wide text-text-muted">{skalaTitel}</p>
          {regler.vergleich ? (
            <p className="inline-flex items-center gap-2 text-small text-text">
              <span aria-hidden="true" className="inline-block size-4 rounded-full border-2 border-accent" />
              {kt.median}
            </p>
          ) : (
            <p className="text-small text-text-muted">{kt.keinMedian}</p>
          )}
        </div>
      ) : null}
      <div className={cn("flex flex-col items-end gap-6", kompakt && "lg:flex-row lg:flex-wrap lg:items-center lg:justify-end lg:gap-4")}>
      <div className="flex flex-wrap items-center justify-end gap-4">
        {/* Ansichts-Schalter als Radiogroup (APG): ein Tabstopp, Pfeiltasten wählen.
            Druck-Rückmeldung per scale 0.97, nur ohne reduzierte Bewegung. */}
        <div role="radiogroup" aria-label={kt.ansicht} className="inline-flex rounded-full border border-border-strong p-1">
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
                "inline-flex h-9 items-center rounded-full px-4 text-small font-medium pointer-coarse:h-11",
                "transition-[color,background-color,scale] duration-[var(--duration-fast),var(--duration-fast),120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:active:scale-[0.97]",
                ansicht === wahl ? "bg-accent text-accent-fg" : "text-text hover:text-accent-hover",
              )}
            >
              {wahl === "karte" ? kt.karte : kt.netz}
            </button>
          ))}
        </div>
      </div>


      {/* Legende: im Netz die Serien wie bisher. In der Karte (T5b) der Balken der Bewertung
          (grün bis zum Bezug, lila darüber), der Soll-Strich der grünen Serie und der stille
          Streifen der Herstellerangabe; der Ring des Community-Medians steht links bei der Skala. */}
      <ul className="flex flex-wrap justify-end gap-x-6 gap-y-2 text-small text-text">
        {ansicht === "netz" ? (
          serien.map((serie) => (
            <li key={serie.name} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="inline-block size-3 rounded-full" style={{ background: FARBE[serie.ton] }} />
              {serie.name}
            </li>
          ))
        ) : (
          <>
            {bewertung ? (
              <li className="inline-flex items-center gap-2">
                <LegendenMuster art={bezugMatrix ? "balken" : "balkenLila"} />
                {bewertung.name}
              </li>
            ) : null}
            {sollSerie ? (
              <li className="inline-flex items-center gap-2">
                <LegendenMuster art="soll" />
                {sollSerie.name}
              </li>
            ) : null}
            {angegebene.length > 0 ? (
              <li className="inline-flex items-center gap-2">
                <LegendenMuster art="streifen" />
                {kt.streifen}
              </li>
            ) : null}
          </>
        )}
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
                points={alsPolygon(GESCHMACKS_ACHSEN.map((_, index) => netzPunkt(index, ring, radius, mitte)))}
                fill="none"
                stroke="currentColor"
              />
            ))}
            {GESCHMACKS_ACHSEN.map((achse, index) => {
              const ende = netzPunkt(index, MAX, radius, mitte);
              return <line key={achse.key} x1={mitte.x} y1={mitte.y} x2={ende.x} y2={ende.y} stroke="currentColor" />;
            })}
          </g>

          {/* Bögen Achse zu Terpen, nur in der Karte. */}
          <g opacity={kartenSichtbar}>
            {terpene.flatMap((terpen, index) =>
              terpenBoegen(terpen).map(({ achse, anteil: notenAnteil }) => {
                // Karte v2 (T5b, Nutzer 2026-09-29): hinten liegt die Herstellerangabe als stiller,
                // breiter, blasser Streifen in der Geschmacksfarbe. Erst wenn die Bewertung auf der
                // Achse einen Wert hat, liegt darüber eine dünnere bunte Linie mit Lichtfluss: wenig
                // Wert dünn und langsam, viel Wert dick und schnell. So sieht man, wo die Bewertung
                // über oder unter der Herstellerangabe liegt. Ergänzte Terpene (T5) haben keinen
                // Streifen, ihre Linie ist gestrichelt in Kopierstift; Geister bleiben grau.
                const imFokus = terpenAktiv === terpen.name;
                const gedimmt = terpenAktiv !== null && !imFokus;
                const imBlick = aktiv === null || aktiv === achse;
                const ebene = ebeneVon(terpen.name);
                const wert = wertAuf(achse);
                const schicht = bogenSchicht({ ebene, wert, imBlick, imFokus });
                const geschmack = GESCHMACKS_ACHSEN[achse].enumWert;
                const farbe = LINIEN_FARBE[geschmack] ?? `url(#${spurId}-${geschmack})`;
                const linienFarbe = ebene === "ergaenzt" ? FARBE.lila : farbe;
                const pfad = bogen(knoten[achse], terpenKnoten[index]);
                const band = streifen(kraft[terpen.name] ?? 0, notenAnteil);
                const breite = linienBreite(wert, notenAnteil);
                // Tempo aus dem Zielwert, nicht aus dem gleitenden: sonst wechselte die Dauer
                // in jedem Frame des Gleitens und der Lichtpunkt spränge.
                const dauer = flussDauer(bewertungZiel?.matrix[GESCHMACKS_ACHSEN[achse].key] ?? 0);
                // Versatz je Bogen als Anteil der Dauer, damit die Lichtpunkte nicht im Gleichschritt laufen.
                const versatz = `${-(((index * 0.37 + achse * 0.13) % 1) * dauer).toFixed(2)}s`;
                return (
                  <Fragment key={`${terpen.name}-${achse}`}>
                    {schicht.streifen ? (
                      <path
                        data-schicht="streifen"
                        d={pfad}
                        fill="none"
                        stroke={farbe}
                        strokeLinecap="round"
                        // Überfahrenes Terpen tritt hervor, eine andere gewählte Richtung tritt zurück.
                        opacity={band.deckkraft * (imFokus ? 1.5 : 1) * (gedimmt || !imBlick ? 0.4 : 1)}
                        style={{ strokeWidth: band.breite }}
                        className="transition-opacity duration-normal"
                      />
                    ) : null}
                    {schicht.geist ? (
                      <path
                        d={pfad}
                        fill="none"
                        stroke={schicht.geist === "fokus" ? "var(--color-text-muted)" : GRAU}
                        strokeLinecap="round"
                        opacity={GEIST_DECKKRAFT[schicht.geist] * (gedimmt ? 0.2 : 1)}
                        style={{ strokeWidth: schicht.geist === "fokus" ? 1.5 : 0.8 }}
                        className="transition-[opacity,stroke] duration-normal"
                      />
                    ) : null}
                    {schicht.linie ? (
                      <path
                        data-schicht="linie"
                        d={pfad}
                        fill="none"
                        stroke={linienFarbe}
                        strokeLinecap="round"
                        strokeDasharray={ebene === "ergaenzt" ? "6 5" : undefined}
                        opacity={gedimmt ? 0.2 : 0.95}
                        style={{ strokeWidth: ebene === "ergaenzt" ? Math.max(1.5, breite) : breite }}
                        className="transition-opacity duration-normal"
                      />
                    ) : null}
                    {/* Lichtfluss vom Geschmack zum Terpen (globals.css .bogen-fluss): nur auf der
                        Linie, Tempo aus --fluss-dauer. Im Netz (t = 1) unsichtbar, dann läuft er
                        nicht endlos weiter. Sparmodus und reduzierte Bewegung: aus. */}
                    {schicht.linie && !gedimmt && t < 1 ? (
                      <path
                        d={pfad}
                        pathLength={100}
                        fill="none"
                        stroke={linienFarbe}
                        strokeLinecap="round"
                        strokeDasharray="6 194"
                        className="bogen-fluss"
                        style={
                          {
                            strokeWidth: breite + 2.5,
                            opacity: 0.85,
                            animationDelay: versatz,
                            "--fluss-dauer": `${dauer}s`,
                          } as React.CSSProperties
                        }
                      />
                    ) : null}
                  </Fragment>
                );
              }),
            )}
            {/* Begleitstoffe gepunktet in neutraler Farbe: sie sind keine Terpene. */}
            {begleiter.flatMap((stoff, index) =>
              stoff.boegen.map(({ achse, anteil }) => {
                const imFokus = terpenAktiv === stoff.name;
                const spuerbar = imFokus || wertAuf(achse) > SPUERBAR;
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
                r={begleitBetont(begleiter[index].name) ? 7 : 5}
                fill="none"
                stroke={begleitBetont(begleiter[index].name) ? "currentColor" : GRAU}
                strokeWidth={1.5}
              />
            ))}
            {/* Knoten wachsen wie die Punkte der Geschmacksachsen, wenn ihr Terpen betont ist.
                Ebenen (T5): Herstellerangabe gefüllt, ergänzt mit gestrichelter Kontur in
                Kopierstift, Geister klein und grau; so trägt auch die Form die Ebene, nicht nur die Farbe. */}
            {terpenKnoten.map((punkt, index) => {
              const name = terpene[index].name;
              const betont = terpenBetont(name);
              const ebene = ebeneVon(name);
              if (ebene === "ergaenzt") {
                return (
                  <circle
                    key={name}
                    cx={punkt.x}
                    cy={punkt.y}
                    r={betont ? 8 : 6}
                    fill="var(--color-surface)"
                    stroke={FARBE.lila}
                    strokeWidth={2}
                    strokeDasharray="3 2.5"
                  />
                );
              }
              if (ebene === "geist") {
                return <circle key={name} cx={punkt.x} cy={punkt.y} r={betont ? 6 : 4} fill={betont ? "currentColor" : GRAU} />;
              }
              return (
                <circle
                  key={name}
                  cx={punkt.x}
                  cy={punkt.y}
                  r={betont ? 8 : 6}
                  fill={(staerke[name] ?? 0) > 0 || betont ? "currentColor" : GRAU}
                />
              );
            })}
          </g>

          {/* Spur der Regler im Sweet-Spot-Stil, unter den Balken (T5b): beim Ziehen wird die
              Spur kräftiger, der grüne oder lila Balken bleibt darüber lesbar. */}
          {regler && kartenSichtbar > 0.5
            ? karte.map((knoten, index) => {
                const links = balkenEnde(knoten, MAX, 0, balken).x;
                const rechts = balkenEnde(knoten, 0, 0, balken).x;
                return (
                  <rect
                    key={`s-${GESCHMACKS_ACHSEN[index].key}`}
                    x={links - 4}
                    y={knoten.y - 5}
                    width={rechts - links + 8}
                    height={10}
                    rx={5}
                    fill={`url(#${spurId})`}
                    opacity={(aktiv === index ? 0.9 : 0.35) * kartenSichtbar}
                    className="transition-opacity duration-fast"
                  />
                );
              })
            : null}

          {/* Serien: im Netz Flächen wie bisher. In der Karte nur der Balken der Bewertung
              (T5b, Nutzer 2026-09-29): grün auf oder unter dem Bezug, lila darüber. */}
          {serien.map((serie, s) => {
            const istBewertung = serie === bewertung;
            const wert = (index: number) => serie.matrix[GESCHMACKS_ACHSEN[index].key];
            return (
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
                {istBewertung
                  ? serienPunkte[s].map((punkt, index) => (
                      <line
                        key={GESCHMACKS_ACHSEN[index].key}
                        data-schicht="balken"
                        x1={mische({ x: karte[index].x - 16, y: karte[index].y }, punkt, t).x}
                        y1={punkt.y}
                        x2={punkt.x}
                        y2={punkt.y}
                        stroke={achseFarbig(index) ? FARBE[vergleich(index).ton] : GRAU}
                        strokeWidth={achseBetont(index) ? 6 : 4}
                        strokeLinecap="round"
                        opacity={(wert(index) > SPUERBAR ? kartenSichtbar : 0) * (achseFarbig(index) ? 1 : 0.6)}
                      />
                    ))
                  : null}
                {/* Endpunkte: in der Karte nur die der Bewertung, im Netz die Ecken jeder Fläche. */}
                {serienPunkte[s].map((punkt, index) => (
                  <circle
                    key={`p-${GESCHMACKS_ACHSEN[index].key}`}
                    cx={punkt.x}
                    cy={punkt.y}
                    r={achseBetont(index) ? 6 : 4}
                    fill={t > 0.5 ? FARBE[serie.ton] : achseFarbig(index) ? FARBE[vergleich(index).ton] : GRAU}
                    opacity={istBewertung && wert(index) > SPUERBAR ? 1 : t}
                  />
                ))}
              </g>
            );
          })}

          {/* Delta je Achse (Nutzer 2026-09-26, seit T5b gegen den Bezug): darüber pulsiert der
              lila Überstand vom Bezug bis zum Balkenende, darunter das grüne Fehlstück vom
              Balkenende bis zum Bezug (globals.css, .delta-puls). Gleichauf oder ohne Bezug nichts. */}
          {bewertung && kartenSichtbar > 0.5
            ? GESCHMACKS_ACHSEN.map((achse, index) => {
                const { ton, puls } = vergleich(index);
                if (!puls) return null;
                const y = karte[index].y;
                return (
                  <line
                    key={`delta-${achse.key}`}
                    className="delta-puls"
                    data-delta={puls.art}
                    x1={balkenEnde(karte[index], puls.von, 0, balken).x}
                    y1={y}
                    x2={balkenEnde(karte[index], puls.bis, 0, balken).x}
                    y2={y}
                    stroke={FARBE[ton]}
                    strokeLinecap="round"
                    style={{ opacity: kartenSichtbar }}
                  />
                );
              })
            : null}

          {/* Soll-Strich (T5b): in der Anzeige ist die grüne Serie der Bezug. Sie steht als
              ruhiger grüner Strich auf der Achse statt als eigener Balken, mit Saum in
              Papierfarbe wie der Ring. */}
          {sollSerie && kartenSichtbar > 0.5 ? (
            <g opacity={kartenSichtbar} pointerEvents="none">
              {karte.map((knoten, index) => {
                const x = balkenEnde(knoten, sollSerie.matrix[GESCHMACKS_ACHSEN[index].key], 0, balken).x;
                return (
                  <Fragment key={`soll-${GESCHMACKS_ACHSEN[index].key}`}>
                    <line x1={x} y1={knoten.y - 9} x2={x} y2={knoten.y + 9} stroke="var(--color-surface)" strokeWidth={6} strokeLinecap="round" />
                    <line
                      data-schicht="soll"
                      x1={x}
                      y1={knoten.y - 9}
                      x2={x}
                      y2={knoten.y + 9}
                      stroke={FARBE.gruen}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                  </Fragment>
                );
              })}
            </g>
          ) : null}

          {/* Regler: Ring am Community-Median, Griff am eigenen Wert, Trefferfläche. */}
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
                  // Halbe Schritte wie beim Speichern: leichter zu treffen (Nutzer 2026-09-25);
                  // der Median neben dem Raster bleibt treffbar (T5c).
                  return rasten(roh, { schritt: 0.5, max: MAX, ziel: regler.vergleich?.[key] });
                };
                return (
                  <g key={`r-${key}`} opacity={kartenSichtbar}>
                    {/* Grüner Ring: der Community-Median (T5). Ein Saum in Papierfarbe hebt ihn
                        von der grünen Spur und den Balken ab. */}
                    {ring !== null ? (
                      <>
                        <circle cx={ring} cy={knoten.y} r={11.5} fill="none" stroke="var(--color-surface)" strokeWidth={5} />
                        <circle cx={ring} cy={knoten.y} r={11.5} fill="none" stroke={FARBE.gruen} strokeWidth={2} />
                      </>
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
          {/* Werte am Punkt nur im Netz; in der Karte stehen sie in der Legende darunter, am
              Balkenende stießen sie an den Achsennamen der nächsten Zeile. */}
          {aktiv !== null && kartenSichtbar < 0.5
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
            {achsenName(index)}
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
                terpene.length > 6 || schmal ? "text-small" : "text-h3",
                (etwasUeberfahren ? terpenBetont(name) : (staerke[name] ?? 0) > 0) ? "text-text" : "text-text-muted",
              )}
              style={{
                left: `${(punkt.x / aktBreite) * 100}%`,
                top: `${(punkt.y / HOEHE) * 100}%`,
                opacity: kartenSichtbar,
                // Schmal: lange Namen (beta-Caryophyllen) brechen am Bindestrich um statt hinauszuragen.
                maxWidth: schmal ? `${aktBreite - punkt.x}px` : undefined,
                whiteSpace: schmal ? "normal" : undefined,
              }}
            >
              <TerpenIcon name={name} />
              {terpenAnzeige(name, sprache)}
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
              begleitBetont(begleiter[index].name) ? "text-text" : "text-text-muted",
            )}
            style={{ left: `${(punkt.x / aktBreite) * 100}%`, top: `${(punkt.y / HOEHE) * 100}%`, opacity: kartenSichtbar }}
          >
            {/* Hinweis in eigener Zeile, sonst ragt er über schmale Karten (Doppelseite) hinaus. */}
            <span className="inline-flex items-center gap-1.5 text-small italic">
              <TerpenIcon name={begleiter[index].name} />
              {terpenAnzeige(begleiter[index].name, sprache)}
            </span>
            {/* Unter 480 entfällt der Hinweis; die Legende sagt beim Antippen, dass es kein Terpen ist. */}
            {aktBreite >= 480 ? <span className="text-caption font-normal">{(texte.aroma.begleitHinweis as Record<string, string>)[begleiter[index].name] ?? begleiter[index].hinweis}</span> : null}
          </button>
        ))}
      </div>

      {/* Infotext unter der Karte (Nutzer 2026-09-26, 2026-09-27): zentriert wie eine Legende im Buch.
          Die Höhe ist fest reserviert, damit die Sektion beim Überfahren nicht springt; der Inhalt
          blendet beim Wechsel nur über (Deckkraft). */}
      <div
        aria-live="polite"
        className={cn(
          "grid min-h-80 justify-items-center sm:min-h-56",
          // Dicht: über dem unteren Rand der Karte, ohne eigene Höhe; nur die Tafel fängt Zeiger.
          kompakt &&
            "lg:pointer-events-none lg:absolute lg:inset-x-0 lg:bottom-0 lg:z-10 lg:min-h-0 lg:*:rounded-lg lg:*:border lg:*:border-border lg:*:bg-surface-raised lg:*:p-4 lg:*:shadow-md",
        )}
      >
        {aktiveAchse ? (
          <InfoTafel
            key={`achse-${aktiveAchse.key}`}
            art={kt.geschmacksrichtung}
            icon={<GeschmackIcon geschmack={aktiveAchse.enumWert} className={ICON_TITEL} />}
            titel={texte.geschmack[aktiveAchse.enumWert]}
            bezugTitel={lernen ? kt.stecktIn : undefined}
            bezug={lernen ? tragendeStoffe(aktiv!, lernen, ebenen ? ebeneVon : null).map(({ name, ebene }) => (
              <Pille key={name} ebene={ebene} icon={<TerpenIcon name={name} className={ICON_PILLE} />}>
                {terpenAnzeige(name, sprache)}
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
            art={BEGLEITSTOFFE.some((stoff) => stoff.name === terpenAktiv) ? kt.begleitstoff : kt.terpen}
            icon={<TerpenIcon name={terpenAktiv} className={ICON_TITEL} />}
            titel={terpenAnzeige(terpenAktiv, sprache)}
            hinweis={ebenenHinweis(terpenAktiv)}
            bezugTitel={kt.traegt}
            bezug={(traeger.get(terpenAktiv) ?? []).map(({ achse }) => (
              <Pille
                key={achse}
                icon={<GeschmackIcon geschmack={GESCHMACKS_ACHSEN[achse].enumWert} className={ICON_PILLE} />}
              >
                {achsenName(achse)}
              </Pille>
            ))}
          >
            {satz(terpenAktiv)}
          </InfoTafel>
        ) : (
          <div
            key="hinweis"
            // Dicht (Buch, ab lg): ohne Hinweis; die Doppelseite reicht keine Ebenen, die Legende fiele ohnehin weg.
            className={cn("flex flex-col items-center gap-6 pt-8 transition-opacity duration-normal ease-out starting:opacity-0", kompakt && "lg:hidden")}
          >
            <p className="max-w-md text-center font-buch text-body text-text-muted italic text-balance">
              {regler ? kt.hinweisRegler : kt.hinweisErkunden}
            </p>
            {/* Legende der Ebenen (T5), nur wenn es mehr gibt als die Herstellerangabe: Strich,
                Strichelung und Farbe wie die Bögen, damit die Ebene nicht nur an der Farbe hängt. */}
            {[...vorhandeneEbenen].some((ebene) => ebene !== "hersteller") ? (
              <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-caption text-text-muted">
                {EBENEN.filter((ebene) => vorhandeneEbenen.has(ebene)).map((ebene) => (
                  <li key={ebene} className="inline-flex items-center gap-2">
                    <EbenenMuster ebene={ebene} />
                    {kt.ebenen[ebene]}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      {regler ? (
        <fieldset className="sr-only">
          <legend>{kt.reglerLegende}</legend>
          {GESCHMACKS_ACHSEN.map((achse, index) => (
            <label key={achse.key}>
              {texte.geschmack[achse.enumWert]}
              <input
                type="range"
                min={0}
                max={MAX}
                // step="any" und eigene Pfeiltasten (T5c): der Median neben dem Raster bleibt erreichbar.
                step="any"
                value={regler.werte[achse.key]}
                aria-valuetext={text(texte.aroma.vonFuenf, { wert: WERT.format(regler.werte[achse.key]) })}
                onKeyDown={(e) => {
                  const neu = tasteZuWert(e.key, regler.werte[achse.key], {
                    schritt: 0.1,
                    max: MAX,
                    ziel: regler.vergleich?.[achse.key],
                  });
                  if (neu === null) return;
                  e.preventDefault();
                  regler.aendern(achse.key, neu);
                }}
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
        <caption>{text(kt.tabelle, { titel })}</caption>
        <thead>
          <tr>
            <th scope="col">{kt.geschmack}</th>
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
              <th scope="row">{texte.geschmack[achse.enumWert]}</th>
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
  hinweis,
  bezugTitel,
  bezug,
  children,
}: {
  art: string;
  icon: React.ReactNode;
  titel: string;
  /** Zusatz unter dem Namen, etwa „laut Hersteller nicht enthalten“ (T5). */
  hinweis?: string;
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
      {hinweis ? <p className="text-caption text-text-muted text-pretty">{hinweis}</p> : null}
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

/**
 * Eine Verbindung als ruhige Pille: Icon abgesetzt links, Name rechts. Terpene
 * tragen ihre Ebene wie die Bögen (T5): ergänzt gestrichelt in Kopierstift,
 * Geister gedämpft.
 */
function Pille({ icon, ebene, children }: { icon: React.ReactNode; ebene?: TerpenEbene; children: React.ReactNode }) {
  return (
    <li
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border px-4 text-caption",
        ebene === "ergaenzt"
          ? "border-dashed border-kopierstift text-text"
          : ebene === "geist"
            ? "border-border text-text-muted"
            : "border-border text-text",
      )}
    >
      <span aria-hidden="true" className="flex">
        {icon}
      </span>
      {children}
    </li>
  );
}

/**
 * Lerneffekt: Terpene und Begleitstoffe, die spürbar auf diese Richtung einzahlen (Anteil ab 20 %).
 * Mit Ebenen (T5) stehen die Terpene der Sorte vorn, die Geister danach; Begleitstoffe ohne Ebene.
 */
function tragendeStoffe(
  achse: number,
  lernen: NonNullable<Props["lernen"]>,
  ebeneVon: ((name: string) => TerpenEbene) | null,
): { name: string; ebene?: TerpenEbene }[] {
  const RANG: Record<TerpenEbene, number> = { hersteller: 0, ergaenzt: 1, geist: 2 };
  const terpene = lernen
    .filter((terpen) =>
      terpenBoegen({ ...terpen, konzentrationProzent: null, rang: 99 }).some((b) => b.achse === achse && b.anteil >= 0.2),
    )
    .map((terpen) => ({ name: terpen.name, ebene: ebeneVon?.(terpen.name) }))
    .sort((a, b) => (a.ebene && b.ebene ? RANG[a.ebene] - RANG[b.ebene] : 0));
  const stoffe = BEGLEITSTOFFE.filter((stoff) =>
    begleitBoegen(stoff.noten).some((b) => b.achse === achse && b.anteil >= 0.2),
  ).map((stoff) => ({ name: stoff.name }));
  return [...terpene, ...stoffe];
}

/** Reihenfolge der Ebenen in der Legende. */
const EBENEN: readonly TerpenEbene[] = ["hersteller", "ergaenzt", "geist"];

/** Strichmuster einer Ebene in der Legende, wie die Bögen gezeichnet (Herstellerangabe seit T5b als Streifen). */
function EbenenMuster({ ebene }: { ebene: TerpenEbene }) {
  if (ebene === "hersteller") return <LegendenMuster art="streifen" />;
  return (
    <svg aria-hidden="true" viewBox="0 0 24 8" className="h-2 w-6 shrink-0 overflow-visible text-text">
      <line
        x1={2}
        y1={4}
        x2={22}
        y2={4}
        strokeLinecap="round"
        stroke={ebene === "ergaenzt" ? FARBE.lila : GRAU}
        strokeWidth={ebene === "ergaenzt" ? 2 : 1}
        strokeDasharray={ebene === "ergaenzt" ? "4 3" : undefined}
      />
    </svg>
  );
}

/**
 * Muster in der Legende der Karte (T5b): der Balken der Bewertung halb grün, halb lila
 * (grün bis zum Bezug, lila darüber; ohne Bezug nur lila), der grüne Soll-Strich und der
 * breite, blasse Streifen der Herstellerangabe. Form und Farbe wie in der Karte.
 */
function LegendenMuster({ art }: { art: "balken" | "balkenLila" | "soll" | "streifen" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 8" className="h-2 w-6 shrink-0 overflow-visible text-text">
      {art === "streifen" ? (
        <line x1={4} y1={4} x2={20} y2={4} stroke="currentColor" strokeOpacity={0.25} strokeWidth={8} strokeLinecap="round" />
      ) : art === "soll" ? (
        <line x1={12} y1={-1} x2={12} y2={9} stroke={FARBE.gruen} strokeWidth={2.5} strokeLinecap="round" />
      ) : art === "balken" ? (
        <>
          <line x1={2} y1={4} x2={12} y2={4} stroke={FARBE.gruen} strokeWidth={4} strokeLinecap="round" />
          <line x1={12} y1={4} x2={22} y2={4} stroke={FARBE.lila} strokeWidth={4} strokeLinecap="round" />
        </>
      ) : (
        <line x1={2} y1={4} x2={22} y2={4} stroke={FARBE.lila} strokeWidth={4} strokeLinecap="round" />
      )}
    </svg>
  );
}
