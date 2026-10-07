"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { ablauf } from "@/components/review/eintritt";
import { buttonKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Ohne Messung (Server, erster Frame): ab dieser Länge kann der Text über sechs Zeilen hinausgehen. */
export const NOTIZ_KURZ = 280;
/** Zeilenhöhe von text-h3 (1.75rem, ab sm) und Platz für den Knopf (h-9 + gap-2). */
const ZEILE = 28;
const KNOPF_PLATZ = 44;
/** Platz des Bildfelds unter dem Text (Spec 2026-10-06): min-h-48 (192 px) plus 16 px aus gap-2 und mt-2. */
export const BILD_PLATZ = 208;

/** Zeilen bis zur Auslassung; 0 = der Text passt ganz. Mit Bild geht dessen Mindestplatz vorher ab. */
export function notizZeilen(platz: number, textHoehe: number, mitBild: boolean): number {
  const rest = platz - (mitBild ? BILD_PLATZ : 0);
  if (textHoehe <= rest) return 0;
  return Math.max(1, Math.floor((rest - KNOPF_PLATZ) / ZEILE));
}
const NEBENEINANDER = "(min-width: 64rem)";

/**
 * Der Bewertungstext im Buch (T7b, Nutzer 2026-09-30): ab lg hat die Seite
 * eine feste Höhe, der Text nimmt den Rest der linken Seite. Gemessen wird,
 * wie viele Zeilen hineinpassen; passt er nicht ganz, endet er mit Auslassung
 * und darunter steht „Weiterlesen“. Das legt den ganzen Text als Blatt über
 * die linke Seite; „Schließen“ oder Escape nimmt es wieder weg. Vor der
 * Messung gelten sechs Zeilen. Unter lg (mobil zurückgestellt) steht der Text
 * ganz, ohne Knopf. `data-buch-eigen`: ein Klick ins offene Blatt blättert
 * nicht um.
 */
export function BuchNotiz({
  text,
  weiterlesen,
  schliessen,
  bild,
  bildNurGross = false,
}: {
  text: string;
  weiterlesen: string;
  schliessen: string;
  /** Bildfeld unter dem Text, in derselben gemessenen Fläche (BuchBildfeld). */
  bild?: ReactNode;
  /** Ersatzbild: unter lg ausgeblendet. */
  bildNurGross?: boolean;
}) {
  const id = useId();
  const flaeche = useRef<HTMLDivElement>(null);
  const absatz = useRef<HTMLParagraphElement>(null);
  const knopf = useRef<HTMLButtonElement>(null);
  const [offen, setOffen] = useState(false);
  // null: nicht gemessen (Server, unter lg); 0: passt ganz; sonst Zeilen bis zur Auslassung.
  const [zeilen, setZeilen] = useState<number | null>(null);
  const mitBild = Boolean(bild);

  useEffect(() => {
    const element = flaeche.current;
    const p = absatz.current;
    if (!element || !p || offen) return;
    const messen = () => {
      if (!window.matchMedia(NEBENEINANDER).matches) return setZeilen(null);
      // scrollHeight ist auch begrenzt die volle Höhe des Textes.
      const platz = element.clientHeight;
      setZeilen(notizZeilen(platz, p.scrollHeight, mitBild));
    };
    const beobachter = new ResizeObserver(messen);
    beobachter.observe(element);
    return () => beobachter.disconnect();
  }, [offen, text, mitBild]);

  const schliessenMitFokus = () => {
    setOffen(false);
    requestAnimationFrame(() => knopf.current?.focus());
  };

  const gekuerzt = zeilen === null ? text.length > NOTIZ_KURZ : zeilen > 0;
  const stil = zeilen ? ({ "--notiz-zeilen": zeilen } as CSSProperties) : undefined;

  return (
    <div
      ref={flaeche}
      data-eintritt="auf"
      style={ablauf(2)}
      data-buch-eigen={offen ? "" : undefined}
      onKeyDown={
        offen
          ? (ereignis) => {
              if (ereignis.key !== "Escape") return;
              ereignis.preventDefault();
              schliessenMitFokus();
            }
          : undefined
      }
      className={cn(
        // flex-basis 0: der Text trägt nicht zur Höhe der Zeile bei, die rechte Seite gibt sie vor.
        "flex flex-col items-start gap-2 lg:min-h-0 lg:flex-[1_1_0px]",
        offen && "lg:absolute lg:inset-0 lg:z-10 lg:gap-4 lg:overflow-y-auto lg:bg-surface-raised lg:px-6 lg:py-4",
      )}
    >
      <p
        ref={absatz}
        id={id}
        style={stil}
        className={cn(
          "flex-none max-w-[52ch] text-body text-pretty text-text sm:text-h3 sm:font-normal",
          offen || zeilen === 0 ? null : zeilen === null ? "lg:line-clamp-6" : "lg:line-clamp-(--notiz-zeilen)",
        )}
      >
        {text}
      </p>
      {gekuerzt || offen ? (
        <button
          ref={knopf}
          type="button"
          aria-expanded={offen}
          aria-controls={id}
          onClick={() => (offen ? schliessenMitFokus() : setOffen(true))}
          className={cn(buttonKlassen("secondary", "sm"), "shrink-0 max-lg:hidden")}
        >
          {offen ? schliessen : weiterlesen}
        </button>
      ) : null}
      {bild ? (
        // Das Bild nimmt den Rest der Fläche; ab lg absolut, damit es nichts zur Höhe beiträgt.
        <div className={cn("relative mt-2 w-full lg:min-h-48 lg:flex-1", bildNurGross && "max-lg:hidden", offen && "lg:hidden")}>
          <div className="lg:absolute lg:inset-0">{bild}</div>
        </div>
      ) : null}
    </div>
  );
}
