"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { textLinkKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatiereProzentSpanne } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { WareKarte } from "@/lib/query/sorte";

export type VertreiberEintrag = { id: string; name: string; logoPfad?: string | null };

type Props = {
  waren: readonly WareKarte[];
  /** Alle Vertreiber aus der Datenbank (ladeAlleVertreiber); jeder ist bei jedem Strain wählbar. */
  alleVertreiber: readonly VertreiberEintrag[];
  vorgewaehlt: { vertreiberId: string | null; strainId: string | null };
  texte: Woerterbuch["bluete"]["vertreiber"];
  sprache: Sprache;
  /** Für „Vertreiber vorschlagen“; ohne entfällt der Link. */
  kultivarId?: string;
};

/**
 * Zwei Gruppen für die Wahl (Nutzer 2026-10-22): zuerst die Vertreiber, die diesen Strain gelistet
 * führen, in der Reihenfolge der Waren (nach Zahl der Bewertungen); dann alle übrigen alphabetisch.
 * Waren ohne bekannten Vertreiber entfallen, eine Option „Vertreiber unbekannt“ gibt es nicht.
 */
export function vertreiberGruppen(waren: readonly WareKarte[], alle: readonly VertreiberEintrag[]) {
  const gelistet = waren
    .filter((w) => w.vertreiberId)
    .map((w) => ({ id: w.vertreiberId, name: w.vertreiberName, logoPfad: w.vertreiberLogo ?? null, anzahl: w.anzahl }));
  const ids = new Set(gelistet.map((v) => v.id));
  const weitere = alle.filter((v) => !ids.has(v.id)).sort((a, b) => a.name.localeCompare(b.name, "de"));
  return { gelistet, weitere };
}

/** Chip: Pille, mindestens 44 px hoch (Fitts); gewählt gefüllt und mit Haken, nicht nur über Farbe. */
const CHIP = "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-small transition-colors duration-fast ease-standard";
const AN = "border-accent bg-accent text-accent-fg";
const AUS = "border-border-strong bg-surface text-text hover:border-accent-hover hover:text-accent-hover";

function Haken() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0">
      <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


/** Zwei Buchstaben für die Initialen-Marke, wenn kein Logo hinterlegt ist. */
function initialen(name: string): string {
  return name
    .split(/\s+/)
    .filter((teil) => /^[\p{L}\d]/u.test(teil))
    .slice(0, 2)
    .map((teil) => teil[0])
    .join("")
    .toUpperCase();
}

type KarteDaten = { id: string; name: string; logoPfad?: string | null };

/**
 * Eine Karte der Vertreiberwahl: natives Radio im Label (Pfeiltasten, Pflicht und Formulardaten kommen
 * vom Browser), Logo auf heller Fläche oder Initialen, Name, darunter klein der Stand. Gewählt mit
 * Akzentring und Haken, nicht nur über Farbe. 152 px breit, damit die nächste Karte sichtbar anschneidet.
 */
function VertreiberKarte({ v, an, unterzeile, onWahl, pflicht }: { v: KarteDaten; an: boolean; unterzeile: string | null; onWahl: () => void; pflicht: boolean }) {
  return (
    <li className="w-38 shrink-0 snap-start">
      <label
        className={cn(
          "relative flex h-full min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border bg-surface px-3 py-4 text-center transition-[border-color,background-color,scale] duration-fast ease-out active:scale-97 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring",
          an ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border hover:border-border-strong",
        )}
      >
        <input type="radio" name="vertreiberId" value={v.id} checked={an} onChange={onWahl} required={pflicht} className="sr-only" />
        {an ? (
          <span aria-hidden="true" className="absolute top-2 right-2 text-accent">
            <Haken />
          </span>
        ) : null}
        {v.logoPfad ? (
          // Helle Logofläche in beiden Themen: Herstellerlogos sind für helles Papier gezeichnet.
          <span aria-hidden="true" className="flex h-10 w-full max-w-28 items-center justify-center rounded-lg bg-[oklch(0.97_0.004_160)] px-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- kleines statisches Logo aus public/, kein Bilddienst */}
            <img src={v.logoPfad} alt="" loading="lazy" className="max-h-7 w-auto max-w-full object-contain" />
          </span>
        ) : (
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full border border-border-strong font-buch text-small font-medium text-text">
            {initialen(v.name)}
          </span>
        )}
        <span className="line-clamp-2 text-small font-medium text-balance text-text">{v.name}</span>
        {unterzeile ? <span className="numeric text-caption text-text-muted">{unterzeile}</span> : null}
      </label>
    </li>
  );
}

