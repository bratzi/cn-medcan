import type { Metadata } from "next";
import Link from "next/link";

import { BeitragKarte } from "@/components/jury/BeitragKarte";
import { JuryRahmen } from "@/components/jury/JuryRahmen";
import { EmptyState } from "@/components/ui";
import { einzelLinkKlassen, textLinkKlassen } from "@/components/ui/textlink";
import { formatiereDatum } from "@/lib/format";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { t } from "@/lib/i18n/text";
import { ladeJuryFavourites } from "@/lib/query/jury";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.jury.favouritesTitel, description: w.jury.favouritesSatz };
}

/**
 * Bildraster der Favourites und darunter die Bewertungen der Jury als Textliste (ohne Bilder, ohne Note):
 * neueste zuerst, nie nach Note sortiert (die Jury kürt nicht, sie zeigt).
 */
export default async function JuryFavouritesPage() {
  const [w, sprache, { karten, bewertungen }] = await Promise.all([holeWoerterbuch(), holeSprache(), ladeJuryFavourites()]);
  const j = w.jury;
  return (
    <JuryRahmen texte={j}>
      <header className="flex flex-col gap-4 max-md:text-center">
        <p>
          <Link prefetch={false} href="/jury" className={einzelLinkKlassen()}>
            {j.zurJury}
          </Link>
        </p>
        <h1 className="font-buch text-kapitel text-balance text-text">{j.favouritesTitel}</h1>
        <p className="max-w-[56ch] text-body text-pretty text-text-muted max-md:mx-auto">{j.favouritesSatz}</p>
      </header>
      {karten.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4">
          {karten.map((karte, index) => (
            <li key={karte.slug}>
              <BeitragKarte karte={karte} texte={j} sprache={sprache} prioritaet={index < 4} kompakt />
            </li>
          ))}
        </ul>
      ) : null}
      {bewertungen.length > 0 ? (
        <section aria-labelledby="jury-bewertungen" className="flex flex-col gap-4">
          <h2 id="jury-bewertungen" className="font-buch text-h2 text-balance text-text">
            {j.favouritesBewertungen}
          </h2>
          <p className="max-w-[56ch] text-body text-pretty text-text-muted">{j.favouritesBewertungenSatz}</p>
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {bewertungen.map((b) => (
              <li key={b.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-4">
                {b.kultivarSlug ? (
                  <Link prefetch={false} href={`/blueten/${b.kultivarSlug}`} className={`font-buch text-h3 wrap-break-word ${textLinkKlassen()}`}>
                    {b.sorte}
                  </Link>
                ) : (
                  <span className="font-buch text-h3 text-text wrap-break-word">{b.sorte}</span>
                )}
                <span className="text-small text-text-muted">
                  {b.autor.kurzId ? (
                    <Link prefetch={false} href={`/profil/${b.autor.kurzId}`} className={textLinkKlassen()}>
                      {t(j.favouritesVon, { name: b.autor.name })}
                    </Link>
                  ) : (
                    t(j.favouritesVon, { name: b.autor.name })
                  )}
                  <span className="numeric">{`, ${formatiereDatum(b.erstelltAm, sprache)}`}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {karten.length === 0 && bewertungen.length === 0 ? <EmptyState titel={j.leer} /> : null}
    </JuryRahmen>
  );
}
