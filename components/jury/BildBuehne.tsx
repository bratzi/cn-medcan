"use client";

import { useState, type KeyboardEvent } from "react";

import { JuryBild } from "@/components/medien/Bild";
import { cn } from "@/lib/cn";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { t } from "@/lib/i18n/text";
import type { JuryBildMeta } from "@/lib/query/jury";

/**
 * Bildbühne eines Beitrags: bis zu fünf Bilder, das gewählte immer ganz im Rahmen (object-contain,
 * nie beschnitten), darunter die Daumenleiste. Pfeiltasten links und rechts wechseln, auch mit
 * Fokus auf einem Daumen. Alle Bilder stehen übereinander, der Wechsel blendet nur Deckkraft und
 * Maßstab um (300 ms, `.jury-buehne-bild` in globals.css); ohne die Bewegungs-Freigabe tauscht er
 * sofort. Ein Symbolbild trägt seinen Hinweis unter dem Rahmen, nie als Plakette auf dem Bild.
 */
export function BildBuehne({
  bilder,
  name,
  texte,
}: {
  bilder: JuryBildMeta[];
  name: string;
  texte: Woerterbuch["jury"];
}) {
  const [aktiv, setAktiv] = useState(0);
  const anzahl = bilder.length;
  const b = texte.bilder;

  if (anzahl === 0) {
    return (
      <div className="flex aspect-4/5 w-full items-center justify-center border border-border bg-surface-sunken text-small text-text-muted">
        {b.ohneBild}
      </div>
    );
  }

  const gehe = (ziel: number) => setAktiv((ziel + anzahl) % anzahl);
  const taste = (e: KeyboardEvent) => {
    if (anzahl < 2) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      gehe(aktiv + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      gehe(aktiv - 1);
    }
  };
  const aktuelles = bilder[aktiv];

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={b.galerie}
      onKeyDown={taste}
      className="flex w-full flex-col gap-4"
    >
      <div
        tabIndex={anzahl > 1 ? 0 : undefined}
        aria-label={anzahl > 1 ? `${b.galerie}. ${t(b.bildVon, { nummer: aktiv + 1, gesamt: anzahl })}` : undefined}
        className="relative aspect-4/5 w-full overflow-hidden border border-border bg-surface-sunken"
      >
        {bilder.map((bild, index) => (
          <div
            key={bild.id}
            data-aktiv={index === aktiv}
            aria-hidden={index === aktiv ? undefined : true}
            className="jury-buehne-bild absolute inset-0 data-[aktiv=false]:invisible data-[aktiv=false]:opacity-0"
          >
            <JuryBild
              id={bild.id}
              breite={bild.breite}
              hoehe={bild.hoehe}
              alt={bild.alt || t(b.alt, { name, nummer: index + 1 })}
              prioritaet={index === 0}
              className="block size-full object-contain"
            />
          </div>
        ))}
      </div>
      {aktuelles.symbolbild ? <p className="text-small text-text-muted">{b.symbolbildHinweis}</p> : null}
      {anzahl > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label={b.zurueck}
            onClick={() => gehe(aktiv - 1)}
            className="inline-flex size-12 items-center justify-center border border-border-strong bg-surface-raised text-body text-text transition-colors duration-fast ease-standard hover:border-text"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            aria-label={b.weiter}
            onClick={() => gehe(aktiv + 1)}
            className="inline-flex size-12 items-center justify-center border border-border-strong bg-surface-raised text-body text-text transition-colors duration-fast ease-standard hover:border-text"
          >
            <span aria-hidden="true">→</span>
          </button>
        <ul className="flex flex-wrap gap-2">
          {bilder.map((bild, index) => (
            <li key={bild.id}>
              <button
                type="button"
                aria-label={t(b.zeigen, { nummer: index + 1 })}
                aria-current={index === aktiv ? "true" : undefined}
                onClick={() => setAktiv(index)}
                className={cn(
                  "block size-12 overflow-hidden border bg-surface-sunken transition-colors duration-fast ease-standard",
                  index === aktiv ? "border-text" : "border-border hover:border-border-strong",
                )}
              >
                <JuryBild id={bild.id} breite={bild.breite} hoehe={bild.hoehe} alt="" className="block size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
        </div>
      ) : null}
    </div>
  );
}
