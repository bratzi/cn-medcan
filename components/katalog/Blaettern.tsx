"use client";

import type { MouseEvent } from "react";

import { cn } from "@/lib/cn";
import { formatiereZahl } from "@/lib/format";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = {
  seite: number;
  seitenAnzahl: number;
  geheZu: (seite: number) => void;
  hrefFuer: (seite: number) => string;
  texte: Pick<Woerterbuch["katalog"], "seitennavigation" | "vorige" | "naechste" | "seiteVon">;
};

/** Erste, letzte und ±1 um die aktuelle Seite; Lücken als null. */
export function seitenFolge(seite: number, anzahl: number): (number | null)[] {
  const menge = new Set([1, anzahl, seite - 1, seite, seite + 1].filter((s) => s >= 1 && s <= anzahl));
  const sortiert = [...menge].sort((a, b) => a - b);
  const folge: (number | null)[] = [];
  sortiert.forEach((s, i) => {
    if (i > 0 && s - sortiert[i - 1] > 1) folge.push(null);
    folge.push(s);
  });
  return folge;
}

const PILLE =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-4 text-small transition-colors duration-fast ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/**
 * Seitennavigation: echte Links (ohne JS funktionsfähig), mit JS blättert `geheZu` ohne Neuladen.
 * Modifizierte Klicks (neuer Tab) bleiben beim Browser.
 */
export function Blaettern({ seite, seitenAnzahl, geheZu, hrefFuer, texte }: Props) {
  if (seitenAnzahl <= 1) return null;

  const klick = (ziel: number) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    geheZu(ziel);
  };

  return (
    <nav aria-label={texte.seitennavigation} className="flex flex-col items-center gap-2">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {seite > 1 ? (
          <li>
            <a href={hrefFuer(seite - 1)} onClick={klick(seite - 1)} rel="prev" className={cn(PILLE, "border-border-strong text-text hover:border-text")}>
              <span aria-hidden="true">‹</span>
              <span className="sr-only">{texte.vorige}</span>
            </a>
          </li>
        ) : null}
        {seitenFolge(seite, seitenAnzahl).map((s, i) =>
          s === null ? (
            <li key={`luecke-${i}`} aria-hidden="true" className="px-2 text-small text-text-muted">
              …
            </li>
          ) : s === seite ? (
            <li key={s}>
              <a href={hrefFuer(s)} onClick={klick(s)} aria-current="page" className={cn(PILLE, "numeric border-text bg-text text-surface")}>
                {formatiereZahl(s, 0)}
              </a>
            </li>
          ) : (
            <li key={s}>
              <a href={hrefFuer(s)} onClick={klick(s)} className={cn(PILLE, "numeric border-border-strong text-text hover:border-text")}>
                {formatiereZahl(s, 0)}
              </a>
            </li>
          ),
        )}
        {seite < seitenAnzahl ? (
          <li>
            <a href={hrefFuer(seite + 1)} onClick={klick(seite + 1)} rel="next" className={cn(PILLE, "border-border-strong text-text hover:border-text")}>
              <span aria-hidden="true">›</span>
              <span className="sr-only">{texte.naechste}</span>
            </a>
          </li>
        ) : null}
      </ul>
      <p className="numeric text-caption text-text-muted">{t(texte.seiteVon, { seite, seiten: seitenAnzahl })}</p>
    </nav>
  );
}
