import Link from "next/link";

import { MarkenLogo } from "@/components/medien/Bild";
import { wareHref } from "@/components/sorte/WareLeiste";
import { InfoKnopf } from "@/components/ui/InfoKnopf";
import { cn } from "@/lib/cn";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { markenInitialen, sichererLogoPfad } from "@/lib/marken";
import type { WareKarte } from "@/lib/query/sorte";

type Props = {
  waren: readonly WareKarte[];
  aktiveVertreiberId: string | null;
  slug: string;
  texte: Woerterbuch["bluete"]["vertreiber"];
  sprache: Sprache;
};

/**
 * Auswahl des Vertreibers als waagerechte Leiste mit Logo-Karten (Spec 2026-10-21, 1.3). Ersetzt die
 * große Ware-Leiste und die Vertreiber-Chips „Deine Blüte ist von“ im Formular: die Wahl hier filtert
 * Buch und Angaben und belegt die Bewertung vor. Karten sind Links (ohne JavaScript nutzbar, ohne
 * Sprung nach oben), die gewählte trägt `aria-current` und einen Haken, nicht nur Farbe. Gereiht nach
 * Zahl der Bewertungen, nie nach Note (HWG). Ohne Logo steht eine Initialen-Marke.
 */
export function HerstellerLeiste({ waren, aktiveVertreiberId, slug, texte, sprache }: Props) {
  return (
    <nav aria-labelledby="hersteller-titel" className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-2">
        <h2 id="hersteller-titel" className="font-buch text-h3 text-balance text-text">
          {texte.leisteTitel}
        </h2>
        <InfoKnopf sprache={sprache} text={texte.leisteSatz} />
      </div>
      {/* Mobil waagerecht wischbar; die Leiste läuft bis an den Rand, die Karten rasten ein. */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 py-2 sm:mx-0 sm:justify-center sm:px-0">
        {waren.map((ware) => {
          const aktiv = ware.vertreiberId === aktiveVertreiberId;
          const name = ware.vertreiberName || texte.unbekannt;
          const logo = sichererLogoPfad(ware.vertreiberLogo);
          return (
            <li key={ware.vertreiberId || "unbekannt"} className="flex shrink-0 snap-start">
              <Link
                prefetch={false}
                scroll={false}
                href={wareHref(slug, ware)}
                aria-current={aktiv ? "true" : undefined}
                className={cn(
                  "relative flex min-h-11 w-40 flex-col items-center gap-2 border px-4 py-4 text-center transition-[color,border-color,background-color,scale] duration-fast ease-out active:scale-97",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  aktiv
                    ? "border-accent bg-accent-subtle text-text"
                    : "border-border bg-surface-raised text-text hover:border-accent-hover",
                )}
              >
                <span className="flex h-12 w-full items-center justify-center">
                  {logo ? (
                    // Helle Platte in beiden Farbschemata: Logos bringen eigene Farben mit, dunkle Marken
                    // verschwänden sonst auf dunklem Grund. Das Logo selbst bleibt unverändert.
                    <span className="flex h-12 w-full items-center justify-center rounded-sm bg-neutral-50 px-2">
                      <MarkenLogo pfad={logo} className="max-h-10 max-w-full" />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex size-12 items-center justify-center rounded-full border border-border-strong bg-surface font-buch text-h3 text-text-muted"
                    >
                      {markenInitialen(ware.vertreiberName)}
                    </span>
                  )}
                </span>
                <span className="line-clamp-2 text-small font-medium text-balance wrap-break-word">{name}</span>
                <span className="numeric text-caption text-text-muted">
                  {ware.anzahl > 0 ? mehrzahl(sprache, texte.anzahl, ware.anzahl) : texte.ohneNote}
                </span>
                {aktiv ? (
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="absolute top-2 right-2 size-4 text-accent">
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
