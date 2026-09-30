"use client";

import { useId, useState } from "react";

import { buttonKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Ab dieser Länge kann der Text ab lg über die sechs Zeilen hinausgehen. */
export const NOTIZ_KURZ = 280;

/**
 * Der Bewertungstext im Buch (T7b, Nutzer 2026-09-30): ab lg hat die Seite
 * eine feste Höhe, der Text steht deshalb auf sechs Zeilen begrenzt (auf hohen
 * Bildschirmen zwölf). „Weiterlesen“ legt den ganzen Text als Blatt über die
 * linke Seite, „Schließen“ nimmt es wieder weg. Unter lg (mobil
 * zurückgestellt) steht der Text ganz, ohne Knopf. `data-buch-eigen`: ein
 * Klick ins offene Blatt blättert nicht um.
 */
export function BuchNotiz({ text, weiterlesen, schliessen }: { text: string; weiterlesen: string; schliessen: string }) {
  const id = useId();
  const [offen, setOffen] = useState(false);
  const lang = text.length > NOTIZ_KURZ;
  return (
    <div
      data-buch-eigen={offen ? "" : undefined}
      className={cn(
        "flex flex-col items-start gap-2",
        offen && "lg:absolute lg:inset-0 lg:z-10 lg:gap-4 lg:overflow-y-auto lg:bg-surface-raised lg:p-6",
      )}
    >
      <p
        id={id}
        className={cn(
          "max-w-[56ch] text-body text-pretty text-text",
          offen ? null : "lg:line-clamp-6 lg:[@media(min-height:52rem)]:line-clamp-12",
        )}
      >
        {text}
      </p>
      {lang ? (
        <button
          type="button"
          aria-expanded={offen}
          aria-controls={id}
          onClick={() => setOffen(!offen)}
          className={cn(buttonKlassen("secondary", "sm"), "max-lg:hidden")}
        >
          {offen ? schliessen : weiterlesen}
        </button>
      ) : null}
    </div>
  );
}
