"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import Link from "next/link";

import { SchalterSymbole } from "@/components/medien/SchalterSymbole";
import { AufgeschlagenKontext } from "@/components/review/NurAufgeschlagen";
import {
  AUTO_MS,
  ankerSeite,
  autoBlaettern,
  autoZiel,
  bandHref,
  bandVon,
  blaetterPlan,
  drehRichtung,
  klickRichtung,
  nahSeite,
  nummerSeite,
  seitenleiste,
  tastenRichtung,
  wischRichtung,
  zielSeite,
  type Haelfte,
  type Richtung,
} from "@/lib/buch";
import { cn } from "@/lib/cn";
import { abonniereEinstellungen, istSparmodus } from "@/lib/einstellungen";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

export type BuchTexte = Pick<
  Woerterbuch["buch"],
  "tastatur" | "seite" | "zurueck" | "weiter" | "anhalten" | "abspielen"
>;

/**
 * Seitenleiste des großen Buchs (Spec Bewertungsbuch 4): `basis` Einträge liegen in früheren Bänden,
 * `gesamt` zählt alle Einträge über alle Bände. Nur serialisierbare Werte.
 */
export type BuchLeiste = { basis: number; gesamt: number; texte: { leiste: string; nummer: string } };

/** Eine Seite des Buchs: eine Doppelseite, gefunden über ihren Anker (#eintrag-…). */
export type BuchSeite = { anker: string; inhalt: ReactNode };

/*
 * Bewegung (Skills animate, apple-design, emil-design-eng): eine Seite
 * umzuschlagen ist ein Ortswechsel auf dem Bildschirm, also ease-in-out,
 * die starke Kurve aus dem Skill `animate`. Die Doppelseite schlägt in zwei
 * Vierteln um (hochkant, dann flach) und braucht dafür 500 ms, die einzelne
 * Seite auf schmalen Schirmen nur das eine Viertel, 400 ms. Nur transform und
 * opacity, über WAAPI: so liegt eine Kurve über beiden Vierteln, und ein neues
 * Umblättern bricht das laufende sauber ab.
 */
const KURVE = "cubic-bezier(0.77, 0, 0.175, 1)";
const DAUER_DOPPELSEITE_MS = 500;
const DAUER_SEITE_MS = 400;
/** Tiefe der Drehung: genug Raum, dass die freie Kante nicht übergroß auf einen zukommt. */
const TIEFE = "perspective(2400px)";
/** Ab lg liegen die zwei Seiten nebeneinander (Doppelseite.tsx, lg:grid-cols-2). */
const NEBENEINANDER = "(min-width: 64rem)";
const REDUZIERT = "(prefers-reduced-motion: reduce)";
/** Was selbst auf Klicks und Pfeiltasten hört, blättert nicht um. */
const BEDIENBAR = "a, button, input, select, textarea, label, summary, iframe, video, [role='button'], [role='radio'], [role='slider'], [role='tab'], [data-buch-eigen]";
const EIGENE_PFEILE = "input, textarea, select, [contenteditable], [role='radiogroup'], [role='slider'], [role='tablist'], [role='listbox'], [role='menu']";

/** Ruhe: reduzierte Bewegung oder Sparmodus der Schalterleiste (T2). */
function abonniereRuhe(rueckruf: () => void) {
  const medien = window.matchMedia(REDUZIERT);
  medien.addEventListener("change", rueckruf);
  const abbestellen = abonniereEinstellungen(rueckruf);
  return () => {
    medien.removeEventListener("change", rueckruf);
    abbestellen();
  };
}
const istRuhe = () => window.matchMedia(REDUZIERT).matches || istSparmodus();
/** Auf dem Server gilt Ruhe: nichts läuft, bevor das Buch im Browser die Lage kennt. */
const ruheAufDemServer = () => true;

