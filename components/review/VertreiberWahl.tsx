import Link from "next/link";

import { namenLinkKlassen } from "@/components/ui";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { VertreiberEintrag } from "@/lib/query/vertreiber";

type Props = { eintraege: readonly VertreiberEintrag[]; kultivarId: string; texte: Woerterbuch["bluete"]["vertreiber"] };

/**
 * Über der Bewertungsmaske (Spec 2026-10-13): von welchem Vertreiber die Ware stammt. Die Wahl ist ein
 * Link auf die Blütenseite dieses Handelsnamens, damit Charge und Kennwerte zur Ware passen.
 */
export function VertreiberWahl({ eintraege, kultivarId, texte }: Props) {
  const name = (e: VertreiberEintrag) => e.vertreiberName ?? texte.unbekannt;
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
                  <span aria-current="page" className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-small font-medium text-accent-fg">
                    {name(e)}
                  </span>
                ) : (
                  <Link
                    prefetch={false}
                    href={`/blueten/${e.slug}#bewerten`}
                    className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-4 text-small text-text hover:text-accent-hover"
                  >
                    {name(e)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-body text-text">{eintraege[0] ? name(eintraege[0]) : texte.unbekannt}</p>
      )}
      <Link prefetch={false} href={`/vorschlagen?kultivar=${kultivarId}`} className={namenLinkKlassen()}>
        {texte.fehlt}
      </Link>
    </nav>
  );
}
