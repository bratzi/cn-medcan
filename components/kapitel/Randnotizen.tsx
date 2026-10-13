import type { CSSProperties } from "react";

export type Randnotiz = { zahl: string; wort: string; satz: string };

/**
 * Deine Zahlen als Randnotizen (Spec 5, Muster Randspalte der Startseite):
 * Zahl gedruckt, Wort von Hand, weil das Mitglied Community ist (Regel 1,
 * Spec 11). Vorgelesen wird je Notiz ein Satz; die sichtbaren Teile sind
 * aria-hidden. Je Notiz 2 Rasterspalten, unter 1080 px zwei je Reihe, eine
 * ungerade letzte über die ganze Breite. Die Zahl zählt nicht hoch (Regel 7).
 */
export function Randnotizen({
  notizen,
  beschriftung,
  kompakt = false,
}: {
  notizen: readonly Randnotiz[];
  beschriftung: string;
  kompakt?: boolean;
}) {
  return (
    <ul
      aria-label={beschriftung}
      className={
        kompakt
          ? "grid grid-cols-2 gap-x-6 gap-y-6 max-[1079px]:grid-cols-4"
          : "col-span-4 grid grid-cols-subgrid gap-y-8 min-[1080px]:col-span-10"
      }
    >
      {notizen.map((n, i) => (
        <li
          key={n.wort}
          className={
            kompakt
              ? "@container flex min-w-0 flex-col gap-1"
              : "@container col-span-2 flex min-w-0 flex-col gap-2 px-6 last:odd:col-span-4 min-[1080px]:px-8 min-[1080px]:last:odd:col-span-2"
          }
        >
          <span className="sr-only">{n.satz}</span>
          <span aria-hidden="true" className={`numeric text-text ${kompakt ? "text-h2" : "text-display"}`}>
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
