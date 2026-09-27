import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { BewertungsFormular } from "@/components/review/BewertungsFormular";
import { erkundungsDaten } from "@/components/review/erkundung-daten";
import { SortenKopf } from "@/components/review/SortenKopf";
import { buttonKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ladeStrainDetail, ladeTerpenKatalog } from "@/lib/query/strains";
import { aktuellesMitglied } from "@/lib/session";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { aromaTexte } from "@/lib/i18n/typen";
import { t } from "@/lib/i18n/text";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await holeWoerterbuch()).bewerten.metaTitel };
}
export const dynamic = "force-dynamic";

/**
 * Bewertung schreiben (Spec Redesign 17). Nur freigeschaltete Mitglieder;
 * alle anderen sehen, was ihnen fehlt. Preise braucht die Seite nicht,
 * deshalb lädt sie die Sorte ohne Fachkreis-Sicht.
 */
export default async function BewertenPage({ params }: PageProps<"/bewerten/[slug]">) {
  const { slug } = await params;
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const [strain, mitglied, katalog] = await Promise.all([
    ladeStrainDetail(slug, false),
    aktuellesMitglied(),
    ladeTerpenKatalog(),
  ]);
  if (!strain) notFound();

  const zurueck = { href: `/blueten/${strain.slug}`, text: strain.handelsname };

  return (
    <>
      <Seitenkopf
        titel={t(w.bewerten.titel, { name: strain.handelsname })}
        satz={w.bewerten.satz}
        zurueck={zurueck}
      />
      <div className={cn(seitenRahmen(), "pt-12 pb-24 sm:pt-16")}>
        {!mitglied ? (
          <div className="flex flex-col items-start gap-6">
            <p className="text-body text-text">{w.bewerten.anmeldenHinweis}</p>
            <Link href={`/anmelden?weiter=/bewerten/${strain.slug}`} className={buttonKlassen("primary", "md")}>
              {w.bewerten.anmelden}
            </Link>
          </div>
        ) : !mitglied.freigegeben ? (
          <p className="max-w-[60ch] text-body text-text">
            {w.bewerten.nichtFreigegeben}
          </p>
        ) : (
          <BewertungsFormular
            strainId={strain.id}
            handelsname={strain.handelsname}
            terpene={strain.terpene}
            chargen={strain.chargen.map((charge) => charge.chargenNr)}
            istBetreiber={mitglied.rolle === "ADMIN"}
            katalog={katalog}
            aromaTexte={aromaTexte(w, sprache)}
            texte={w.bewerten}
            kopf={
              <SortenKopf
                handelsname={strain.handelsname}
                bildPfad={strain.herstellerBildPfad}
                kultivarName={strain.kultivarName}
                kultivarTyp={strain.kultivarTyp}
                genetik={strain.genetik}
                herstellerName={strain.hersteller?.name ?? null}
                thcMin={strain.thcMinProzent}
                thcMax={strain.thcMaxProzent}
                cbdMin={strain.cbdMinProzent}
                cbdMax={strain.cbdMaxProzent}
                terpene={strain.terpene}
                w={w}
                sprache={sprache}
              />
            }
            {...erkundungsDaten(strain.terpene, strain.reviews, w.aroma.serien)}
          />
        )}
      </div>
    </>
  );
}
