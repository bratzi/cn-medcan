"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { NetzGrafik, geschmacksAchsen, markenLage, terpenAchsen } from "@/components/profil/NetzGrafik";
import { NetzLegende } from "@/components/profil/NetzLegende";
import { naechsteWahl } from "@/lib/ansicht-taste";
import type { AromaNetzTexte } from "@/lib/aroma-netz-texte";
import { formatiereDatum, formatiereWert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import {
  geschmackVektor,
  lesungsLage,
  netzAusVektor,
  terpenVektor,
  vektorAenderung,
  zwischenVektor,
  type LesungsLage,
  type NetzModus,
} from "@/lib/netz-vektor";
import type { Geschmack } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";
import { TERPEN_ACHSEN, leeresTerpenNetz, type TerpenNetz } from "@/lib/terpen-achsen";

/** Ein Stand des Netzes; Datum und Zahl nur, wenn er aus dem Verlauf stammt. `terpene` fehlt bei Verlauf vor 2026-10-09. */
export type NetzStand = { geschmack: Geschmack; terpene?: TerpenNetz; datum?: string; anzahl?: number };

type Props = {
  /** Älteste zuerst; der letzte ist der heutige Stand. Ab zwei Ständen erscheint die Zeitleiste. */
  staende: readonly NetzStand[];
  texte: AromaNetzTexte;
  /** Namen der Geschmacksachsen in der Sprache der Seite. */
  achsen: Woerterbuch["label"]["geschmack"];
  sprache: Sprache;
  className?: string;
};

/** Bewegung zwischen zwei Ständen: auf dem Schirm, also beidseitig weich (emil-design-eng). */
const MORPH_MS = 520;
const MORPH_KURVE = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
/** Takt beim Abspielen: Morph plus kurzes Stehen, damit jeder Stand lesbar bleibt. */
const TAKT_MS = 1100;
const MODI: readonly NetzModus[] = ["geschmack", "terpene"];

/**
 * Das Aroma-Netz im Browser (Nutzer 2026-10-09): Farb-Blüte, Achsen als Icons, Verlauf im selben Netz
 * mit Zeitleiste und „Verlauf abspielen“, der vorige Stand als dünne Kontur.
 *
 * Seit 2026-10-09 (Spec Netz/Terpene) zwei Ansichten mit einem Schalter: die zehn Geschmäcker oder die
 * zehn festen Hauptterpene; der Wechsel morpht. Name und Wert einer Achse stehen beim Überfahren,
 * Fokussieren oder Antippen außen an ihrer Marke, nicht mehr in der Mitte; sie dürfen über Nachbarn
 * ragen und spiegeln nach innen, wenn außen kein Platz ist.
 *
 * Bewegung per requestAnimationFrame über die Werte, nicht über CSS: Blüte, Rand und Punkte müssen
 * synchron morphen. Reduzierte Bewegung springt. Screenreader bekommen die Werte als Liste und den
 * Stand im aria-valuetext; das SVG ist stumm. Nur Aroma, nie Wirkung (HWG).
 */
export function AromaNetz({ staende, texte, achsen: achsenTexte, sprache, className = "w-full max-w-md" }: Props) {
  const [modus, setModus] = useState<NetzModus>("geschmack");
  const [index, setIndex] = useState(staende.length - 1);
  const [aktiv, setAktiv] = useState<number | null>(null);
  const [lage, setLage] = useState<LesungsLage>({ seite: "oben" });
  const [spielt, setSpielt] = useState(false);
  const rahmen = useRef<HTMLDivElement>(null);

  const hatTerpene = Object.values(staende[staende.length - 1]?.terpene ?? {}).some((x) => x !== 0);
  // Verlauf vor 2026-10-09 trägt keine Terpene: dann zeigt der Terpen-Modus nur den heutigen Stand.
  const terpenVerlauf = staende.every((s) => s.terpene);
  const reihe = modus === "terpene" && !terpenVerlauf ? staende.slice(-1) : staende;
  const letzter = reihe.length - 1;
  const i = Math.min(Math.max(index, 0), letzter);
  const vektor = (s: NetzStand) => (modus === "terpene" ? terpenVektor(s.terpene ?? leeresTerpenNetz()) : geschmackVektor(s.geschmack));
  const zielSchluessel = reihe[i] ? vektor(reihe[i]).join(",") : "";
  const ziel = useMemo(() => (zielSchluessel ? zielSchluessel.split(",").map(Number) : null), [zielSchluessel]);
  const [anzeige, setAnzeige] = useState<number[] | null>(ziel);
  const gezeigt = useRef(ziel);

  // Morph vom gerade gezeigten Stand zum Ziel; ein Moduswechsel ist derselbe Weg.
  useEffect(() => {
    if (!ziel) return;
    const von = gezeigt.current ?? ziel;
    let rahmenId = 0;
    if (von.join(",") === ziel.join(",") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rahmenId = requestAnimationFrame(() => {
        gezeigt.current = ziel;
        setAnzeige(ziel);
      });
      return () => cancelAnimationFrame(rahmenId);
    }
    const beginn = performance.now();
    const schritt = (jetzt: number) => {
      const fortschritt = Math.min(1, (jetzt - beginn) / MORPH_MS);
      gezeigt.current = fortschritt < 1 ? zwischenVektor(von, ziel, MORPH_KURVE(fortschritt)) : ziel;
      setAnzeige(gezeigt.current);
      if (fortschritt < 1) rahmenId = requestAnimationFrame(schritt);
    };
    rahmenId = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(rahmenId);
  }, [ziel]);

  // Abspielen: ein Stand je Takt bis zum neuesten, dann halt.
  useEffect(() => {
    if (!spielt) return;
    if (index >= letzter) {
      const ende = setTimeout(() => setSpielt(false), 0);
      return () => clearTimeout(ende);
    }
    const weiter = setTimeout(() => setIndex((n) => Math.min(n + 1, letzter)), TAKT_MS);
    return () => clearTimeout(weiter);
  }, [spielt, index, letzter]);

  if (!ziel || !anzeige) return null;

  const achsen = modus === "terpene" ? terpenAchsen() : geschmacksAchsen();
  const namen =
    modus === "terpene" ? TERPEN_ACHSEN.map((a) => terpenAnzeige(a.name, sprache)) : GESCHMACKS_ACHSEN.map((a) => achsenTexte[a.enumWert]);
  const stand = reihe[i];
  const { mag, magNicht } = netzAusVektor(anzeige);
  const endWerte = netzAusVektor(ziel);
  const kontur = i > 0 ? netzAusVektor(vektor(reihe[i - 1])).mag : null;
  const hatMag = endWerte.mag.some((x) => x > 0);
  const hatMagNicht = endWerte.magNicht.some((x) => x > 0);
  const hatKontur = !!kontur && kontur.some((x) => x > 0);
  const mitVerlauf = reihe.length >= 2;

  // Satz je Achse für Screenreader und Marken, aus dem Zielstand (nicht aus einem Zwischenbild).
  const beschreibung = namen.map((achse, n) => {
    if (endWerte.mag[n] > 0) return t(texte.srMag, { achse, wert: formatiereWert(endWerte.mag[n], sprache) });
    if (endWerte.magNicht[n] > 0) return t(texte.srMagNicht, { achse, wert: formatiereWert(endWerte.magNicht[n], sprache) });
    return t(texte.srNeutral, { achse });
  });

  let standText: string | null = null;
  let aenderung: string | null = null;
  if (mitVerlauf && stand.datum && stand.anzahl !== undefined) {
    const datum = formatiereDatum(stand.datum, sprache);
    standText = t(texte.verlaufSchritt, { anzahl: stand.anzahl, gesamt: reihe[letzter].anzahl ?? reihe.length, datum });
    if (i > 0) {
      const liste = vektorAenderung(vektor(reihe[i - 1]), vektor(stand));
      aenderung =
        liste.length > 0
          ? t(texte.aenderung, {
              datum,
              liste: liste.map((a) => t(a.differenz > 0 ? texte.staerker : texte.schwaecher, { achse: namen[a.index] })).join(", "),
            })
          : t(texte.aenderungGleich, { datum });
    }
  }

  const lesung =
    aktiv === null || aktiv >= achsen.length
      ? null
      : {
          achse: achsen[aktiv],
          name: namen[aktiv],
          ort: markenLage(aktiv, achsen.length),
          wert:
            endWerte.mag[aktiv] > 0
              ? `${texte.magIch} · ${t(texte.note, { note: formatiereWert(endWerte.mag[aktiv], sprache) })}`
              : endWerte.magNicht[aktiv] > 0
                ? `${texte.magIchNicht} · ${t(texte.note, { note: formatiereWert(endWerte.magNicht[aktiv], sprache) })}`
                : null,
        };

  // Wohin die Lesung aufgeht: nach außen, gespiegelt, wenn der Viewport dort zu knapp ist.
  const waehle = (achse: number | null) => {
    if (achse !== null && rahmen.current) {
      const r = rahmen.current.getBoundingClientRect();
      const x = r.left + (markenLage(achse, achsen.length).x / 100) * r.width;
      setLage(lesungsLage(achse, achsen.length, { links: x, rechts: window.innerWidth - x }));
    }
    setAktiv(achse);
  };

  const wechsle = (neu: NetzModus) => {
    if (neu === modus) return;
    setModus(neu);
    setAktiv(null);
    setSpielt(false);
    setIndex(staende.length - 1);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {hatTerpene ? (
        // Ansichts-Schalter als Radiogroup (APG) wie „Karte | Netz“ im Buch: ein Tabstopp, Pfeiltasten wählen.
        <div role="radiogroup" aria-label={texte.modusWahl} className="inline-flex rounded-full border border-border-strong p-1">
          {MODI.map((wahl, n) => (
            <button
              key={wahl}
              type="button"
              role="radio"
              aria-checked={modus === wahl}
              tabIndex={modus === wahl ? 0 : -1}
              onClick={() => wechsle(wahl)}
              onKeyDown={(e) => {
                const zielIndex = naechsteWahl(e.key, n, MODI.length);
                if (zielIndex === null) return;
                e.preventDefault();
                wechsle(MODI[zielIndex]);
                e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[zielIndex]?.focus();
              }}
              className={`inline-flex h-9 items-center rounded-full px-4 text-small font-medium pointer-coarse:h-11 transition-[color,background-color,scale] duration-[var(--duration-fast),var(--duration-fast),120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:active:scale-[0.97] ${
                modus === wahl ? "bg-accent text-accent-fg" : "text-text hover:text-accent-hover"
              }`}
            >
              {wahl === "geschmack" ? texte.modusGeschmack : texte.modusTerpene}
            </button>
          ))}
        </div>
      ) : null}

      <div ref={rahmen} className={`relative overflow-visible ${className}`}>
        <NetzGrafik
          mag={mag}
          magNicht={magNicht}
          kontur={hatKontur ? kontur : null}
          marken
          achsen={achsen}
          aktiv={aktiv}
          bedienung={{ beschreibung, waehle }}
          className="w-full"
        />
        {lesung ? (
          <div
            aria-hidden="true"
            data-seite={lage.seite}
            className="netz-lesung pointer-events-none absolute z-20 grid w-44 justify-items-start gap-1 rounded-lg border bg-surface-raised/95 p-3 text-start shadow-md backdrop-blur-sm"
            style={{ left: `${lesung.ort.x}%`, top: `${lesung.ort.y}%`, borderColor: lesung.achse.farbe }}
          >
            <span className="flex items-center gap-2 text-text">
              {lesung.achse.icon}
              <span className="font-buch text-h3 leading-tight">{lesung.name}</span>
            </span>
            {lesung.wert ? <span className="text-caption text-text-muted text-balance">{lesung.wert}</span> : null}
          </div>
        ) : null}
      </div>

      {hatMag || hatMagNicht ? (
        <>
          <NetzLegende mag={texte.magIch} magNicht={hatMagNicht ? texte.magIchNicht : null} vorher={hatKontur ? texte.vorher : null} />
          <p className="text-center text-small text-text-muted text-pretty">
            {modus === "terpene" ? texte.terpenSkala : texte.netzSkala}. {texte.netzHinweis}
          </p>
          <ul className="sr-only">
            {beschreibung.map((satz, n) => (
              <li key={achsen[n].key}>{satz}</li>
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
                {reihe.map((s, n) => (
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
