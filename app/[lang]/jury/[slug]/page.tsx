import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { AutorKasten } from "@/components/jury/AutorKasten";
import { BewertungsBlock } from "@/components/jury/BewertungsBlock";
import { BildBuehne } from "@/components/jury/BildBuehne";
import { JuryRahmen } from "@/components/jury/JuryRahmen";
import { JuryText } from "@/components/jury/JuryText";
import { buttonKlassen } from "@/components/ui";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { juryTextBloecke } from "@/lib/jury-text";
import { ladeJuryBeitrag } from "@/lib/query/jury";
import { ladeJuryBewertung } from "@/lib/query/jury-bewertung";
import { ladeTerpenKatalog } from "@/lib/query/strains";

export const dynamic = "force-static";
export const revalidate = 86400;

type Params = { params: Promise<{ slug: string }> };

/** Eine Abfrage für Metadaten und Seite. */
const lade = cache(ladeJuryBeitrag);

/** Nur eine echte Instagram-Adresse wird verlinkt, nie ein beliebiger gespeicherter Text. */
const INSTAGRAM = /^https:\/\/(www\.)?instagram\.com\//;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const beitrag = await lade(slug);
  if (!beitrag) return {};
  const bild = beitrag.titelbild;
  return {
    title: beitrag.titel,
    description: beitrag.anriss || undefined,
    openGraph: {
      title: beitrag.titel,
      description: beitrag.anriss || undefined,
      images: bild ? [{ url: `/api/bild/${bild.id}`, width: bild.breite, height: bild.hoehe }] : undefined,
    },
  };
}

export default async function JuryBeitragPage({ params }: Params) {
  const { slug } = await params;
  const [w, sprache, beitrag] = await Promise.all([holeWoerterbuch(), holeSprache(), lade(slug)]);
  if (!beitrag) notFound();
  const j = w.jury;
  const [bewertung, katalog] = beitrag.review
    ? await Promise.all([ladeJuryBewertung(beitrag.review.id), ladeTerpenKatalog()])
    : [null, []];
  const name = beitrag.sorte?.name ?? beitrag.titel;

  return (
    <JuryRahmen texte={j}>
      <p>
        <Link prefetch={false} href="/jury" className={einzelLinkKlassen()}>
          {j.zurJury}
        </Link>
      </p>
      <article className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
          <BildBuehne bilder={beitrag.bilder} name={name} texte={j} />
        </div>
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-7">
          <header className="flex flex-col gap-4">
            {beitrag.ausgabe ? (
              <p className="font-sans text-caption uppercase tracking-wide text-text-muted">
                <Link prefetch={false} href={`/jury/ausgabe/${beitrag.ausgabe.slug}`} className="underline underline-offset-4">
                  {`${j.ausgabe}: ${beitrag.ausgabe.titel}`}
                </Link>
              </p>
            ) : null}
            <h1 className="font-buch text-kapitel text-balance text-text wrap-break-word">{beitrag.titel}</h1>
            {beitrag.anriss ? <p className="max-w-[56ch] font-buch text-h2 text-pretty text-text-muted">{beitrag.anriss}</p> : null}
          </header>
          {bewertung && beitrag.review ? (
            <BewertungsBlock
              bewertung={bewertung}
              ziel={{
                strainSlug: beitrag.review.strainSlug,
                kultivarSlug: beitrag.review.kultivarSlug,
                vertreiberId: beitrag.review.vertreiberId,
              }}
              w={w}
              sprache={sprache}
              katalog={katalog}
            />
          ) : null}
          <JuryText bloecke={juryTextBloecke(beitrag.text)} />
          {beitrag.igUrl && INSTAGRAM.test(beitrag.igUrl) ? (
            <p>
              <a
                href={beitrag.igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonKlassen("secondary", "md")}
              >
                {j.aufInstagram}
              </a>
            </p>
          ) : null}
          <AutorKasten
            name={beitrag.autor.name}
            kurzId={beitrag.autor.kurzId}
            avatarId={beitrag.autorAvatarId}
            instagram={beitrag.autorInstagram}
            texte={j}
          />
        </div>
      </article>
    </JuryRahmen>
  );
}
