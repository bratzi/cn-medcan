import type { EintragDaten } from "@/components/review/eintrag";
import { ablauf } from "@/components/review/eintritt";
import { cn } from "@/lib/cn";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";

/**
 * Die fünf Noten zwischen Blatturteil und Karte (Spec 2026-10-05): Zahl und ein Tintenstrich
 * auf einer Haarlinie, ohne gefüllte Spur. Alle fünf, auch Wirkung: der volle Eintrag zeigt sie,
 * der Auszug auf der Startseite nie (`ohneWirkung`, Regel 9). Mobil zwei Spalten, ab sm fünf bzw. vier.
 */
export function NotenLeiste({
  eintrag,
  w,
  sprache,
  ohneWirkung = false,
}: {
  eintrag: EintragDaten;
  w: Woerterbuch;
  sprache: Sprache;
  ohneWirkung?: boolean;
}) {
  const achsen = ohneWirkung ? BEWERTUNGS_ACHSEN.filter((achse) => achse.key !== "wirkung") : BEWERTUNGS_ACHSEN;
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-4 sm:gap-x-4", ohneWirkung ? "sm:grid-cols-4" : "sm:grid-cols-5")}>
      {achsen.map((achse, index) => {
        const wert = eintrag[achse.key];
        const anteil = Math.min(Math.max(wert / 5, 0), 1);
        const zahl = formatiereZahl(wert, 1, sprache);
        return (
          // gap-1 = 4px: Bezeichnung und Wert sind ein Paar.
          <div key={achse.key} className="flex min-w-0 flex-col gap-1">
            <dt className="text-small text-text-muted">{w.schema.noten[achse.key].label}</dt>
            <dd className="flex flex-col gap-2">
              <span data-eintritt="auf" style={ablauf(5 + index)} className="numeric text-h2 text-text">
                <span aria-hidden="true">{zahl}</span>
                <span aria-hidden="true" className="text-small text-text-muted">
                  {" / 5"}
                </span>
                <span className="sr-only">{`${zahl} ${w.bluete.vonFuenf}`}</span>
              </span>
              <span aria-hidden="true" className="block border-b border-border">
                <span
                  data-eintritt="strich"
                  style={{ ...ablauf(5 + index), transform: `scaleX(${anteil})` }}
                  className="block h-1 origin-left bg-text"
                />
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
