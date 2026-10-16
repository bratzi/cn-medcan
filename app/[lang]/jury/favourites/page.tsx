import type { Metadata } from "next";
import Link from "next/link";

import { BeitragKarte } from "@/components/jury/BeitragKarte";
import { JuryRahmen } from "@/components/jury/JuryRahmen";
import { EmptyState } from "@/components/ui";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { ladeJuryFavourites } from "@/lib/query/jury";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.jury.favouritesTitel, description: w.jury.favouritesSatz };
}

/** Bildraster der Favourites: neueste zuerst, nie nach Note sortiert (die Jury kürt nicht, sie zeigt). */
export default async function JuryFavouritesPage() {
  const [w, sprache, karten] = await Promise.all([holeWoerterbuch(), holeSprache(), ladeJuryFavourites()]);
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
      ) : (
        <EmptyState titel={j.leer} />
      )}
    </JuryRahmen>
  );
}