function abonniereSichtbarkeit(rueckruf: () => void) {
  document.addEventListener("visibilitychange", rueckruf);
  return () => document.removeEventListener("visibilitychange", rueckruf);
}
const istVerborgen = () => document.hidden;
const nieVerborgen = () => false;

function abonniereAnker(rueckruf: () => void) {
  window.addEventListener("hashchange", rueckruf);
  return () => window.removeEventListener("hashchange", rueckruf);
}
const aktuellerAnker = () => window.location.hash;
const keinAnker = () => "";

/** Höhe der Bildschirmmitte im Element: dort liegt der Fluchtpunkt, auch wenn das Buch höher ist als der Schirm. */
function mitteImBild(element: HTMLElement): number {
  const rahmen = element.getBoundingClientRect();
  return Math.min(Math.max(window.innerHeight / 2 - rahmen.top, 0), rahmen.height);
}

function animiere(element: HTMLElement, bild: Keyframe[], dauer: number, pseudo?: "::after"): Animation | null {
  // Ohne Pseudo-Element-Animation träfe der Schatten die Seite selbst: dann lieber ohne Schatten.
  if (pseudo && !("pseudoElement" in KeyframeEffect.prototype)) return null;
  try {
    return element.animate(bild, { duration: dauer, easing: KURVE, fill: "forwards", pseudoElement: pseudo });
  } catch {
    // Scheitert eine Animation, fehlt nur diese Bewegung; die Seite wechselt trotzdem.
    return null;
  }
}

const dreh = (grad: number) => `${TIEFE} rotateY(${grad}deg)`;
/** Schatten am Falz (::after, globals.css): Deckkraft über die zwei Viertel. */
const schatten = (von: number, mitte: number, bis: number): Keyframe[] => [
  { opacity: von },
  { opacity: mitte, offset: 0.5 },
  { opacity: bis },
];

function haelfte(seite: HTMLElement, welche: Haelfte): HTMLElement | null {
  return seite.querySelector<HTMLElement>(`[data-buchseite="${welche}"]`);
}

/** Setzt Drehpunkt und Ebene eines Blatts für die Dauer der Drehung. */
function anheben(element: HTMLElement, falz: "left" | "right") {
  element.style.transformOrigin = `${falz} ${mitteImBild(element)}px`;
  element.style.zIndex = "2";
}

/**
 * Hebt eine liegende Hälfte über die deckenden Artikel beider Seiten (Ebene 1,
 * unter dem drehenden Blatt): sonst verdeckte der Artikel der jeweils anderen
 * Seite sie, und neben dem Blatt stünde eine leere Fläche (T7-Review).
 */
function unterlegen(element: HTMLElement | null) {
  if (element) element.style.zIndex = "1";
}

function ablegen(...elemente: (HTMLElement | null)[]) {
  for (const element of elemente) {
    element?.style.removeProperty("transform-origin");
    element?.style.removeProperty("z-index");
  }
}

/**
 * Doppelseite (ab lg): die vordere Hälfte der alten Seite hebt sich am Falz
 * bis hochkant, dann legt sich die hintere Hälfte der neuen. Darunter liegen
 * die andere Hälfte der neuen (wird frei) und die der alten (wird zugedeckt),
 * beide mit einem Schatten am Falz.
 */
