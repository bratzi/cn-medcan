import Link from "next/link";

import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { cn } from "@/lib/cn";
import { formatiereProzentSpanne, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { WareKarte } from "@/lib/query/sorte";

type Props = {
  waren: readonly WareKarte[];
  aktiveVertreiberId: string | null;
  slug: string;
  texte: Woerterbuch["bluete"]["vertreiber"];
  sprache: Sprache;
};

/** Link der Karte: über den Vertreiber, ohne bekannten Vertreiber über das erste Produkt. */
export function wareHref(slug: string, ware: WareKarte): string {
  return ware.vertreiberId
    ? `/blueten/${slug}?vertreiber=${encodeURIComponent(ware.vertreiberId)}`
    : `/blueten/${slug}?ware=${encodeURIComponent(ware.produkte[0]?.slug ?? "")}`;
}

/**
 * Ware-Leiste der Sortenseite (Spec Sorte im Fokus, 3): je Vertreiber eine Karte mit Stärken,
 * Bewertungszahl und Note. Gereiht nach Anzahl, dann Name (HWG: nie nach Note). Die Karten sind
 * Links (ohne JavaScript nutzbar, ohne Sprung nach oben); die gewählte trägt `aria-current` und
 * zusätzlich zur Farbe den Vermerk „diese Ware“.
 */
export function WareLeiste({ waren, aktiveVertreiberId, slug, texte, sprache }: Props) {
  return (
    <nav aria-labelledby="ware-leiste-titel" className="flex flex-col gap-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <h2 id="ware-leiste-titel" className="font-buch text-kapitel text-balance text-text">
          {texte.leisteTitel}
        </h2>
        <p className="max-w-[56ch] text-body text-pretty text-text-muted">{texte.leisteSatz}</p>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {waren.map((ware) => {
          const aktiv = ware.vertreiberId === aktiveVertreiberId;
          return (
            <li key={ware.vertreiberId || "unbekannt"} className="flex">
              <Link
                prefetch={false}
                scroll={false}
                href={wareHref(slug, ware)}
                aria-current={aktiv ? "true" : undefined}
                className={cn(
                  "flex min-h-11 w-full flex-col gap-4 border p-6 text-start transition-colors duration-fast ease-standard",
                  aktiv
                    ? "border-accent bg-accent-subtle text-text"
                    : "border-border bg-surface-raised text-text hover:border-accent-hover",
                )}
              >
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-buch text-h3 wrap-break-word">{ware.vertreiberName || texte.unbekannt}</span>
                  {aktiv ? <span className="text-caption text-accent">{texte.dieseWare}</span> : null}
                </span>
                <span className="flex flex-col gap-2">
                  <span className="text-small text-text-muted">{mehrzahl(sprache, texte.staerken, ware.produkte.length)}</span>
                  <span className="numeric flex flex-wrap gap-x-4 gap-y-2 text-small">
                    {ware.produkte.map((p) => (
                      <span key={p.id} className="whitespace-nowrap">
                        {t(texte.thc, { spanne: formatiereProzentSpanne(p.thcMin, p.thcMax, 1, sprache) })}
                      </span>
                    ))}
                  </span>
                </span>
                {ware.anzahl > 0 && ware.gesamtnoteMittel !== null ? (
                  <div className="mt-auto flex flex-col gap-2">
                    <BlattAnzeige note={ware.gesamtnoteMittel} text={t(texte.note, { note: formatiereZahl(ware.gesamtnoteMittel, 1, sprache) })} />
                    <span className="numeric text-small text-text-muted">{mehrzahl(sprache, texte.anzahl, ware.anzahl)}</span>
                  </div>
                ) : (
                  <span className="mt-auto text-small text-text-muted">{texte.ohneNote}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
