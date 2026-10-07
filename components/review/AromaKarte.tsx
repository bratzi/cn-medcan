"use client";

import { createContext, Fragment, useContext, useEffect, useId, useRef, useState } from "react";

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
  flussStrich,
  herstellerKraft,
  imSweetSpot,
  leuchtendeTerpene,
  linienBreite,
  MIN_BREITE,
  radiusVon,
  sanft,
  SPUERBAR,
  streifen,
  SWEET_SPOT_FUNKEN,
  sweetSpotStaerke,
  sweetSpotZone,
  terpenBoegen,
  terpeneImKarte,
  terpenStaerken,
  type KartenTerpen,
  type Punkt,
  type TerpenEbene,
} from "@/lib/aromakarte";
import { QUALITAET_MITTE } from "@/lib/bewertung-v2";
import { cn } from "@/lib/cn";
import { LINIEN_FARBE, VERLAUF } from "@/lib/aroma-farben";
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
   * Geschmacksrichtung direkt in der Karte (0 bis 5 als Sweet-Spot-Skala, Nutzer
   * 2026-09-30: 0 zu wenig, 2,5 genau richtig, 5 zu viel). `vergleich` ist der
   * Community-Median (T5, zuvor die Herstellerangabe): ein grüner Ring, an dem
   * der Griff einrastet. Ohne Median kein Ring, dafür ein Hinweis.
   */
  regler?: {
    werte: GeschmacksMatrix;
    vergleich?: GeschmacksMatrix;
    aendern: (key: keyof GeschmacksMatrix, wert: number) => void;
  };
  /**
   * Terpene an- und abschalten (Nutzer 2026-10-03, vorher Stärkeregler 0 bis 5: zu komplex).
   * `an` sind die aktiven Terpene, `anteil` je Terpen der Anteil der Bewertenden, die es
   * aktiviert haben (der grüne Ring), `pulsierend` die Kandidaten, unter denen der Nutzer
   * gerade wählen soll. Begleitstoffe sind keine Terpene und bekommen keinen Schalter.
   */
  terpenSchalter?: {
    an: ReadonlySet<string>;
    anteil?: Readonly<Record<string, number>>;
    pulsierend?: ReadonlySet<string>;
    umschalten: (terpen: string) => void;
  };
  /** Alle bekannten Terpene: zeigt zur aktiven Geschmacksrichtung, welche Terpene sie tragen. */
  lernen?: readonly { name: string; geschmack: KartenTerpen["geschmack"] }[];
  /**
   * Dicht für die Buchseite ab lg (T7b, Nutzer 2026-09-30): ohne Titel, oben
   * `kopf` und Ansicht in einer Zeile, darunter die Legende; die Karte füllt
   * die restliche Höhe der Seite (gemessen, Achsen rücken zusammen, Schrift
   * bleibt gleich groß); die Tafel beim Überfahren liegt über dem unteren Rand
   * der Karte statt darunter Platz zu halten. Unter lg wie sonst.
   */
  kompakt?: boolean;
  /** Dicht: steht links in der Kopfzeile (die Reiterleiste des Buchs, T7b). */
  kopf?: React.ReactNode;
  texte: AromaTexte;
};

const DAUER_MS = 900;
/** Ab lg liegen die Seiten des Buchs nebeneinander (Buch.tsx). */
const NEBENEINANDER = "(min-width: 64rem)";
/** Niedrigste dichte Karte: zehn Achsen im Abstand von rund 29 px, Name über dem Balken. */
const MIN_HOEHE = 360;
const FARBE = { gruen: "var(--color-accent)", lila: "var(--color-kopierstift)" } as const;
const GRAU = "var(--color-border-strong)";

// Farben je Geschmacksrichtung: lib/aroma-farben.ts (gemeinsam mit dem Startseiten-Register, T17).
/** Deckkraft der Geister (T5): blass, ein überfahrener Geist tritt hervor, bleibt aber grau. */
const GEIST_DECKKRAFT = { blass: 0.22, fokus: 0.7 } as const;
const RINGE = [1, 2, 3, 4, 5] as const;
const SKALA = [0, 1, 2, 3, 4, 5] as const;
/**
 * Ab dieser Balkenlänge stehen „zu viel“, „Sweet Spot“ und „zu wenig“ nebeneinander über den
 * Balken (je rund 30 bis 50 px breit bei 11 px); darunter (Handy) rücken die zwei Ränder unter die
 * letzte Achse, damit sich nichts überlappt.
 */
