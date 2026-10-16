"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { ExplorerSorte } from "@/lib/query/sorten-explorer";
import { normalisiereSuche } from "@/lib/sorten-suche";

/** Pause nach dem letzten Tastendruck, bevor gefragt wird. */
const ENTPRELLEN_MS = 250;

type Antwort = { abfrage: string; sorten: ExplorerSorte[] | null };

type Props = {
  text: string;
  onText: (text: string) => void;
  /** Der Treffer wird im Explorer gewählt. */
  onWaehlen: (sorte: ExplorerSorte) => void;
  texte: Woerterbuch["start"]["vertreiber"];
  sprache: Sprache;
};

/**
 * Suchfeld des Sorten-Explorers: ab zwei Zeichen fragt es `/api/sorten-suche` über alle Sorten,
 * nicht nur über die zwölf im Explorer. Darunter stehen die Treffer als Pillen; unter zwei
 * Zeichen bleibt es bei den Pillen des Explorers (dort filtert der Text lokal).
 */
export function SortenSuche({ text, onText, onWaehlen, texte, sprache }: Props) {
  const id = useId();
  const feld = useRef<HTMLInputElement>(null);
  const [antwort, setAntwort] = useState<Antwort | null>(null);
  const abfrage = normalisiereSuche(text);

  useEffect(() => {
    if (!abfrage) return;
    const abbruch = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/sorten-suche?q=${encodeURIComponent(abfrage)}`, { signal: abbruch.signal });
        const daten: { sorten?: ExplorerSorte[] } = res.ok ? await res.json() : {};
        setAntwort({ abfrage, sorten: res.ok ? (daten.sorten ?? []) : null });
      } catch (fehler) {
        if (!(fehler instanceof DOMException && fehler.name === "AbortError")) setAntwort({ abfrage, sorten: null });
      }
    }, ENTPRELLEN_MS);
    return () => {
      clearTimeout(timer);
      abbruch.abort();
    };
  }, [abfrage]);

  // Eine Antwort gilt nur für ihren Suchtext; solange eine andere aussteht, läuft die Suche.
  const aktuell = abfrage && antwort?.abfrage === abfrage ? antwort : null;
  const laedt = abfrage !== null && aktuell === null;
  const treffer = aktuell?.sorten ?? [];

  function leeren() {
    onText("");
    feld.current?.focus();
  }

  function tasten(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape" && text) {
      e.preventDefault();
      onText("");
    } else if (e.key === "Enter" && treffer[0]) {
      e.preventDefault();
      onWaehlen(treffer[0]);
    }
  }

  const ansage = aktuell ? (aktuell.sorten === null ? texte.sucheFehler : treffer.length === 0 ? texte.sucheKeine : mehrzahl(sprache, texte.sucheTreffer, treffer.length)) : "";

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor={id} className="text-small text-text-muted">
        {texte.suchen}
      </label>
      <div className="relative max-w-96">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-muted">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          ref={feld}
          id={id}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          value={text}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={tasten}
          className={cn(
            "h-12 w-full rounded-full border border-border-strong bg-surface pr-12 pl-12 text-body text-text",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          )}
        />
        {text ? (
          <button
            type="button"
            aria-label={texte.sucheLoeschen}
            onClick={leeren}
            className="absolute top-0 right-0 inline-flex size-12 items-center justify-center rounded-full text-text-muted transition-colors duration-fast ease-standard hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-5">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        ) : null}
      </div>

      {laedt ? <Spinner text={texte.sucheLaedt} /> : null}
      {aktuell && treffer.length > 0 ? (
        <ul aria-label={texte.sucheErgebnisse} className="flex flex-wrap gap-2">
          {treffer.map((s) => (
            <li key={s.slug}>
              <button
                type="button"
                onClick={() => onWaehlen(s)}
                className="explorer-druck inline-flex h-11 items-center rounded-full border border-border bg-surface px-4 text-small text-text-muted transition-colors duration-fast ease-standard hover:border-border-strong hover:text-text"
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {aktuell && treffer.length === 0 ? (
        <p className="text-small text-text-muted">{aktuell.sorten === null ? texte.sucheFehler : texte.sucheKeine}</p>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {ansage}
      </p>
    </div>
  );
}
