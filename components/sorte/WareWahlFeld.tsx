"use client";

import Link from "next/link";
import { useState } from "react";

import { namenLinkKlassen, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatiereProzentSpanne } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { WareKarte } from "@/lib/query/sorte";

type Props = {
  waren: readonly WareKarte[];
  vorgewaehlt: { vertreiberId: string | null; strainId: string | null };
  texte: Woerterbuch["bluete"]["vertreiber"];
  sprache: Sprache;
  /** Für „Vertreiber fehlt? Vorschlagen“; ohne entfällt der Link. */
  kultivarId?: string;
};

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
 * Zuordnung im Bewertungsformular (Spec Sorte im Fokus, 2; Plan 2026-10-22): der Vertreiber ist Nebensache
 * und wird nur hier gewählt. Mehrere Vertreiber: Pflicht-Select, ohne Vorwahl offen; einer: nur ein Satz.
 * Variante freiwillig und nur, wenn der Vertreiber mehrere Produkte der Sorte führt. Schreibt die Felder
 * `vertreiberId` und `strainId` (leer = „Weiß ich nicht“); geprüft wird in der Server Action.
 */
export function WareWahlFeld({ waren, vorgewaehlt, texte, sprache, kultivarId }: Props) {
  // Ohne bekannten Vertreiber lässt sich nicht bewerten (Pflichtfeld); solche Waren stehen hier nicht.
  const waehlbar = waren.filter((w) => w.vertreiberId);
  const einziger = waehlbar.length === 1 ? waehlbar[0] : null;
  const start = einziger ?? waehlbar.find((w) => w.vertreiberId === vorgewaehlt.vertreiberId);
  const [vertreiberId, setVertreiberId] = useState(start?.vertreiberId ?? "");
  const [strainId, setStrainId] = useState(
    start && start.produkte.length > 1 && start.produkte.some((p) => p.id === vorgewaehlt.strainId) ? (vorgewaehlt.strainId ?? "") : "",
  );
  const ware = waehlbar.find((w) => w.vertreiberId === vertreiberId);

  const [vor, nach = ""] = texte.wahlKurz.split("{name}");
  const vorschlagen = kultivarId ? (
    <Link prefetch={false} href={`/vorschlagen?kultivar=${kultivarId}`} className={namenLinkKlassen()}>
      {texte.fehlt}
    </Link>
  ) : null;

  return (
    <div className="flex flex-col gap-8">
      <input type="hidden" name="strainId" value={strainId} />

      {einziger ? (
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-body text-text">
          <input type="hidden" name="vertreiberId" value={vertreiberId} />
          <span>
            {vor}
            <strong className="font-medium">{einziger.vertreiberName || texte.unbekannt}</strong>
            {nach}
          </span>
          {vorschlagen}
        </p>
      ) : (
        <div className="flex max-w-md flex-col gap-2">
          <Select
            id="ware-wahl-vertreiber"
            name="vertreiberId"
            required
            label={texte.wahlLabel}
            hinweis={texte.wahlHinweis}
            platzhalter={texte.wahlPlatzhalter}
            optionen={waehlbar.map((w) => ({ wert: w.vertreiberId, label: w.vertreiberName || texte.unbekannt }))}
            value={vertreiberId}
            onChange={(e) => {
              setVertreiberId(e.target.value);
              setStrainId("");
            }}
          />
          {vorschlagen ? <p className="text-small">{vorschlagen}</p> : null}
        </div>
      )}

      {ware && ware.produkte.length > 1 ? (
        <div role="group" aria-labelledby="ware-wahl-staerke" aria-describedby="ware-wahl-staerke-hinweis" className="flex flex-col gap-4">
          <h3 id="ware-wahl-staerke" className="text-h3 text-text">
            {texte.staerkeTitel}
          </h3>
          <p id="ware-wahl-staerke-hinweis" className="max-w-[68ch] text-small text-pretty text-text-muted">
            {texte.staerkeHinweis}
          </p>
          <ul className="flex flex-wrap gap-2">
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
    </div>
  );
}
