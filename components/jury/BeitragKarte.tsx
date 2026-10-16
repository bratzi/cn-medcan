import Link from "next/link";

import { JuryBild } from "@/components/medien/Bild";
import { cn } from "@/lib/cn";
import { formatiereDatum } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { JuryKarte } from "@/lib/query/jury";

/**
 * Karte eines Beitrags im Magazin: Titelbild ganz im Rahmen (object-contain), Sorte, Titel, Anriss,
 * Autor und Datum. Die ganze Karte ist ein Link auf den Beitrag; der Autor steht darin als Text,
 * damit keine Links ineinander liegen. Hover nur über den Titelunterstrich (nur Zeigegeräte mit
 * Hover, Tailwind v4 schaltet `hover:` selbst darauf). `kompakt` für das Bildraster der Favourites:
 * ohne Anriss.
 */
export function BeitragKarte({
  karte,
  texte,
  sprache,
  prioritaet = false,
  kompakt = false,
}: {
  karte: JuryKarte;
  texte: Woerterbuch["jury"];
  sprache: Sprache;
  prioritaet?: boolean;
  kompakt?: boolean;
}) {
  const bild = karte.titelbild;
  return (
    <article className="group relative flex min-w-0 flex-col gap-4">
      <div className="aspect-4/5 w-full overflow-hidden border border-border bg-surface-sunken">
        {bild ? (
          <JuryBild
            id={bild.id}
            breite={bild.breite}
            hoehe={bild.hoehe}
            alt={bild.alt || karte.titel}
            prioritaet={prioritaet}
            className="block size-full object-contain"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-small text-text-muted">{texte.bilder.ohneBild}</div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        {karte.sorte && !kompakt ? <p className="text-small text-text-muted wrap-break-word">{karte.sorte.name}</p> : null}
        <h3 className={cn("font-buch font-medium text-balance text-text wrap-break-word", kompakt ? "text-h3" : "text-h2")}>
          <Link
            prefetch={false}
            href={`/jury/${karte.slug}`}
            className="underline decoration-transparent underline-offset-4 transition-colors duration-fast ease-standard group-hover:decoration-text after:absolute after:inset-0"
          >
            {kompakt ? (karte.sorte?.name ?? karte.titel) : karte.titel}
          </Link>
        </h3>
        {!kompakt && karte.anriss ? <p className="text-body text-pretty text-text-muted">{karte.anriss}</p> : null}
        <p className="text-small text-text-muted">
          {t(texte.von, { name: karte.autor.name })}
          <span className="numeric">{`, ${formatiereDatum(karte.veroeffentlichtAm, sprache)}`}</span>
        </p>
      </div>
    </article>
  );
}
