import Link from "next/link";

import { namenLinkKlassen } from "@/components/ui";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { VertreiberEintrag } from "@/lib/query/vertreiber";

type Props = {
  eintraege: readonly VertreiberEintrag[];
  kultivarId: string;
  texte: Woerterbuch["bluete"]["vertreiber"];
  /** Vertreiber der angezeigten Ware: steht, wenn die Liste fehlt (Laden fehlgeschlagen). */
  eigenerVertreiber?: string | null;
};

/** Chip: Vertreibername, darunter der Handelsname; mindestens 44 px hoch. */
const CHIP = "inline-flex min-h-11 flex-col items-start justify-center rounded-full px-4 py-2 text-start";

/**
 * Über der Bewertungsmaske (Spec 2026-10-13): von welchem Vertreiber die Ware stammt. Die Wahl ist ein
 * Link auf die Blütenseite dieses Handelsnamens, damit Charge und Kennwerte zur Ware passen.
 */
export function VertreiberWahl({ eintraege, kultivarId, texte, eigenerVertreiber = null }: Props) {
  const name = (e: VertreiberEintrag) => e.vertreiberName ?? texte.unbekannt;
  const inhalt = (e: VertreiberEintrag) => (
    <>
      <span className="text-small font-medium">{name(e)}</span>
      <span className="text-caption wrap-break-word">{e.handelsname}</span>
    </>
  );
  return (
    <nav aria-labelledby="vertreiber-wahl-titel" className="flex flex-col gap-4">
      <h3 id="vertreiber-wahl-titel" className="text-h3 text-text">
        {texte.wahlTitel}
      </h3>
      {eintraege.length > 1 ? (
        <>
          <p className="max-w-[68ch] text-small text-text-muted text-pretty">{texte.wahlHinweis}</p>
          <ul className="flex flex-wrap gap-2">
            {eintraege.map((e) => (
              <li key={e.slug}>
                {e.aktuell ? (
                  <span aria-current="page" className={`${CHIP} bg-accent text-accent-fg`}>
                    {inhalt(e)}
                  </span>
                ) : (
                  <Link
                    prefetch={false}
                    href={`/blueten/${e.slug}#bewerten`}
                    className={`${CHIP} border border-border-strong text-text hover:text-accent-hover`}
                  >
                    {inhalt(e)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-body text-text">{eintraege[0] ? name(eintraege[0]) : (eigenerVertreiber ?? texte.unbekannt)}</p>
      )}
      <Link prefetch={false} href={`/vorschlagen?kultivar=${kultivarId}`} className={namenLinkKlassen()}>
        {texte.fehlt}
      </Link>
    </nav>
  );
}
