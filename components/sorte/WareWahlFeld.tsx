"use client";

import Link from "next/link";
import { useState } from "react";

import { Select, textLinkKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatiereProzentSpanne } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { WareKarte } from "@/lib/query/sorte";

export type VertreiberEintrag = { id: string; name: string };

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
  const gelistet = waren.filter((w) => w.vertreiberId).map((w) => ({ id: w.vertreiberId, name: w.vertreiberName }));
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

  return (
    <div
      role="group"
      aria-labelledby="ware-wahl-titel"
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 border-y border-border py-12 text-center"
    >
      <input type="hidden" name="strainId" value={strainId} />
      <div className="flex flex-col items-center gap-2">
        <p aria-hidden="true" className="font-hand text-vermerk text-logo">
          {texte.wahlVermerk}
        </p>
        <h3 id="ware-wahl-titel" className="font-buch text-h3 font-medium text-balance text-text">
          {texte.wahlLabel}
        </h3>
        <p className="max-w-[52ch] text-small text-pretty text-text-muted">{texte.wahlHinweis}</p>
      </div>

      <Select
        id="ware-wahl-vertreiber"
        name="vertreiberId"
        required
        label={texte.wahlLabel}
        labelVersteckt
        platzhalter={texte.wahlPlatzhalter}
        optionen={[]}
        gruppen={[
          { label: texte.gruppeGelistet, optionen: gelistet.map((v) => ({ wert: v.id, label: v.name })) },
          { label: texte.gruppeWeitere, optionen: weitere.map((v) => ({ wert: v.id, label: v.name })) },
        ]}
        value={vertreiberId}
        onChange={(e) => {
          setVertreiberId(e.target.value);
          setStrainId("");
        }}
        feldClassName="w-full max-w-sm"
      />

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