function Pfeil({ richtung }: { richtung: "links" | "rechts" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
      <path d={richtung === "links" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PFEIL =
  "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border-strong bg-surface text-text shadow-sm transition-[color,scale] duration-fast ease-out hover:text-accent active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:flex";

/**
 * Zuordnung im Bewertungsformular (Spec Sorte im Fokus, 2; Nutzer 2026-10-22): der Vertreiber ist Pflicht,
 * aber Nebensache. Eine zentrierte Karteikarte zwischen zwei Linien: Vermerk, Frage, Hinweis, Wahl, darunter
 * die Bestätigung im Buchsatz. Alle Vertreiber sind wählbar, die gelisteten stehen oben. Variante freiwillig
 * und nur, wenn der gewählte Vertreiber mehrere Produkte der Sorte führt. Schreibt `vertreiberId` und
 * `strainId` (leer = „Weiß ich nicht“); geprüft wird in der Server Action.
 */
export function WareWahlFeld({ waren, alleVertreiber, vorgewaehlt, texte, sprache, kultivarId }: Props) {
  const { gelistet, weitere } = vertreiberGruppen(waren, alleVertreiber);
  const bekannt = [...gelistet, ...weitere];
  const startId =
    (vorgewaehlt.vertreiberId && bekannt.some((v) => v.id === vorgewaehlt.vertreiberId) ? vorgewaehlt.vertreiberId : null) ??
    (gelistet.length === 1 ? gelistet[0].id : "");
  const startWare = waren.find((w) => w.vertreiberId === startId);
  const [vertreiberId, setVertreiberId] = useState(startId);
  const [strainId, setStrainId] = useState(
    startWare && startWare.produkte.length > 1 && startWare.produkte.some((p) => p.id === vorgewaehlt.strainId)
      ? (vorgewaehlt.strainId ?? "")
      : "",
  );
  const ware = waren.find((w) => w.vertreiberId && w.vertreiberId === vertreiberId);
  const gewaehlt = bekannt.find((v) => v.id === vertreiberId);
  const reihe = useRef<HTMLUListElement>(null);
  function waehle(id: string) {
    setVertreiberId(id);
    setStrainId("");
  }
  /** Eine Seite weiter: um 80 % der sichtbaren Breite, Snap richtet die Karte aus. */
  function blaettern(richtung: 1 | -1) {
    const el = reihe.current;
    if (!el) return;
    const leise = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: richtung * el.clientWidth * 0.8, behavior: leise ? "auto" : "smooth" });
  }

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 py-8 text-center"
    >
      <input type="hidden" name="strainId" value={strainId} />
      <div className="flex flex-col items-center gap-2">
        <p aria-hidden="true" className="font-hand text-notiz text-logo">
          {texte.wahlVermerk}
        </p>
        <h3 id="ware-wahl-titel" className="font-buch text-h3 font-medium text-balance text-text">
          {texte.wahlLabel}
        </h3>
        <p className="max-w-[52ch] text-small text-pretty text-text-muted">{texte.wahlHinweis}</p>
      </div>

      {/* Logo-Karten in einem waagerechten Karussell (Nutzer 2026-10-22): wischbar mit Scroll-Snap, Pfeile
          am Rand, Rand-Fade. Gelistete zuerst, eine dünne Linie trennt sie von allen weiteren. Ohne JS bleibt
          es eine scrollbare Reihe nativer Radios. */}
      <div role="radiogroup" aria-labelledby="ware-wahl-titel" aria-required="true" className="relative w-full">
        <button type="button" aria-label={texte.wahlZurueck} onClick={() => blaettern(-1)} className={cn(PFEIL, "-left-5")}>
          <Pfeil richtung="links" />
        </button>
        <ul
          ref={reihe}
          className="flex snap-x snap-mandatory scroll-px-4 items-stretch gap-3 overflow-x-auto overscroll-x-contain px-4 py-2 [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-2rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {gelistet.map((v, i) => (
            <VertreiberKarte
              key={v.id}
              v={v}
              an={v.id === vertreiberId}
              pflicht={i === 0}
              unterzeile={v.anzahl > 0 ? mehrzahl(sprache, texte.anzahl, v.anzahl) : texte.karteGelistet}
              onWahl={() => waehle(v.id)}
            />
          ))}
          {gelistet.length > 0 && weitere.length > 0 ? <li aria-hidden="true" className="w-px shrink-0 self-stretch bg-border" /> : null}
          {weitere.map((v, i) => (
            <VertreiberKarte key={v.id} v={v} an={v.id === vertreiberId} pflicht={gelistet.length === 0 && i === 0} unterzeile={null} onWahl={() => waehle(v.id)} />
          ))}
        </ul>
        <button type="button" aria-label={texte.wahlWeiter} onClick={() => blaettern(1)} className={cn(PFEIL, "-right-5")}>
          <Pfeil richtung="rechts" />
        </button>
      </div>

      {/* Gewählter Vertreiber steht im Select, nicht noch einmal als Satz (Nutzer 2026-10-22); nur der Hinweis bei Ungelisteten. */}
      {gewaehlt && !ware ? (
        <p aria-live="polite" className="max-w-[52ch] text-small text-pretty text-text-muted">
          {texte.nichtGelistet}
        </p>
      ) : null}

      {ware && ware.produkte.length > 1 ? (
        <div
          role="group"
          aria-labelledby="ware-wahl-staerke"
          aria-describedby="ware-wahl-staerke-hinweis"
          key={ware.vertreiberId}
          // Varianten erscheinen direkt mit der Wahl, kurz eingeblendet (@starting-style, ohne JS-Timer).
          className="flex flex-col items-center gap-4 border-t border-border pt-6 transition-[opacity,translate] duration-normal ease-out starting:-translate-y-2 starting:opacity-0 motion-reduce:transition-none"
        >
          <h4 id="ware-wahl-staerke" className="font-buch text-h3 font-medium text-text">
            {texte.staerkeTitel}
          </h4>
          <p id="ware-wahl-staerke-hinweis" className="max-w-[52ch] text-small text-pretty text-text-muted">
            {texte.staerkeHinweis}
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {ware.produkte.map((p) => {
              const an = p.id === strainId;
              return (
                <li key={p.id}>
                  <button type="button" aria-pressed={an} title={p.handelsname} onClick={() => setStrainId(p.id)} className={cn(CHIP, "numeric", an ? AN : AUS)}>
                    {an ? <Haken /> : null}
                    {t(texte.thc, { spanne: formatiereProzentSpanne(p.thcMin, p.thcMax, 1, sprache) })}
                  </button>
                </li>
              );
            })}
            <li>
              <button type="button" aria-pressed={strainId === ""} onClick={() => setStrainId("")} className={cn(CHIP, strainId === "" ? AN : AUS)}>
                {strainId === "" ? <Haken /> : null}
                {texte.weissNicht}
              </button>
            </li>
          </ul>
        </div>
      ) : null}

      {kultivarId ? (
        <p className="text-small text-text-muted">
          {texte.fehltFrage}{" "}
          <Link prefetch={false} href={`/vorschlagen?kultivar=${kultivarId}`} className={textLinkKlassen("inline-flex min-h-11 items-center")}>
            {texte.fehltLink}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
