"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { GeschmackIcon, TerpenIcon } from "@/components/review/AromaIcon";
import type { GeschmacksKategorie } from "@/db/enums";
import { farbFlaeche } from "@/lib/aroma-farben";
import { kartenLage, type KartenLage } from "@/lib/terpen-karte";

export type KartenTerpen = {
  readonly anker: string;
  readonly name: string;
  readonly icon: string;
  readonly farbe: string;
  readonly duft: string | null;
  readonly sortenText: string;
  readonly noten: readonly {
    readonly anker: string;
    readonly geschmack: GeschmacksKategorie;
    readonly label: string;
    readonly anteil: number;
  }[];
};

/**
 * Karte zum Terpen unter dem Zeiger (Nutzer 2026-10-09: die Infos im Band waren
 * oft viel zu klein). Vorher hingen sie in der 160-px-Spalte des Eintrags, das
 * Band beschnitt sie seitlich. Jetzt eine einzige Karte per Portal in `body`,
 * `position: fixed`, 288 px breit, Lage aus `kartenLage` (lib/terpen-karte.ts).
 *
 * Ereignisse per Delegation am Band: jeder Eintrag trägt `data-terpen`, auch in
 * der stummen Kopie, die TerpenBandKopie klont. Öffnen nur mit Maus und mit
 * sichtbarem Tastaturfokus; Antippen springt wie bisher zur Tafel. Escape und
 * Scrollen schließen. Wechsel zum Nachbarn ohne neue Einblendung: das Element
 * bleibt, nur seine Lage springt (globals.css, `.terpen-karte`).
 *
 * Die Karte ist aria-hidden: dieselben Angaben stehen lesbar in der Tafel des
 * Registers, zu der der Eintrag springt.
 */
export function TerpenBandKarte({ terpene, hinweis }: { terpene: readonly KartenTerpen[]; hinweis: string }) {
  const marker = useRef<HTMLSpanElement>(null);
  const [offen, setOffen] = useState<{ terpen: KartenTerpen; lage: KartenLage } | null>(null);

  useEffect(() => {
    const band = marker.current?.closest<HTMLElement>(".terpen-band");
    if (!band) return;
    const nachAnker = new Map(terpene.map((terpen) => [terpen.anker, terpen]));

    const zeige = (eintrag: HTMLElement) => {
      const terpen = nachAnker.get(eintrag.dataset.terpen ?? "");
      const symbol = eintrag.querySelector("[data-terpen-marke]") ?? eintrag;
      if (!terpen) return;
      const rechteck = symbol.getBoundingClientRect();
      const lage = kartenLage(
        { links: rechteck.left, oben: rechteck.top, breite: rechteck.width, hoehe: rechteck.height },
        document.documentElement.clientWidth,
      );
      setOffen({ terpen, lage });
    };
    const schliesse = () => setOffen(null);
    const eintragVon = (ziel: EventTarget | null) =>
      ziel instanceof Element ? ziel.closest<HTMLElement>("[data-terpen]") : null;

    const zeigerRein = (ereignis: PointerEvent) => {
      if (ereignis.pointerType !== "mouse") return;
      const eintrag = eintragVon(ereignis.target);
      if (eintrag) zeige(eintrag);
    };
    const zeigerRaus = (ereignis: PointerEvent) => {
      if (ereignis.pointerType !== "mouse") return;
      const eintrag = eintragVon(ereignis.target);
      // Innerhalb desselben Eintrags bleibt die Karte stehen; der Nachbar öffnet seine eigene.
      if (eintrag && eintragVon(ereignis.relatedTarget) !== eintrag) schliesse();
    };
    const fokusRein = (ereignis: FocusEvent) => {
      const eintrag = eintragVon(ereignis.target);
      if (eintrag && ereignis.target instanceof Element && ereignis.target.matches(":focus-visible")) zeige(eintrag);
    };
    const taste = (ereignis: KeyboardEvent) => {
      if (ereignis.key === "Escape") schliesse();
    };

    band.addEventListener("pointerover", zeigerRein);
    band.addEventListener("pointerout", zeigerRaus);
    band.addEventListener("focusin", fokusRein);
    band.addEventListener("focusout", schliesse);
    document.addEventListener("keydown", taste);
    window.addEventListener("scroll", schliesse, { passive: true });
    window.addEventListener("resize", schliesse);
    return () => {
      band.removeEventListener("pointerover", zeigerRein);
      band.removeEventListener("pointerout", zeigerRaus);
      band.removeEventListener("focusin", fokusRein);
      band.removeEventListener("focusout", schliesse);
      document.removeEventListener("keydown", taste);
      window.removeEventListener("scroll", schliesse);
      window.removeEventListener("resize", schliesse);
    };
  }, [terpene]);

  return (
    <>
      <span ref={marker} hidden />
      {offen
        ? createPortal(<Karte terpen={offen.terpen} lage={offen.lage} hinweis={hinweis} />, document.body)
        : null}
    </>
  );
}

function Karte({ terpen, lage, hinweis }: { terpen: KartenTerpen; lage: KartenLage; hinweis: string }) {
  return (
    <div
      aria-hidden="true"
      className="terpen-karte pointer-events-none fixed z-50 grid gap-4 border border-border-strong bg-surface-raised p-6 text-left shadow-lg"
      style={
        {
          left: lage.links,
          top: lage.oben,
          width: lage.breite,
          "--terpen-farbe": terpen.farbe,
          "--pfeil": `${lage.pfeil}px`,
        } as React.CSSProperties
      }
    >
      <span className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--terpen-farbe)_24%,transparent)] text-[color-mix(in_oklab,var(--terpen-farbe)_50%,var(--color-text))] ring-1 ring-inset ring-[color-mix(in_oklab,var(--terpen-farbe)_56%,transparent)]">
          <TerpenIcon name={terpen.icon} className="size-8" />
        </span>
        <span className="grid min-w-0 gap-1">
          <span className="font-buch text-h3 leading-tight text-text text-balance wrap-break-word">{terpen.name}</span>
          <span className="text-caption text-text-muted">{terpen.sortenText}</span>
        </span>
      </span>
      {terpen.duft ? <span className="text-small text-text text-pretty">{terpen.duft}</span> : null}
      {terpen.noten.length > 0 ? (
        <span className="grid gap-2">
          {terpen.noten.slice(0, 3).map((note) => (
            <span key={note.anker} className="grid grid-cols-[minmax(0,6rem)_minmax(0,1fr)] items-center gap-4">
              <span className="inline-flex min-w-0 items-center gap-2 text-small text-text-muted">
                <GeschmackIcon geschmack={note.geschmack} className="size-4 shrink-0" />
                <span className="truncate">{note.label}</span>
              </span>
              <span
                className="block h-1.5 rounded-full"
                style={{ width: `${Math.round(Math.min(1, Math.max(0, note.anteil)) * 100)}%`, background: farbFlaeche(note.geschmack) }}
              />
            </span>
          ))}
        </span>
      ) : null}
      <span className="border-t border-border pt-4 text-caption text-text-muted">{hinweis}</span>
    </div>
  );
}
