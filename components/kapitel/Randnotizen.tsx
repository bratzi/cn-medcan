import type { CSSProperties } from "react";

export type Randnotiz = { zahl: string; wort: string; satz: string; href?: string };

/**
 * Deine Zahlen als Randnotizen (Spec 5, Muster Randspalte der Startseite):
 * Zahl gedruckt, Wort von Hand, weil das Mitglied Community ist (Regel 1,
 * Spec 11). Vorgelesen wird je Notiz ein Satz; die sichtbaren Teile sind
 * aria-hidden. Je Notiz 2 Rasterspalten, unter 1080 px zwei je Reihe, eine
 * ungerade letzte über die ganze Breite. Die Zahl zählt nicht hoch (Regel 7).
 * Mit `href` ist die ganze Notiz ein Sprunglink (Profilkopf, Spec Profil und Konto vereint 3.1).
 */
export function Randnotizen({
  notizen,
  beschriftung,
  kompakt = false,
  leiste = false,
}: {
  notizen: readonly Randnotiz[];
  beschriftung: string;
  kompakt?: boolean;
  /** Profilkopf: vier Spalten je Gruppe, jede so breit wie ihr Inhalt (live 2026-10-14: gleich breite Spalten
   *  ließen „12.10.“ in die Nachbarzahl laufen). Zahl von Hand, Wort gedruckt. */
  leiste?: boolean;
}) {
  const klein = kompakt || leiste;
  return (
    <ul
      aria-label={beschriftung}
      className={
        leiste
          ? "grid grid-cols-[repeat(4,auto)] justify-start gap-x-6 gap-y-2"
          : kompakt
            ? "grid grid-cols-2 gap-x-6 gap-y-6 max-[1079px]:grid-cols-4"
            : "col-span-4 grid grid-cols-subgrid gap-y-8 min-[1080px]:col-span-10"
      }
    >
      {notizen.map((n, i) => {
        // Profilkopf (Nutzer 2026-10-14): Stile gedreht, die Zahl von Hand im Akzent, das Wort gedruckt.
        const inhalt = leiste ? (
          <>
            <span className="sr-only">{n.satz}</span>
            <span aria-hidden="true" className="font-hand text-vermerk text-logo whitespace-nowrap">
              {n.zahl}
            </span>
            <span aria-hidden="true" className="text-caption text-text-muted whitespace-nowrap">
              {n.wort}
            </span>
          </>
        ) : (
          <>
            <span className="sr-only">{n.satz}</span>
            <span aria-hidden="true" className={`numeric text-text ${klein ? "text-h2" : "text-display"}`}>
              {n.zahl}
            </span>
            <span
              aria-hidden="true"
              style={{ "--i": i } as CSSProperties}
              className={`kapitel-notiz-wort font-hand text-notiz text-logo wrap-break-word hyphens-auto ${klein ? "kapitel-notiz-wort--kompakt" : ""}`}
            >
              {n.wort}
            </span>
          </>
        );
        return (
          <li
            key={`${i}-${n.wort}`}
            className={
              leiste
                ? "flex flex-col gap-1"
                : kompakt
                  ? "@container flex min-w-0 flex-col gap-1"
                : "@container col-span-2 flex min-w-0 flex-col gap-2 px-6 last:odd:col-span-4 min-[1080px]:px-8 min-[1080px]:last:odd:col-span-2"
            }
          >
            {n.href ? (
              // Sprunglink zur Box; die ganze Notiz ist Trefferfläche.
              <a href={n.href} className="flex min-h-11 min-w-0 flex-col gap-1 text-text transition-colors duration-fast ease-standard hover:text-accent">
                {inhalt}
              </a>
            ) : (
              inhalt
            )}
          </li>
        );
      })}
    </ul>
  );
}
