import { Suspense } from "react";

import { GeschmackIcon, TerpenIcon } from "@/components/review/AromaIcon";
import { baueAnsicht } from "@/components/story/TerpenRegister";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { farbFlaeche } from "@/lib/aroma-farben";
import { ladeTerpenRegister } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";
import { TerpenBandKopie } from "@/components/story/TerpenBandKopie";

/**
 * Band zwischen Hero und Story (Nutzer 2026-09-30): die Terpene des Katalogs
 * laufen als Icons waagrecht durch. Hover oder Tastaturfokus hält das Band an
 * und zeigt im Tooltip Duft und Geschmäcker des Terpens, mit Farbpunkt und
 * Anteilsbalken wie im Register. Der Server rendert die Liste nur einmal
 * (CPU-Limit, Fehler 1102); die zweite Kopie für den nahtlosen Lauf klont
 * TerpenBandKopie im Browser, ohne Tooltips und für Screenreader und Tastatur
 * stumm.
 * Bewegung allein per CSS (globals.css, .terpen-band); bei reduzierter
 * Bewegung und im Sparmodus stehen die Icons umbrochen.
 * Optik wie eine Randleiste im Buch: 24-px-Icons gedämpft in text-muted, erst
 * bei Hover oder Fokus in text; Trefferfläche bleibt 44 px. Bandhöhe 78 px
 * (py-4, 44 px Fläche, Haarlinien), das Skelett steht mit h-20 auf dem Raster.
 */
async function Inhalt() {
  const [katalog, w, sprache] = await Promise.all([
    sicher(() => ladeTerpenRegister(), [], "Terpen-Band der Startseite"),
    holeWoerterbuch(),
    holeSprache(),
  ]);
  if (katalog.length === 0) return null;
  const { terpene } = baueAnsicht(katalog, w, sprache);
  const texte = w.start.register;

  const liste = (
    <ul className="terpen-band-liste flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12">
      {terpene.map((terpen) => (
        <li key={terpen.anker} className="group relative">
          <span
            tabIndex={0}
            aria-describedby={`band-${terpen.anker}`}
            className="grid size-11 place-items-center rounded-full text-text-muted transition-colors duration-fast ease-standard group-hover:text-text focus-visible:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <TerpenIcon name={terpen.icon} className="size-6" />
            <span className="sr-only">{terpen.name}</span>
          </span>
          <span
            id={`band-${terpen.anker}`}
            role="tooltip"
            className="pointer-events-none invisible absolute top-full left-1/2 z-30 mt-2 w-72 -translate-x-1/2 translate-y-1 rounded-lg border border-border bg-surface-raised p-4 text-left opacity-0 shadow-lg transition-[opacity,translate,visibility] duration-fast ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            <span className="flex items-center gap-3">
              <TerpenIcon name={terpen.icon} className="size-8 shrink-0 text-text" />
              <span className="grid">
                <span className="font-buch text-h3 leading-tight text-text">{terpen.name}</span>
                <span className="text-caption text-text-muted">{terpen.sortenText}</span>
              </span>
            </span>
            {terpen.duft ? (
              <span className="mt-3 block text-small text-text text-pretty">
                <span className="text-text-muted">{texte.duft}: </span>
                {terpen.duft}
              </span>
            ) : null}
            <span className="mt-3 block text-caption font-medium text-text-muted">{texte.noten}</span>
            <span className="mt-2 grid gap-2">
              {terpen.noten.map((note) => (
                <span key={note.anker} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-center gap-3">
                  <span className="inline-flex items-center gap-2 text-small text-text">
                    <GeschmackIcon geschmack={note.geschmack} className="size-5 shrink-0" />
                    {note.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="block h-2 rounded-full"
                    style={{ width: `${Math.round(Math.min(1, Math.max(0, note.anteil)) * 100)}%`, background: farbFlaeche(note.geschmack) }}
                  />
                </span>
              ))}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label={texte.terpene} className="terpen-band relative z-20 overflow-x-clip border-y border-border bg-surface py-4">
      <div className="terpen-band-spur flex">
        {liste}
        <TerpenBandKopie />
      </div>
    </section>
  );
}

export function TerpenBand() {
  return (
    <Suspense fallback={<div className="h-20 border-y border-border bg-surface" data-skelett="" />}>
      <Inhalt />
    </Suspense>
  );
}
