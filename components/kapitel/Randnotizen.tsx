import type { CSSProperties } from "react";

export type Randnotiz = { zahl: string; wort: string; satz: string };

/**
 * Deine Zahlen als Randnotizen (Spec 5, Muster Randspalte der Startseite):
 * Zahl gedruckt, Wort von Hand, weil das Mitglied Community ist (Regel 1,
 * Spec 11). Vorgelesen wird je Notiz ein Satz; die sichtbaren Teile sind
 * aria-hidden. Je Notiz 2 Rasterspalten, unter 1080 px zwei je Reihe, eine
 * ungerade letzte über die ganze Breite. Die Zahl zählt nicht hoch (Regel 7).
 */
export function Randnotizen({ notizen, beschriftung }: { notizen: readonly Randnotiz[]; beschriftung: string }) {
  return (
    <ul aria-label={beschriftung} className="col-span-4 grid grid-cols-subgrid gap-y-8 min-[1080px]:col-span-10">
      {notizen.map((n, i) => (
        <li
          key={n.wort}
          className="col-span-2 flex min-w-0 flex-col gap-2 px-6 last:odd:col-span-4 min-[1080px]:px-8 min-[1080px]:last:odd:col-span-2"
        >
          <span className="sr-only">{n.satz}</span>
          <span aria-hidden="true" className="numeric text-display text-text">
            {n.zahl}
          </span>
          <span
            aria-hidden="true"
            style={{ "--i": i } as CSSProperties}
            className="kapitel-notiz-wort font-hand text-notiz text-logo wrap-break-word hyphens-auto"
          >
            {n.wort}
          </span>
        </li>
      ))}
    </ul>
  );
}
