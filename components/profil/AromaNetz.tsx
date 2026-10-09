"use client";

import { useEffect, useRef, useState } from "react";

import { NetzGrafik, netzAusGeschmack } from "@/components/profil/NetzGrafik";
import { NetzLegende } from "@/components/profil/NetzLegende";
import { GeschmackIcon } from "@/components/review/AromaIcon";
import { vollFarbe } from "@/lib/aroma-farben";
import { formatiereDatum, formatiereWert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { aenderungsListe, netzAenderung } from "@/lib/netz-aenderung";
import { zwischenGeschmack } from "@/lib/netz-animation";
import type { Geschmack } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";

/** Nur die Texte, die das Netz im Browser braucht, nicht das ganze Profil-Wörterbuch. */
export type AromaNetzTexte = Pick<
  Woerterbuch["profil"],
  | "magIch"
  | "magIchNicht"
  | "vorher"
  | "netzSkala"
  | "netzHinweis"
  | "note"
  | "srMag"
  | "srMagNicht"
  | "srNeutral"
  | "staerker"
  | "schwaecher"
  | "aenderung"
  | "aenderungGleich"
  | "verlaufSchritt"
  | "verlaufRegler"
  | "verlaufAbspielen"
  | "verlaufAnhalten"
>;

export function aromaNetzTexte(p: Woerterbuch["profil"]): AromaNetzTexte {
  const { magIch, magIchNicht, vorher, netzSkala, netzHinweis, note, srMag, srMagNicht, srNeutral, staerker, schwaecher } = p;
  const { aenderung, aenderungGleich, verlaufSchritt, verlaufRegler, verlaufAbspielen, verlaufAnhalten } = p;
  return {
    magIch, magIchNicht, vorher, netzSkala, netzHinweis, note, srMag, srMagNicht, srNeutral, staerker, schwaecher,
    aenderung, aenderungGleich, verlaufSchritt, verlaufRegler, verlaufAbspielen, verlaufAnhalten,
  };
}

/** Ein Stand des Netzes; Datum und Zahl nur, wenn er aus dem Verlauf stammt. */
export type NetzStand = { geschmack: Geschmack; datum?: string; anzahl?: number };

type Props = {
  /** Älteste zuerst; der letzte ist der heutige Stand. Ab zwei Ständen erscheint die Zeitleiste. */
  staende: readonly NetzStand[];
  texte: AromaNetzTexte;
  achsen: Woerterbuch["label"]["geschmack"];
  sprache: Sprache;
  className?: string;
};

/** Bewegung zwischen zwei Ständen: auf dem Schirm, also beidseitig weich (emil-design-eng). */
const MORPH_MS = 520;
const MORPH_KURVE = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
/** Takt beim Abspielen: Morph plus kurzes Stehen, damit jeder Stand lesbar bleibt. */
const TAKT_MS = 1100;

/**
 * Das Aroma-Netz im Browser (Nutzer 2026-10-09): Farb-Blüte, Achsen als Icons,
 * Name und Wert in der Mitte beim Überfahren oder Antippen einer Marke, und der
 * Verlauf im selben Netz statt in einem eigenen Feld: Zeitleiste mit einem
 * Punkt je Bewertung und „Verlauf abspielen“, das Netz wächst dabei von der
 * ersten bis zur neuesten Bewertung. Der vorige Stand steht als dünne Kontur.
 *
 * Bewegung per requestAnimationFrame über die Werte, nicht über CSS: Blüte,
 * Rand und Punkte müssen synchron morphen. Reduzierte Bewegung springt.
 * Screenreader bekommen die Werte als Liste und den Stand im aria-valuetext;
 * das SVG ist stumm. Nur Aroma, nie Wirkung (HWG).
 */
export function AromaNetz({ staende, texte, achsen, sprache, className = "w-full max-w-md" }: Props) {
  const letzter = staende.length - 1;
  const [index, setIndex] = useState(letzter);
  const [aktiv, setAktiv] = useState<number | null>(null);
  const [spielt, setSpielt] = useState(false);
  const ziel = staende[Math.min(Math.max(index, 0), letzter)]?.geschmack;
  const [anzeige, setAnzeige] = useState<Geschmack | undefined>(ziel);
  const gezeigt = useRef(ziel);

  // Morph vom gerade gezeigten Stand zum Ziel.
  useEffect(() => {
    if (!ziel) return;
    const von = gezeigt.current ?? ziel;
    let rahmen = 0;
    if (von === ziel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rahmen = requestAnimationFrame(() => {
        gezeigt.current = ziel;
        setAnzeige(ziel);
      });
      return () => cancelAnimationFrame(rahmen);
    }
    const beginn = performance.now();
    const schritt = (jetzt: number) => {
      const fortschritt = Math.min(1, (jetzt - beginn) / MORPH_MS);
      const zwischen = zwischenGeschmack(von, ziel, MORPH_KURVE(fortschritt));
      gezeigt.current = fortschritt < 1 ? zwischen : ziel;
      setAnzeige(gezeigt.current);
      if (fortschritt < 1) rahmen = requestAnimationFrame(schritt);
    };
    rahmen = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(rahmen);
  }, [ziel]);

  // Abspielen: ein Stand je Takt bis zum neuesten, dann halt.
  useEffect(() => {
    if (!spielt) return;
    if (index >= letzter) {
      const ende = setTimeout(() => setSpielt(false), 0);
      return () => clearTimeout(ende);
    }
    const weiter = setTimeout(() => setIndex((i) => Math.min(i + 1, letzter)), TAKT_MS);
    return () => clearTimeout(weiter);
  }, [spielt, index, letzter]);

  if (!ziel || !anzeige) return null;

  const i = Math.min(Math.max(index, 0), letzter);
  const stand = staende[i];
  const { mag, magNicht } = netzAusGeschmack(anzeige);
  const endWerte = netzAusGeschmack(ziel);
  const kontur = i > 0 ? netzAusGeschmack(staende[i - 1].geschmack).mag : null;
  const hatMag = endWerte.mag.some((x) => x > 0);
  const hatMagNicht = endWerte.magNicht.some((x) => x > 0);
  const hatKontur = !!kontur && kontur.some((x) => x > 0);
  const mitVerlauf = staende.length >= 2;

  // Satz je Achse für Screenreader und Marken, aus dem Zielstand (nicht aus einem Zwischenbild).
  const beschreibung = GESCHMACKS_ACHSEN.map((a, n) => {
    const achse = achsen[a.enumWert];
    if (endWerte.mag[n] > 0) return t(texte.srMag, { achse, wert: formatiereWert(endWerte.mag[n], sprache) });
    if (endWerte.magNicht[n] > 0) return t(texte.srMagNicht, { achse, wert: formatiereWert(endWerte.magNicht[n], sprache) });
    return t(texte.srNeutral, { achse });
  });

  let standText: string | null = null;
  let aenderung: string | null = null;
  if (mitVerlauf && stand.datum && stand.anzahl !== undefined) {
    const datum = formatiereDatum(stand.datum, sprache);
    standText = t(texte.verlaufSchritt, { anzahl: stand.anzahl, gesamt: staende[letzter].anzahl ?? staende.length, datum });
    if (i > 0) {
      const liste = netzAenderung(staende[i - 1].geschmack, stand.geschmack);
      aenderung = liste.length > 0 ? t(texte.aenderung, { datum, liste: aenderungsListe(liste, achsen, texte) }) : t(texte.aenderungGleich, { datum });
    }
  }

  const lesung = aktiv === null ? null : (() => {
    const a = GESCHMACKS_ACHSEN[aktiv];
    const wert =
      endWerte.mag[aktiv] > 0
        ? `${texte.magIch} · ${t(texte.note, { note: formatiereWert(endWerte.mag[aktiv], sprache) })}`
        : endWerte.magNicht[aktiv] > 0
          ? `${texte.magIchNicht} · ${t(texte.note, { note: formatiereWert(endWerte.magNicht[aktiv], sprache) })}`
          : null;
    return { geschmack: a.enumWert, name: achsen[a.enumWert], wert };
  })();

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className={`relative ${className}`}>
        <NetzGrafik
          mag={mag}
          magNicht={magNicht}
          kontur={hatKontur ? kontur : null}
          marken
          aktiv={aktiv}
          bedienung={{ beschreibung, waehle: setAktiv }}
          className="w-full"
        />
        {lesung ? (
          <div
            aria-hidden="true"
            className="netz-lesung pointer-events-none absolute top-1/2 left-1/2 grid size-36 -translate-x-1/2 -translate-y-1/2 place-content-center justify-items-center gap-1 rounded-full border border-border bg-surface-raised/90 p-4 text-center shadow-md backdrop-blur-sm"
            style={{ borderColor: vollFarbe(lesung.geschmack) }}
          >
            <GeschmackIcon geschmack={lesung.geschmack} className="size-6 text-text" />
            <span className="font-buch text-h3 leading-tight text-text">{lesung.name}</span>
            {lesung.wert ? <span className="text-caption text-text-muted text-balance">{lesung.wert}</span> : null}
          </div>
        ) : null}
      </div>

      {hatMag || hatMagNicht ? (
        <>
          <NetzLegende mag={texte.magIch} magNicht={hatMagNicht ? texte.magIchNicht : null} vorher={hatKontur ? texte.vorher : null} />
          <p className="text-center text-small text-text-muted text-pretty">
            {texte.netzSkala}. {texte.netzHinweis}
          </p>
          <ul className="sr-only">
            {beschreibung.map((satz, n) => (
              <li key={GESCHMACKS_ACHSEN[n].key}>{satz}</li>
            ))}
          </ul>
        </>
      ) : null}

      {mitVerlauf ? (
        <div className="flex w-full max-w-md flex-col gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label={spielt ? texte.verlaufAnhalten : texte.verlaufAbspielen}
              aria-pressed={spielt}
              onClick={() => {
                if (spielt) return setSpielt(false);
                if (i >= letzter) setIndex(0);
                setSpielt(true);
              }}
              className="netz-abspielen grid size-11 shrink-0 place-items-center rounded-full border border-border-strong text-text transition-colors duration-fast ease-standard hover:border-accent hover:text-accent"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="currentColor">
                {spielt ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l11-6.5z" />}
              </svg>
            </button>
            <label className="relative flex min-w-0 flex-1 flex-col gap-2">
              <span className="sr-only">{texte.verlaufRegler}</span>
              {/* Ein Punkt je Bewertung; vergangene in Akzent, kommende gedämpft. Dekoration, der Regler trägt den Wert. */}
              <span aria-hidden="true" className="netz-zeitleiste-punkte pointer-events-none absolute inset-x-0 top-1/2">
                {staende.map((s, n) => (
                  <span
                    key={`${s.datum ?? n}-${n}`}
                    data-vergangen={n <= i ? "" : undefined}
                    className="netz-zeitleiste-punkt absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: `calc(0.625rem + (100% - 1.25rem) * ${n / letzter})` }}
                  />
                ))}
              </span>
              <input
                type="range"
                min={0}
                max={letzter}
                step={1}
                value={i}
                aria-valuetext={standText ? (aenderung ? `${standText}. ${aenderung}` : standText) : undefined}
                onChange={(e) => {
                  setSpielt(false);
                  setIndex(Number(e.currentTarget.value));
                }}
                className="netz-zeitleiste relative min-h-11 w-full"
              />
            </label>
          </div>
          {standText ? <p aria-hidden="true" className="text-center text-small text-text-muted numeric">{standText}</p> : null}
          {aenderung ? <p className="text-center text-small text-text-muted text-pretty">{aenderung}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
