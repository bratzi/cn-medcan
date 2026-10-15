"use client";

import Link from "next/link";
import { useId, useReducer, useRef, useState, type KeyboardEvent } from "react";

import { ExplorerWareKarte } from "@/components/story/ExplorerWareKarte";
import { differenz, explorerStart, explorerZustand, filtereSorten } from "@/components/story/explorer-zustand";
import { buttonKlassen } from "@/components/ui/Button";
import { INPUT_KLASSEN } from "@/components/ui/Input";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";
import type { KultivarTyp } from "@/db/enums";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { ExplorerSorte, ExplorerWare } from "@/lib/query/sorten-explorer";

type Props = {
  sorten: ExplorerSorte[];
  texte: Woerterbuch["start"]["vertreiber"];
  typen: Record<KultivarTyp, string>;
  sprache: Sprache;
};

/**
 * Sorten-Explorer im Kapitel „Gleiche Blüte, andere Ware“ (Spec 2026-10-15 Abschnitt 4).
 * Daten kommen statisch mit der Startseite; die Reihenfolge stammt aus waehleExplorerSorten
 * (Menge, dann Name), nie aus der Note (HWG). Ohne JavaScript steht die erste Sorte vollständig.
 */
export function SortenExplorer({ sorten, texte, typen, sprache }: Props) {
  const [zustand, senden] = useReducer((z: ReturnType<typeof explorerStart>, a: Parameters<typeof explorerZustand>[0]) => explorerZustand(a, z), sorten, explorerStart);
  const [meldung, setMeldung] = useState("");
  const chips = useRef<Map<string, HTMLButtonElement>>(new Map());
  const suchId = useId();

  const sichtbar = filtereSorten(sorten, zustand.suche);
  const sorte = sorten.find((s) => s.slug === zustand.sorte) ?? sorten[0];
  if (!sorte) return null;
  const ware = sorte.waren.find((w) => w.vertreiberId === zustand.ware) ?? sorte.waren[0];
  const skala = Math.max(...sorte.waren.map((w) => w.thc[1]));
  // Roving tabindex: die gewählte Sorte, oder die erste sichtbare, wenn die Suche sie ausblendet.
  const tabbar = sichtbar.some((s) => s.slug === sorte.slug) ? sorte.slug : sichtbar[0]?.slug;
  const vergleich = zustand.vergleich
    .map((id) => sorte.waren.find((w) => w.vertreiberId === id))
    .filter((w): w is ExplorerWare => w !== undefined);
  const zahl = (wert: number) => formatiereZahl(wert, 1, sprache);

  function waehleSorte(neu: ExplorerSorte) {
    if (neu.slug === sorte?.slug) return;
    senden({ typ: "sorte", slug: neu.slug, ersteWare: neu.waren[0]?.vertreiberId ?? null });
    setMeldung(t(texte.sorteGewechselt, { name: neu.name, waren: mehrzahl(sprache, texte.waren, neu.waren.length) }));
  }

  function tasten(e: KeyboardEvent<HTMLDivElement>) {
    const schritte: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (sichtbar.length === 0) return;
    const jetzt = Math.max(0, sichtbar.findIndex((s) => s.slug === tabbar));
    let ziel: number;
    if (e.key in schritte) ziel = (jetzt + schritte[e.key] + sichtbar.length) % sichtbar.length;
    else if (e.key === "Home") ziel = 0;
    else if (e.key === "End") ziel = sichtbar.length - 1;
    else return;
    e.preventDefault();
    const neu = sichtbar[ziel];
    waehleSorte(neu);
    chips.current.get(neu.slug)?.focus();
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-col gap-4">
        <label htmlFor={suchId} className="text-small text-text-muted">
          {texte.suchen}
        </label>
        <input
          id={suchId}
          type="search"
          autoComplete="off"
          value={zustand.suche}
          onChange={(e) => senden({ typ: "suche", text: e.target.value })}
          className={cn(INPUT_KLASSEN, "max-w-96 rounded-full")}
        />
        {/* Hick: höchstens zwölf Sorten; die Suche grenzt weiter ein. */}
        <div role="radiogroup" aria-label={texte.sortenWahl} onKeyDown={tasten} className="flex flex-wrap gap-2">
          {sichtbar.map((s) => {
            const aktiv = s.slug === sorte.slug;
            return (
              <button
                key={s.slug}
                ref={(el) => {
                  if (el) chips.current.set(s.slug, el);
                  else chips.current.delete(s.slug);
                }}
                type="button"
                role="radio"
                aria-checked={aktiv}
                tabIndex={s.slug === tabbar ? 0 : -1}
                onClick={() => waehleSorte(s)}
                className={cn(
                  "explorer-druck inline-flex h-11 items-center rounded-full border px-4 text-small transition-colors duration-fast ease-standard",
                  aktiv ? "border-accent bg-accent-subtle text-text" : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text",
                )}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        {sichtbar.length === 0 ? <p className="text-small text-text-muted">{t(texte.keineTreffer, { suche: zustand.suche.trim() })}</p> : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-border-strong pt-8">
        <p className="font-buch text-display text-balance text-text wrap-break-word">{sorte.name}</p>
        <p className="text-small text-text-muted">
          {typen[sorte.typ]}, <span className="numeric">{mehrzahl(sprache, texte.waren, sorte.waren.length)}</span>
        </p>
      </div>

      <ul key={sorte.slug} aria-label={t(texte.wareListe, { name: sorte.name })} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sorte.waren.map((w, index) => (
          <ExplorerWareKarte
            key={w.vertreiberId}
            ware={w}
            index={index}
            skala={skala}
            gewaehlt={w.vertreiberId === ware?.vertreiberId}
            imVergleich={vergleich.some((v) => v.vertreiberId === w.vertreiberId)}
            texte={texte}
            sprache={sprache}
            onWaehlen={() => senden({ typ: "ware", id: w.vertreiberId })}
            onVergleichen={() => senden({ typ: "vergleichen", id: w.vertreiberId })}
          />
        ))}
      </ul>

      {vergleich.length === 2 ? (
        <section aria-label={t(texte.vergleichTitel, { a: vergleich[0].vertreiberName, b: vergleich[1].vertreiberName })} className="flex flex-col gap-6 border border-border-strong bg-surface-raised p-6 shadow-md sm:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {vergleich.map((v) => (
              <div key={v.vertreiberId} className="flex flex-col gap-2">
                <p className="font-buch text-h3 font-medium text-text wrap-break-word">{v.vertreiberName}</p>
                <p className="numeric text-small text-text">THC {t(texte.spanne, { von: zahl(v.thc[0]), bis: zahl(v.thc[1]) })}</p>
                <p className="numeric text-small text-text">CBD {t(texte.spanne, { von: zahl(v.cbd[0]), bis: zahl(v.cbd[1]) })}</p>
              </div>
            ))}
          </div>
          <p className="numeric text-body text-text">
            {vergleich[1].vertreiberName}: {differenz(vergleich[1].thc[1], vergleich[0].thc[1], "THC", sprache)},{" "}
            {differenz(vergleich[1].cbd[1], vergleich[0].cbd[1], "CBD", sprache)}
          </p>
          <button type="button" onClick={() => senden({ typ: "vergleichEnde" })} className={buttonKlassen("ghost", "sm", "self-start")}>
            {texte.vergleichEnde}
          </button>
        </section>
      ) : vergleich.length === 1 ? (
        <p className="text-small text-text-muted">{texte.vergleichWahl}</p>
      ) : null}

      {ware ? (
        <div className="flex flex-col gap-4 border-t border-border pt-8">
          <p className="text-body text-text">
            <span className="font-medium">{ware.vertreiberName}</span>
            <span className="text-text-muted">, {mehrzahl(sprache, texte.staerken, ware.staerken)}</span>
          </p>
          {/* Von Restorff und Peak-End: eine gefüllte Aktion, sie lädt zur eigenen Bewertung ein. */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link prefetch={false} href={`/blueten/${sorte.slug}?vertreiber=${encodeURIComponent(ware.vertreiberId)}#bewerten`} className={buttonKlassen("primary", "md")}>
              {texte.wareBewerten}
            </Link>
            <Link prefetch={false} href={`/blueten/${sorte.slug}?vertreiber=${encodeURIComponent(ware.vertreiberId)}`} className={einzelLinkKlassen("text-body")}>
              {texte.zurSorte}
            </Link>
          </div>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {meldung}
      </p>
      <p className="text-small text-text-muted">{texte.hinweis}</p>
    </div>
  );
}