const SKALA_EINZEILIG = 160;
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
/**
 * Karte sofort zeichnen statt erst nach dem Hydrieren. Nur für Tests, die das
 * vollständige SVG im Server-HTML prüfen; die App lässt den Standard (false).
 */
export const KarteSofortKontext = createContext(false);

export function AromaKarte({
  terpene: ungeordnet,
  serien: roheSerien,
  titel: titelRoh,
  ohneTitel = false,
  hervorheben = null,
  staerken,
  ebenen,
  regler,
  terpenSchalter,
  lernen,
  kompakt = false,
  kopf,
  texte,
}: Props) {
  const titel = titelRoh ?? texte.aroma.karte.titel;
  const sprache = texte.sprache;
  const kt = texte.aroma.karte;
  const skalaTitel = kt.sweetSkala.titel;
  const WERT = { format: (wert: number) => formatiereZahl(wert, 1, sprache) };
  /** Vorlesetext eines Geschmacksreglers: Zone der Sweet-Spot-Skala vorn, dann „x von 5“. */
  const reglerText = (wert: number) =>
    `${kt.sweetSkala[sweetSpotZone(wert)]}, ${text(texte.aroma.vonFuenf, { wert: WERT.format(wert) })}`;
  const achsenName = (index: number) => texte.geschmack[GESCHMACKS_ACHSEN[index].enumWert];
  const satz = (name: string) => (texte.aroma.satz as Record<string, string>)[name.trim().toLowerCase()] ?? null;
  const terpene = ungeordnet;
  // Karte erst nach dem Hydrieren (CPU-Limit der Startseite, Fehler 1102): Server und erster
  // Client-Render tragen nur das leere SVG mit derselben viewBox als Platzhalter fester Höhe,
  // ohne Bögen, Balken und Beschriftungen. Tabelle und Regler (sr-only) bleiben im Server-HTML.
  const [montiert, setMontiert] = useState(useContext(KarteSofortKontext));
  useEffect(() => setMontiert(true), []);
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
  // Dicht im Buch ab lg (T7b, Nutzer 2026-09-30): die Höhe gibt die feste Seite vor
  // (Fläche flex-1, SVG absolut darin); sie wird gemessen und ergibt die viewBox-Höhe,
  // die Karte rückt also enger zusammen, statt verkleinert zu werden. Schrift bleibt groß.
  const [hoehe, setHoehe] = useState<number | null>(null);

  useEffect(() => {
    const element = messRef.current;
    if (!element) return;
    const beobachter = new ResizeObserver((eintraege) => {
      const rahmen = eintraege[0]?.contentRect;
      if (!rahmen?.width) return;
      setBreite(Math.max(MIN_BREITE, Math.round(rahmen.width)));
      const dicht = kompakt && window.matchMedia(NEBENEINANDER).matches && rahmen.height > 0;
      setHoehe(dicht ? Math.max(MIN_HOEHE, Math.round(rahmen.height)) : null);
    });
    beobachter.observe(element);
    return () => beobachter.disconnect();
  }, [kompakt]);

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
  // Bezug des Balkens ist seit 2026-10-03 immer der Community-Median (Nutzer): der grüne Ring
  // am Regler. Vorher stand in der Anzeige die grüne Herstellerserie als Soll-Strich auf der
  // Achse. Sie ist weggefallen, weil der Betreiber die Geschmacksintensität der
  // Herstellerangaben nicht kennt und jede Darstellung davon erfunden wäre.
  const bezugMatrix = regler?.vergleich ?? null;
  /** Wert der Bewertung auf einer Achse (gleitend), 0 ohne Bewertung. */
  const wertAuf = (achse: number) => bewertung?.matrix[GESCHMACKS_ACHSEN[achse].key] ?? 0;
  const vergleich = (achse: number) => balkenVergleich(wertAuf(achse), bezugMatrix?.[GESCHMACKS_ACHSEN[achse].key]);
  /** Farbig ist nur, was gerade aktiv ist: die hervorgehobene Achse, sonst jede Achse mit Wert. */
  /**
   * Farbig ist nur, was gerade aktiv ist: die hervorgehobene Achse, sonst jede Achse mit einem
   * Wert über 0. Seit 2026-10-03 ist das die ausdrückliche Funktionsweise der Karte (Nutzer):
   * sobald ein Regler über Null geht, ist der Geschmack aktiv und sichtbar, auch wenn der
   * Hersteller ihn nicht nennt. Vorher musste der Wert erst die Spürbarkeitsschwelle nehmen.
   */
  const achseFarbig = (index: number) => (aktiv === null ? wertAuf(index) > 0 : aktiv === index);
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
  // Höhe ohne Terpen-Regler: daraus Achsenabstand und Netzradius.
  const grundHoehe = hoehe ?? HOEHE;
  // Rechte Spalte: Terpene und Begleitstoffe (Ester, Thiole; keine Terpene) gemeinsam nach
  // dem Mittel ihrer Achsen geordnet, damit sich die Bögen wenig kreuzen (Nutzer 2026-09-26).
  const begleiter = BEGLEITSTOFFE.map((stoff) => ({ ...stoff, boegen: begleitBoegen(stoff.noten) })).filter(
    (stoff) => stoff.boegen.length > 0,
  );
  const reihe = [
    ...terpene.map((terpen, index) => ({ schluessel: `t-${index}`, lage: achsenLage(terpenBoegen(terpen)), name: terpen.name })),
    ...begleiter.map((stoff, index) => ({ schluessel: `b-${index}`, lage: achsenLage(stoff.boegen), name: stoff.name })),
  ].sort((a, b) => a.lage - b.lage || a.name.localeCompare(b.name, "de"));
  // Seit dem Wegfall der Terpen-Stärkeregler (Nutzer 2026-10-03) braucht die rechte Spalte
  // keine zusätzliche Höhe mehr: ein Terpen ist an oder aus, dafür reicht sein Name als
  // Schalter. Die Karte hat damit wieder ihre Grundhöhe.
  const aktHoehe = grundHoehe;
  const mitte = mitteVon(aktBreite, aktHoehe);
  const radius = radiusVon(aktBreite, grundHoehe);
  const schmal = aktBreite < BREITE;
  const karte = achsenImKarte(aktBreite, grundHoehe);
  const balken = balkenLaenge(aktBreite);
  // Skala über den Balken: über der Beschriftung der ersten Achse (die seit 2026-09-27 über ihrem
  // Balken steht), die Linien reichen bis knapp unter die letzte Achse.
  const skalaY = karte[0].y - 34;
  const skalaUnten = karte[karte.length - 1].y + 10;
  const skalaMitteX = balkenEnde(karte[0], QUALITAET_MITTE, 0, balken).x;
  const knoten = karte.map((punkt, index) => mische(punkt, netzPunkt(index, MAX, radius + 34, mitte), t));
  const spalte = terpeneImKarte(reihe.length, aktBreite, aktHoehe);
  const platz = new Map(reihe.map((eintrag, index) => [eintrag.schluessel, spalte[index]]));
  const terpenKnoten = terpene.map((_, index) => platz.get(`t-${index}`)!);
  const begleitKnoten = begleiter.map((_, index) => platz.get(`b-${index}`)!);
  // Terpene von oben nach unten wie in der Spalte: Reihenfolge der Regler für die Tastatur.
  const terpenFolge = terpene
    .map((terpen, index) => ({ name: terpen.name, index }))
    .sort((a, b) => terpenKnoten[a.index].y - terpenKnoten[b.index].y);
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
    <figure aria-label={titel} className={cn("relative flex flex-col gap-6", kompakt && "lg:min-h-0 lg:flex-1 lg:gap-4")}>
      {/* Kopf der Karte: links der Name in Logoschrift mit Verlauf und, mit Reglern, die Skala;
          rechts Ansicht und Legende. */}
      <div
        className={cn(
          "flex flex-wrap items-start gap-8",
          ohneTitel && !regler ? "justify-end" : "justify-between",
          // Dicht: Register des Buchs und Ansicht in einer Zeile, unten bündig: die Haarlinie des
          // Registers läuft bis an den Schalter und trägt ihn (2026-10-06). Die Legende entfällt ab lg.
          kompakt && "lg:items-end lg:gap-x-6 lg:gap-y-2",
        )}
      >
      {kopf}
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
      <div className={cn("flex flex-col items-end gap-6", kompakt && "lg:contents")}>
      <div className={cn("flex flex-wrap items-center justify-end gap-4", kompakt && "lg:order-3 lg:ml-auto")}>
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
          (grün bis zum Bezug, lila darüber) und der stille Streifen der Herstellerangabe; der
          Ring des Community-Medians steht links bei der Skala. Der Soll-Strich der grünen Serie
          ist am 2026-10-03 entfallen (Nutzer). */}
      <ul className={cn("flex flex-wrap justify-end gap-x-6 gap-y-2 text-small text-text", kompakt && "lg:hidden")}>
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
          </>
        )}
      </ul>
      </div>
      </div>

      <div
        ref={messRef}
        className={cn("relative w-full", breite === null && "mx-auto max-w-3xl", kompakt && "lg:min-h-90 lg:max-h-120 lg:flex-1")}
        onMouseLeave={() => {
          setAktiv(null);
          setTerpenAktiv(null);
        }}
      >
        <svg ref={svgRef} viewBox={`0 0 ${aktBreite} ${aktHoehe}`}
          aria-hidden="true"
          className={cn("block w-full text-text", kompakt && "lg:absolute lg:inset-0 lg:h-full")}>
          {montiert ? (
          <>
          <defs>
            {/* Sweet-Spot-Stil der Regler-Spur (Nutzer 2026-09-30): symmetrisch, an beiden Rändern
                (zu wenig rechts, zu viel links; Balken wachsen nach links) grau, in der Mitte Blattgrün. */}
            <linearGradient id={spurId} x1="1" x2="0" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--color-border)" />
              <stop offset="50%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="var(--color-border)" />
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
                // Achse einen Wert hat, liegt darüber eine dünnere bunte Linie mit Lichtfluss. Seit
                // der Sweet-Spot-Skala (Nutzer 2026-09-30) zählt die Nähe zur Mitte, nicht der
                // Wert: genau im Sweet Spot dick, schnell und durchgehend pulsierend, zu wenig wie
                // zu viel dünn und langsam. Ergänzte Terpene (T5) haben keinen Streifen, ihre
                // Linie ist gestrichelt in Kopierstift; Geister bleiben grau.
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
                const breite = linienBreite(sweetSpotStaerke(wert), notenAnteil);
                // Tempo aus dem Zielwert, nicht aus dem gleitenden: sonst wechselte die Dauer
                // in jedem Frame des Gleitens und der Lichtpunkt spränge.
                const zielWert = bewertungZiel?.matrix[GESCHMACKS_ACHSEN[achse].key] ?? 0;
                const zielStaerke = sweetSpotStaerke(zielWert);
                const dauer = flussDauer(zielStaerke);
                // Länge des Lichtstrichs (T5d) aus der Nähe zum Sweet Spot: am Rand kurz, zur Mitte
                // lang, genau in der Mitte durchgehend.
                const strich = flussStrich(zielStaerke);
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
                        Linie, Tempo aus --fluss-dauer, Strichlänge aus --fluss-strich (T5d); genau
                        im Sweet Spot pulsiert die ganze Linie (.bogen-voll). Im Netz (t = 1) unsichtbar,
                        dann läuft er nicht endlos weiter. Sparmodus und reduzierte Bewegung: aus. */}
                    {schicht.linie && !gedimmt && t < 1 ? (
                      <path
                        d={pfad}
                        pathLength={100}
                        fill="none"
                        stroke={linienFarbe}
                        strokeLinecap="round"
                        strokeDasharray={strich.durchgehend ? undefined : `${strich.laenge} ${200 - strich.laenge}`}
                        className={strich.durchgehend ? "bogen-voll" : "bogen-fluss"}
                        style={
                          {
                            strokeWidth: breite + 2.5,
                            opacity: 0.85,
                            animationDelay: versatz,
                            "--fluss-dauer": `${dauer}s`,
                            "--fluss-strich": strich.laenge,
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

          {/* Mitte der Sweet-Spot-Skala (Nutzer 2026-09-30): eine durchgezogene grüne Linie bei 2,5
              über alle Achsen, unter Balken und Griffen, damit sie keinen Griff durchstreicht. Die
              Beschriftung steht bei der Skala unten im SVG. */}
          <line
            data-skala="mitte"
            x1={skalaMitteX}
            y1={skalaY + 4}
            x2={skalaMitteX}
            y2={skalaUnten}
            stroke={FARBE.gruen}
            strokeOpacity={0.5}
            opacity={kartenSichtbar}
          />

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
              Balkenende bis zum Bezug (globals.css, .delta-puls). Gleichauf oder ohne Bezug nichts.
              Funken sprühen hier nicht mehr, nur noch im Sweet Spot am Griff (Nutzer 2026-09-30). */}
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

          {/* Treffflächen (Nutzer 2026-10-03): die Infobox wechselt im Web schon beim Überfahren,
              nicht erst beim Klick. Vorher hingen die Flächen an den Reglern der Maske und
              fehlten damit überall, wo keine Bewertungsmaske läuft. Live gemessen am 2026-10-05:
              in der Anzeige gab es rechts nur zwei Schaltflächen und links für zehn Achsen keine
              einzige HTML-Fläche. Diese Rechtecke stehen deshalb immer im Markup, transparent und
              ohne Bedeutung für Screenreader (die Werte stehen in der Tabelle darunter). `touch`
              ist ausgenommen: mobil gibt es kein Überfahren, und dort bleibt alles wie bisher. */}
          {kartenSichtbar > 0.5 ? (
            <g opacity={0}>
              {karte.map((knoten, index) => (
                <rect
                  key={`treffer-achse-${GESCHMACKS_ACHSEN[index].key}`}
                  data-treffer="achse"
                  aria-hidden="true"
                  x={balkenEnde(knoten, MAX, 0, balken).x - 14}
                  y={knoten.y - 22}
                  width={balken + 46}
                  height={44}
                  fill="transparent"
                  style={{ pointerEvents: "all" }}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== "touch") achseUeberfahren(index);
                  }}
                />
              ))}
              {terpenKnoten.map((punkt, index) => (
                <rect
                  key={`treffer-terpen-${terpene[index].name}`}
                  data-treffer="terpen"
                  aria-hidden="true"
                  x={punkt.x - 14}
                  y={punkt.y - 22}
                  width={aktBreite - punkt.x + 14}
                  height={44}
                  fill="transparent"
                  style={{ pointerEvents: "all" }}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== "touch") terpenUeberfahren(terpene[index].name);
                  }}
                />
              ))}
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
                    {/* Funken nur genau im Sweet Spot (Nutzer 2026-09-30: das ist der Geschmack, den
                        man erreichen möchte), am Zielwert, nicht am gleitenden. Grün wie das Ziel,
                        über dem Griff, damit sie auch auf schmalen Karten sichtbar steigen
                        (globals.css .delta-funke; Sparmodus und reduzierte Bewegung: aus). */}
                    {imSweetSpot(regler.werte[key])
                      ? SWEET_SPOT_FUNKEN.map((wert, i) => (
                          <circle
                            key={wert}
                            className="delta-funke"
                            cx={balkenEnde(knoten, wert, 0, balken).x}
                            cy={knoten.y}
                            r={1.75}
                            fill={FARBE.gruen}
                            style={{ animationDelay: `${-((i * 0.37) % 1) * 0.9}s` }}
                          />
                        ))
                      : null}
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

          {/* Skala über den Balken: Länge = Wert 0 bis 5, gelesen als Sweet-Spot-Skala (Nutzer
              2026-09-30). Statt der Zahlen drei Wörter; die Balken wachsen nach links, „zu viel“
              (5) steht also links, „zu wenig“ (0) rechts, jeweils nach innen gesetzt. Reicht die
              Balkenlänge nicht für alle drei in einer Zeile (Handy), stehen die Ränder unter der
              letzten Achse; „Sweet Spot“ bleibt oben, halbfett und voll deckend. */}
          <g opacity={kartenSichtbar}>
            <g opacity={0.7}>
              {SKALA.map((stufe) => {
                const x = balkenEnde(karte[0], stufe, 0, balken).x;
                return (
                  <line
                    key={stufe}
                    x1={x}
                    y1={skalaY + 4}
                    x2={x}
                    y2={skalaUnten}
                    stroke="currentColor"
                    strokeOpacity={0.15}
                    strokeDasharray="2 4"
                  />
                );
              })}
              {(
                [
                  { stufe: MAX, wort: kt.sweetSkala.viel, anker: "start" },
                  { stufe: 0, wort: kt.sweetSkala.wenig, anker: "end" },
                ] as const
              ).map(({ stufe, wort, anker }) => (
                <text
                  key={stufe}
                  x={balkenEnde(karte[0], stufe, 0, balken).x}
                  y={balken >= SKALA_EINZEILIG ? skalaY : skalaUnten + 18}
                  textAnchor={anker}
                  fontSize={11}
                  fill="currentColor"
                  fillOpacity={0.6}
                >
                  {wort}
                </text>
              ))}
            </g>
            <text x={skalaMitteX} y={skalaY} textAnchor="middle" fontSize={11} fontWeight={500} fill="currentColor">
              {kt.sweetSkala.mitte}
            </text>
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
          </>
        ) : null}
        </svg>
        {montiert ? (
          <>

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
              top: `${((punkt.y - 20 * kartenSichtbar) / aktHoehe) * 100}%`,
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
          const an = terpenSchalter?.an.has(name) ?? false;
          const pulsiert = terpenSchalter?.pulsierend?.has(name) ?? false;
          return (
            <button
              key={name}
              type="button"
              // Mit Schaltern ist der Name die Schaltfläche und muss erreichbar sein; ohne sie
              // bleibt er wie bisher ein stummes Ziel fürs Hervorheben (der Wert steht in der
              // Tabelle für Screenreader).
              tabIndex={terpenSchalter ? undefined : -1}
              aria-hidden={terpenSchalter ? undefined : true}
              aria-pressed={terpenSchalter ? an : undefined}
              onClick={terpenSchalter ? () => terpenSchalter.umschalten(name) : undefined}
              onMouseEnter={() => terpenUeberfahren(name)}
              onFocus={() => terpenUeberfahren(name)}
              className={cn(
                "absolute inline-flex -translate-y-1/2 items-center gap-1.5 pl-4 font-buch font-medium whitespace-nowrap transition-colors duration-normal",
                terpene.length > 6 || schmal ? "text-small" : "text-h3",
                terpenSchalter && "cursor-pointer rounded-full outline-offset-2 outline-focus-ring focus-visible:outline-2",
                // Ein ausgeschaltetes Terpen steht blass da, ein eingeschaltetes in voller Schrift.
                terpenSchalter
                  ? an
                    ? "text-text"
                    : "text-text-muted"
                  : (etwasUeberfahren ? terpenBetont(name) : (staerke[name] ?? 0) > 0)
                    ? "text-text"
                    : "text-text-muted",
                // Kandidat: der Geschmack steht über Null, aber mehrere Terpene tragen ihn. Die
                // Karte fordert zur Wahl auf, bis eines an ist (Nutzer 2026-10-03).
                pulsiert && "terpen-kandidat",
              )}
              style={{
                left: `${(punkt.x / aktBreite) * 100}%`,
                top: `${(punkt.y / aktHoehe) * 100}%`,
                opacity: kartenSichtbar,
                // Bis zum rechten Rand. Schmal brechen lange Namen (beta-Caryophyllen) am
                // Bindestrich um, statt hinauszuragen.
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
            style={{
              left: `${(punkt.x / aktBreite) * 100}%`,
              top: `${(punkt.y / aktHoehe) * 100}%`,
              opacity: kartenSichtbar,
              // Wie bei den Terpenen: schmal bis zum rechten Rand und umbrechen statt hinausragen.
              maxWidth: schmal ? `${aktBreite - punkt.x}px` : undefined,
              whiteSpace: schmal ? "normal" : undefined,
            }}
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
          </>
        ) : null}
      </div>

      {/* Infotext unter der Karte (Nutzer 2026-09-26, 2026-09-27): zentriert wie eine Legende im Buch.
          Die Tafel steht unter der Karte und bekommt seit 2026-10-03 eine feste Höhe statt einer
          Mindesthöhe (Nutzer: die Sektion sprang beim Überfahren). Vorher reservierte sie 224 px
          als Mindestmaß und wuchs mit einem langen Terpentext darüber hinaus, wodurch die ganze
          Sektion ihre Höhe änderte. Jetzt ist der Platz fest und der Text scrollt in der Tafel.
          Eine Überlagerung der Karte wäre der falsche Weg: sie verdeckte live die untere Hälfte
          der Achsen. Sie fängt keine Zeiger (pointer-events erbt), damit das Überfahren der Karte
          weiterläuft; der Inhalt blendet beim Wechsel nur über (Deckkraft). */}
      <div
        aria-live="polite"
        className={cn(
          "pointer-events-none grid h-56 justify-items-center overflow-hidden",
          "*:max-h-56 *:overflow-y-auto",
          // Dicht im Buch ab lg (Spec 2026-10-05): der feste Platz bleibt, ist aber kleiner.
          kompakt && "lg:h-32 lg:*:max-h-32",
        )}
      >
        {aktiveAchse ? (
          <InfoTafel
            key={`achse-${aktiveAchse.key}`}
            kompakt={kompakt}
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
            kompakt={kompakt}
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
              {/* Nur mit Terpen-Reglern (Maske): der Satz zur rechten Seite. */}
              {terpenSchalter ? ` ${kt.hinweisTerpenRegler}` : null}
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
        <div className="sr-only">
        <fieldset className="min-w-0">
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
                aria-valuetext={reglerText(regler.werte[achse.key])}
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
        </div>
      ) : null}

      {/* Terpen-Schalter für Tastatur und Vorleser, in der Reihenfolge der Spalte (Nutzer
          2026-10-03, vorher Regler 0 bis 5). Ein Terpen ist an oder aus; der Fokus hebt es in
          der Karte hervor. Der sichtbare Schalter ist der Name rechts in der Karte. */}
      {terpenSchalter ? (
        <div className="sr-only">
        <fieldset className="min-w-0">
          <legend>{kt.terpenLegende}</legend>
          {terpenFolge.map(({ name }) => (
            <label key={name}>
              {terpenAnzeige(name, sprache)}
              <input
                type="checkbox"
                checked={terpenSchalter.an.has(name)}
                onChange={() => terpenSchalter.umschalten(name)}
                onFocus={() => terpenUeberfahren(name)}
                onBlur={() => setTerpenAktiv(null)}
              />
            </label>
          ))}
        </fieldset>
        </div>
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
  kompakt = false,
  children,
}: {
  art: string;
  icon: React.ReactNode;
  titel: string;
  /** Zusatz unter dem Namen, etwa „laut Hersteller nicht enthalten“ (T5). */
  hinweis?: string;
  bezugTitel?: string;
  bezug: readonly React.ReactNode[];
  /** Dicht im Buch ab lg: ohne Kopfzeile, ein Satz in zwei Zeilen, eine Zeile Pillen. */
  kompakt?: boolean;
  children: React.ReactNode;
}) {
  return (
    // gap-1 = 4px dicht: die Zeilen der Tafel sind ein zusammengehöriger Block in 128 px.
    <div className={cn("flex w-full max-w-xl flex-col items-center gap-2 text-center transition-opacity duration-normal ease-out starting:opacity-0", kompakt && "lg:gap-1")}>
      <p className={cn("text-caption tracking-wide text-text-muted uppercase", kompakt && "lg:hidden")}>{art}</p>
      <p className="inline-flex items-center gap-2 font-buch text-h3 text-text">
        <span aria-hidden="true" className="flex">
          {icon}
        </span>
        {titel}
      </p>
      {hinweis ? <p className={cn("text-caption text-text-muted text-pretty", kompakt && "lg:hidden")}>{hinweis}</p> : null}
      {children ? (
        <p className={cn("max-w-md font-buch text-body text-text-muted italic text-pretty", kompakt && "lg:line-clamp-2 lg:text-small")}>
          {children}
        </p>
      ) : null}
      {bezug.length > 0 ? (
        <div className={cn("mt-2 flex flex-col items-center gap-2", kompakt && "lg:mt-0")}>
          {bezugTitel ? <p className={cn("text-caption tracking-wide text-text-muted uppercase", kompakt && "lg:hidden")}>{bezugTitel}</p> : null}
          <ul className={cn("flex flex-wrap justify-center gap-2", kompakt && "lg:max-h-8 lg:overflow-hidden")}>{bezug}</ul>
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

/** Strichmuster einer Ebene in der Legende, wie die Bögen gezeichnet (seit 2026-09-30 ohne Herstellerstreifen). */
function EbenenMuster({ ebene }: { ebene: TerpenEbene }) {
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
 * (grün bis zum Bezug, lila darüber; ohne Bezug nur lila) und der breite, blasse Streifen
 * der Herstellerangabe. Form und Farbe wie in der Karte.
 */
function LegendenMuster({ art }: { art: "balken" | "balkenLila" | "streifen" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 8" className="h-2 w-6 shrink-0 overflow-visible text-text">
      {art === "streifen" ? (
        <line x1={4} y1={4} x2={20} y2={4} stroke="currentColor" strokeOpacity={0.25} strokeWidth={8} strokeLinecap="round" />
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