function doppelseiteUmschlagen(geht: HTMLElement, kommt: HTMLElement, richtung: Richtung) {
  const plan = blaetterPlan(richtung);
  const hebt = haelfte(geht, plan.hebt.haelfte);
  const legt = haelfte(kommt, plan.legt.haelfte);
  const wirdFrei = haelfte(kommt, plan.hebt.haelfte);
  const wirdZugedeckt = haelfte(geht, plan.legt.haelfte);
  if (!hebt || !legt) return { animationen: [], elemente: [] };
  anheben(hebt, plan.hebt.falz);
  anheben(legt, plan.legt.falz);
  unterlegen(wirdFrei);
  unterlegen(wirdZugedeckt);
  const hoch = dreh(plan.hebt.bis);
  const quer = dreh(plan.legt.von);
  const animationen = [
    animiere(
      hebt,
      [
        { transform: dreh(0), opacity: 1 },
        { transform: hoch, opacity: 1, offset: 0.5 },
        { transform: hoch, opacity: 0, offset: 0.5 },
        { transform: hoch, opacity: 0 },
      ],
      DAUER_DOPPELSEITE_MS,
    ),
    animiere(
      legt,
      [
        { transform: quer, opacity: 0 },
        { transform: quer, opacity: 0, offset: 0.5 },
        { transform: quer, opacity: 1, offset: 0.5 },
        { transform: dreh(0), opacity: 1 },
      ],
      DAUER_DOPPELSEITE_MS,
    ),
    animiere(hebt, schatten(0, 1, 1), DAUER_DOPPELSEITE_MS, "::after"),
    animiere(legt, schatten(1, 1, 0), DAUER_DOPPELSEITE_MS, "::after"),
    wirdFrei ? animiere(wirdFrei, schatten(1, 0, 0), DAUER_DOPPELSEITE_MS, "::after") : null,
    wirdZugedeckt ? animiere(wirdZugedeckt, schatten(0, 0, 1), DAUER_DOPPELSEITE_MS, "::after") : null,
  ];
  return { animationen, elemente: [hebt, legt, wirdFrei, wirdZugedeckt] };
}

/**
 * Einzelne Seite (schmal, die Hälften stehen untereinander): der Rücken ist
 * links. Vorwärts hebt sich die alte Seite bis hochkant weg und gibt die neue
 * frei, zurück legt sich die vorige aus der Hochkante darüber (derselbe Weg).
 */
function seiteUmschlagen(geht: HTMLElement, kommt: HTMLElement, richtung: Richtung) {
  const blatt = richtung === 1 ? geht : kommt;
  const unten = richtung === 1 ? kommt : geht;
  anheben(blatt, "left");
  const [von, bis] = richtung === 1 ? [0, -90] : [-90, 0];
  const animationen = [
    animiere(blatt, [{ transform: dreh(von) }, { transform: dreh(bis) }], DAUER_SEITE_MS),
    animiere(blatt, [{ opacity: richtung === 1 ? 0 : 1 }, { opacity: richtung === 1 ? 1 : 0 }], DAUER_SEITE_MS, "::after"),
    animiere(unten, [{ opacity: richtung === 1 ? 1 : 0 }, { opacity: richtung === 1 ? 0 : 1 }], DAUER_SEITE_MS, "::after"),
  ];
  return { animationen, elemente: [blatt] };
}

/** Pfeil für zurück und weiter, gespiegelt; reine Dekoration neben dem Namen im aria-label. */
function Pfeil({ richtung }: { richtung: Richtung }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={richtung === 1 ? "M9 5.5 15.5 12 9 18.5" : "M15 5.5 8.5 12 15 18.5"} />
    </svg>
  );
}

/** Zurück und weiter: 44-px-Pillen wie die übrigen Knöpfe, Druck-Rückmeldung nur mit Bewegung. */
const KNOPF =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-text " +
  "transition-[background-color,scale] duration-[var(--duration-fast),120ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-sunken " +
  "motion-safe:active:scale-[0.97] aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-surface-raised aria-disabled:active:scale-100";

/** Eine Nummer der Seitenleiste: 44-px-Pille wie die Knöpfe. */
const PILLE =
  "inline-flex size-11 items-center justify-center rounded-full border numeric text-small " +
  "transition-[background-color,scale] duration-[var(--duration-fast),120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:active:scale-[0.97]";
const PILLE_RUHIG = "border-border-strong bg-surface-raised text-text hover:bg-surface-sunken";
const PILLE_AKTUELL = "border-accent bg-accent text-accent-fg";

type Stand = {
  /** Die aufgeschlagene Seite. */
  index: number;
  /** Die Seite, die gerade umgeschlagen wird; null, wenn nichts dreht. */
  vorher: number | null;
};

