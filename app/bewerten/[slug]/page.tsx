import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { BewertungsFormular } from "@/components/review/BewertungsFormular";
import { buttonKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ladeStrainDetail } from "@/lib/query/strains";
import { aktuellesMitglied } from "@/lib/session";

export const metadata: Metadata = { title: "Bewerten" };
export const dynamic = "force-dynamic";

/**
 * Bewertung schreiben (Spec Redesign 17). Nur freigeschaltete Mitglieder;
 * alle anderen sehen, was ihnen fehlt. Preise braucht die Seite nicht,
 * deshalb lädt sie die Sorte ohne Fachkreis-Sicht.
 */
export default async function BewertenPage({ params }: PageProps<"/bewerten/[slug]">) {
  const { slug } = await params;
  const [strain, mitglied] = await Promise.all([ladeStrainDetail(slug, false), aktuellesMitglied()]);
  if (!strain) notFound();

  const zurueck = { href: `/produkte/${strain.slug}`, text: strain.handelsname };

  return (
    <>
      <Seitenkopf
        titel={`${strain.handelsname} bewerten`}
        satz="Nach festem Schema, an eine Charge gebunden. Damit wir vergleichen können."
        zurueck={zurueck}
      />
      <div className={cn(seitenRahmen(), "pt-12 pb-24 sm:pt-16")}>
        {!mitglied ? (
          <div className="flex flex-col items-start gap-6">
            <p className="text-body text-text">Zum Bewerten bitte anmelden.</p>
            <Link href={`/anmelden?weiter=/bewerten/${strain.slug}`} className={buttonKlassen("primary", "md")}>
              Anmelden
            </Link>
          </div>
        ) : !mitglied.freigegeben ? (
          <p className="max-w-[60ch] text-body text-text">
            Sobald dein Konto freigeschaltet ist, kannst du hier bewerten.
          </p>
        ) : (
          <BewertungsFormular
            strainId={strain.id}
            handelsname={strain.handelsname}
            terpene={strain.terpene}
            chargen={strain.chargen.map((charge) => charge.chargenNr)}
            istBetreiber={mitglied.rolle === "ADMIN"}
          />
        )}
      </div>
    </>
  );
}
