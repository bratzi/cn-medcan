import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { BeitragKarte } from "@/components/jury/BeitragKarte";
import { JuryRahmen } from "@/components/jury/JuryRahmen";
import { EmptyState } from "@/components/ui";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { formatiereDatum } from "@/lib/format";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { t } from "@/lib/i18n/text";
import { ladeJuryAusgabe } from "@/lib/query/jury";

export const dynamic = "force-static";
export const revalidate = 86400;

type Params = { params: Promise<{ slug: string }> };

const lade = cache(ladeJuryAusgabe);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const ausgabe = await lade(slug);
  if (!ausgabe) return {};
  const bild = ausgabe.beitraege.find((b) => b.titelbild)?.titelbild ?? null;
  return {
    title: ausgabe.titel,
    description: ausgabe.einleitung || undefined,
    openGraph: {
      title: ausgabe.titel,
      description: ausgabe.einleitung || undefined,
      images: bild ? [{ url: `/api/bild/${bild.id}`, width: bild.breite, height: bild.hoehe }] : undefined,
    },
  };
}

export default async function JuryAusgabePage({ params }: Params) {
  const { slug } = await params;
  const [w, sprache, ausgabe] = await Promise.all([holeWoerterbuch(), holeSprache(), lade(slug)]);
  if (!ausgabe) notFound();
  const j = w.jury;

  return (
    <JuryRahmen texte={j}>
      <header className="flex flex-col gap-4 max-md:text-center">
        <p>
          <Link prefetch={false} href="/jury" className={einzelLinkKlassen()}>
            {j.zurJury}
          </Link>
        </p>
        {ausgabe.erscheintAm ? (
          <p className="font-sans text-caption uppercase tracking-wide text-text-muted">
            {t(j.ausgabeVom, { datum: formatiereDatum(ausgabe.erscheintAm, sprache) })}
          </p>
        ) : null}
        <h1 className="font-buch text-display text-balance text-text wrap-break-word">{ausgabe.titel}</h1>
        {ausgabe.einleitung ? (
          <p className="max-w-[56ch] text-body text-pretty text-text-muted max-md:mx-auto">{ausgabe.einleitung}</p>
        ) : null}
      </header>
      {ausgabe.beitraege.length > 0 ? (
        <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {ausgabe.beitraege.map((karte, index) => (
            <li key={karte.slug}>
              <BeitragKarte karte={karte} texte={j} sprache={sprache} prioritaet={index === 0} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState titel={j.leer} />
      )}
    </JuryRahmen>
  );
}