/**
 * Das Buch zum Blättern (Masterplan Bewertung v2, T7, Nutzer 2026-09-29): alle
 * Seiten stehen im DOM. Ohne JavaScript untereinander (globals.css, `scripting:
 * none`), mit Skript gestapelt in einer Zelle, nur die aufgeschlagene sichtbar;
 * so bleibt die Höhe beim Blättern gleich und kein Inhalt geht verloren.
 *
 * Blättern: Klick mit der Maus links vom Falz zurück, rechts weiter; Wischen
 * (waagerecht, senkrecht scrollt weiter); Pfeiltasten, wenn der Fokus im Buch
 * ist; die Knöpfe. Autoplay alle 8 s, mit Pause bei Hover, Fokus, verborgenem
 * Tab, außerhalb des Bildes, im Sparmodus und bei reduzierter Bewegung; dort
 * wechselt die Seite auch ohne Drehung. Mit nur einer Seite gibt es nichts
 * davon: keine Knöpfe, kein Play, kein Klickziel.
 *
 * "Seite x von n" ist eine höfliche Live-Region, solange niemand automatisch
 * blättert; während des Autoplays schweigt sie (APG Carousel), sonst spräche
 * sie alle 8 s.
 */
export function Buch({
  seiten,
  bezeichnung,
  texte,
  leiste,
  autoplay = true,
}: {
  seiten: readonly BuchSeite[];
  bezeichnung: string;
  texte: BuchTexte;
  leiste?: BuchLeiste;
  /** Startet das Blättern von selbst; aus, wo man lange auf einer Seite liest (großes Buch). */
  autoplay?: boolean;
}) {
  const anzahl = seiten.length;
  const mehrere = anzahl > 1;
  const buehne = useRef<HTMLDivElement>(null);
  const huelle = useRef<HTMLDivElement>(null);
  const wisch = useRef<{ id: number; x: number; y: number; zeit: number } | null>(null);
  const zeigerArt = useRef("");
  const seiteId = useId();
  const hinweisId = useId();

  const [stand, setStand] = useState<Stand>({ index: 0, vorher: null });
  const [laeuft, setLaeuft] = useState(autoplay);
  const [zeiger, setZeiger] = useState(false);
  const [fokus, setFokus] = useState(false);
  const [imBild, setImBild] = useState(false);
  // Der Einzug der Seite (globals.css, data-im-bild) startet einmal, sobald das Buch zu sehen ist, und bleibt.
  const [eingezogen, setEingezogen] = useState(false);
  const ruhe = useSyncExternalStore(abonniereRuhe, istRuhe, ruheAufDemServer);
  const verborgen = useSyncExternalStore(abonniereSichtbarkeit, istVerborgen, nieVerborgen);

  // Sprungziel in der Adresse (#eintrag-…): die Seite dazu aufschlagen, beim
  // Laden und bei jedem Wechsel. Abgeglichen im Rendern, nicht in einem Effekt.
  const anker = useSyncExternalStore(abonniereAnker, aktuellerAnker, keinAnker);
  // Start leer wie auf dem Server: ein Anker, der schon beim ersten Rendern im Browser steht, zählt mit.
  const [letzterAnker, setLetzterAnker] = useState(keinAnker);
  if (anker !== letzterAnker) {
    setLetzterAnker(anker);
    // #nr-<n> (Seitenleiste, aus einem anderen Band) gilt nur mit Seitenleiste.
    const seite =
      ankerSeite(
        anker,
        seiten.map((eintrag) => eintrag.anker),
      ) ?? (leiste ? nummerSeite(anker, leiste.basis, anzahl) : null);
    if (seite !== null) setStand({ index: seite, vorher: null });
  }

  const blaettern = useCallback(
    (ziel: number) => {
      const buehneEl = buehne.current;
      if (!buehneEl) return;
      // Stand der Fokus auf der Seite, die gleich verschwindet, bleibt er im Buch.
      const offen = buehneEl.querySelector(":scope > [data-aktiv]");
      if (offen?.contains(document.activeElement)) buehneEl.focus({ preventScroll: true });
      const bewegt = !ruhe && typeof buehneEl.animate === "function";
      setStand((alt) => (alt.index === ziel ? alt : { index: ziel, vorher: bewegt ? alt.index : null }));
    },
    [ruhe],
  );

  /** Blättern von Hand. Lag der Anfang der Seite über dem Bild (lange Seiten, schmal), geht es oben weiter. */
  const schritt = (richtung: Richtung) => {
    const ziel = zielSeite(stand.index, anzahl, richtung);
    if (ziel === null) return;
    blaettern(ziel);
    const buehneEl = buehne.current;
    if (!buehneEl) return;
    const rand = Number.parseFloat(getComputedStyle(buehneEl).scrollMarginTop) || 0;
    if (buehneEl.getBoundingClientRect().top < rand) {
      buehneEl.scrollIntoView({ block: "start", behavior: ruhe ? "auto" : "smooth" });
    }
  };

  // Die Drehung selbst. Im Layout-Effekt: beide Seiten sind sichtbar, bevor der
  // erste Rahmen gemalt wird, und das Aufräumen (Abbruch, Drehpunkt weg) fällt
  // in denselben Rahmen, in dem die alte Seite verschwindet.
  useLayoutEffect(() => {
    const { index, vorher } = stand;
    const buehneEl = buehne.current;
    if (vorher === null || !buehneEl) return;
    const geht = buehneEl.children[vorher];
    const kommt = buehneEl.children[index];
    if (!(geht instanceof HTMLElement) || !(kommt instanceof HTMLElement)) return;
    const richtung = drehRichtung(vorher, index);
    const { animationen, elemente } = window.matchMedia(NEBENEINANDER).matches
      ? doppelseiteUmschlagen(geht, kommt, richtung)
      : seiteUmschlagen(geht, kommt, richtung);
    let gueltig = true;
    Promise.all(animationen.map((animation) => animation?.finished)).then(
      () => {
        if (gueltig) setStand((jetzt) => (jetzt.index === index && jetzt.vorher === vorher ? { index, vorher: null } : jetzt));
      },
      // Abgebrochen: ein neues Umblättern hat übernommen.
      () => {},
    );
    return () => {
      gueltig = false;
      for (const animation of animationen) animation?.cancel();
      ablegen(...elemente);
    };
  }, [stand]);

  // Autoplay nur im Bild: außerhalb soll das Buch nicht weiterblättern, man käme sonst irgendwo heraus.
  useEffect(() => {
    const element = huelle.current;
    if (!element || !mehrere) return;
    const beobachter = new IntersectionObserver(([eintrag]) => setImBild(eintrag.isIntersecting), {
      rootMargin: "-20% 0px",
    });
    beobachter.observe(element);
    return () => beobachter.disconnect();
  }, [mehrere]);

  // Einzug: einmal, sobald irgendein Teil des Buchs sichtbar ist (Review 2026-10-06). An der 80-%-Linie
  // stünde der Kopf schon fertig da und blitzte beim Start aus; bei jedem Hineinscrollen neu wäre Unruhe.
  // Beim Umblättern beginnt er trotzdem neu, das hängt an data-aktiv. Gilt auch für eine einzelne Seite.
  useEffect(() => {
    const element = huelle.current;
    if (!element) return;
    const beobachter = new IntersectionObserver(([eintrag]) => {
      if (eintrag.isIntersecting) {
        setEingezogen(true);
        beobachter.disconnect();
      }
    });
    beobachter.observe(element);
    return () => beobachter.disconnect();
  }, []);

  const auto = autoBlaettern({ anzahl, laeuft, ruhe, zeiger, fokus, verborgen, imBild });
  useEffect(() => {
    if (!auto) return;
    const uhr = window.setTimeout(() => blaettern(autoZiel(stand.index, anzahl)), AUTO_MS);
    return () => window.clearTimeout(uhr);
  }, [auto, stand.index, anzahl, blaettern]);

  const beiTaste = (ereignis: KeyboardEvent<HTMLDivElement>) => {
    if (ereignis.defaultPrevented || ereignis.altKey || ereignis.ctrlKey || ereignis.metaKey || ereignis.shiftKey) return;
    const richtung = tastenRichtung(ereignis.key);
    if (richtung === null) return;
    if (ereignis.target instanceof Element && ereignis.target.closest(EIGENE_PFEILE)) return;
    ereignis.preventDefault();
    schritt(richtung);
  };

  const beiKlick = (ereignis: MouseEvent<HTMLDivElement>) => {
    // Nur Maus und Stift: auf Touch blättert das Wischen, ein Tippen zum Lesen soll nichts auslösen.
    if (zeigerArt.current !== "mouse" && zeigerArt.current !== "pen") return;
    if (ereignis.button !== 0 || ereignis.defaultPrevented) return;
    if (ereignis.target instanceof Element && ereignis.target.closest(BEDIENBAR)) return;
    // Wer Text markiert hat, wollte markieren, nicht blättern.
    if (window.getSelection()?.toString()) return;
    const rahmen = ereignis.currentTarget.getBoundingClientRect();
    schritt(klickRichtung(ereignis.clientX, rahmen.left, rahmen.width));
  };

  const beiZeigerStart = (ereignis: PointerEvent<HTMLDivElement>) => {
    zeigerArt.current = ereignis.pointerType;
    if (ereignis.pointerType === "mouse") return;
    // Ein zweiter Finger (Zoom) beendet die Geste.
    wisch.current = wisch.current
      ? null
      : { id: ereignis.pointerId, x: ereignis.clientX, y: ereignis.clientY, zeit: ereignis.timeStamp };
  };

  const beiZeigerEnde = (ereignis: PointerEvent<HTMLDivElement>) => {
    const start = wisch.current;
    wisch.current = null;
    if (!start || start.id !== ereignis.pointerId) return;
    const richtung = wischRichtung(ereignis.clientX - start.x, ereignis.clientY - start.y, ereignis.timeStamp - start.zeit);
    if (richtung !== null) schritt(richtung);
  };

  const kannZurueck = zielSeite(stand.index, anzahl, -1) !== null;
  const kannWeiter = zielSeite(stand.index, anzahl, 1) !== null;

  return (
    <div
      ref={huelle}
      className="flex flex-col gap-6 lg:gap-4"
      onKeyDown={mehrere ? beiTaste : undefined}
      onPointerEnter={
        mehrere
          ? (ereignis) => {
              if (ereignis.pointerType === "mouse") setZeiger(true);
            }
          : undefined
      }
      onPointerLeave={mehrere ? () => setZeiger(false) : undefined}
      // Fokus auf Play/Pause ist kein Lesen: sonst hielte ausgerechnet der Knopf, der abspielt, das Blättern an.
      onFocus={mehrere ? (ereignis) => setFokus(!(ereignis.target instanceof Element && ereignis.target.closest("[data-abspielen]"))) : undefined}
      onBlur={
        mehrere
          ? (ereignis) => {
              if (!ereignis.currentTarget.contains(ereignis.relatedTarget)) setFokus(false);
            }
          : undefined
      }
    >
      <div
        ref={buehne}
        data-im-bild={eingezogen ? "" : undefined}
        // Waagerecht wischt das Buch, senkrecht scrollt und zoomt weiter der Browser.
        className={cn("buch-stapel", mehrere && "scroll-mt-[calc(var(--kopf-h,4rem)+1rem)] touch-pan-y touch-pinch-zoom")}
        {...(mehrere
          ? {
              role: "group",
              "aria-label": bezeichnung,
              "aria-describedby": `${seiteId} ${hinweisId}`,
              tabIndex: 0,
              "data-blaettern": "",
              "data-zurueck": kannZurueck ? "" : undefined,
              "data-weiter": kannWeiter ? "" : undefined,
              onClick: beiKlick,
              onPointerDown: beiZeigerStart,
              onPointerUp: beiZeigerEnde,
              onPointerCancel: () => {
                wisch.current = null;
              },
            }
          : {})}
      >
        {seiten.map((seite, index) => {
          const geht = index === stand.vorher;
          return (
            <div
              key={seite.anker}
              className="buch-seite"
              data-aktiv={index === stand.index ? "" : undefined}
              data-geht={geht ? "" : undefined}
              // Die Seite, die gerade umschlägt, ist nur noch Bild.
              inert={geht || undefined}
            >
              <AufgeschlagenKontext value={nahSeite(index, stand.index, anzahl) || geht}>{seite.inhalt}</AufgeschlagenKontext>
            </div>
          );
        })}
      </div>

      {mehrere ? (
        // Drei Spalten: die Mitte bleibt stehen, wenn der Play-Knopf nach dem Laden dazukommt.
        <div className="buch-steuerung grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="col-start-2 flex items-center gap-4">
            <button
              type="button"
              aria-label={texte.zurueck}
              aria-disabled={kannZurueck ? undefined : true}
              onClick={() => schritt(-1)}
              className={KNOPF}
            >
              <Pfeil richtung={-1} />
            </button>
            <p
              id={seiteId}
              aria-live={auto ? "off" : "polite"}
              aria-atomic="true"
              className="text-small whitespace-nowrap text-text-muted tabular-nums"
            >
              {t(texte.seite, { seite: stand.index + 1, anzahl })}
            </p>
            <button
              type="button"
              aria-label={texte.weiter}
              aria-disabled={kannWeiter ? undefined : true}
              onClick={() => schritt(1)}
              className={KNOPF}
            >
              <Pfeil richtung={1} />
            </button>
          </div>
          <div className="justify-self-end">
            {/* Im Stil von LoopSchalter; bei Ruhe gibt es kein Autoplay, also auch keinen Knopf. */}
            {ruhe ? null : (
              <button
                type="button"
                aria-label={laeuft ? texte.anhalten : texte.abspielen}
                data-angehalten={laeuft ? undefined : ""}
                data-abspielen=""
                onClick={() => setLaeuft(!laeuft)}
                className="loop-schalter"
              >
                <SchalterSymbole />
              </button>
            )}
          </div>
          <p id={hinweisId} className="sr-only">
            {texte.tastatur}
          </p>
        </div>
      ) : null}
      {leiste && leiste.gesamt > 1 ? (
        <nav aria-label={leiste.texte.leiste} className="flex flex-wrap justify-center gap-2">
          {seitenleiste(leiste.basis + stand.index + 1, leiste.gesamt).map((punkt) => {
            if (punkt.art === "luecke") {
              return (
                <span key={punkt.schluessel} aria-hidden="true" className="inline-flex h-11 items-center text-text-muted">
                  …
                </span>
              );
            }
            const n = punkt.nummer;
            const beschriftung = t(leiste.texte.nummer, { nummer: n });
            const imBand = n > leiste.basis && n <= leiste.basis + anzahl;
            if (!imBand) {
              return (
                <Link key={n} prefetch={false} href={`${bandHref(bandVon(n))}#nr-${n}`} aria-label={beschriftung} className={cn(PILLE, PILLE_RUHIG)}>
                  {n}
                </Link>
              );
            }
            const aktuell = n === leiste.basis + stand.index + 1;
            return (
              <button
                key={n}
                type="button"
                aria-label={beschriftung}
                aria-current={aktuell ? "page" : undefined}
                onClick={() => blaettern(n - leiste.basis - 1)}
                className={cn(PILLE, aktuell ? PILLE_AKTUELL : PILLE_RUHIG)}
              >
                {n}
              </button>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
