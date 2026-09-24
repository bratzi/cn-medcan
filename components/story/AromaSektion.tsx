import Link from "next/link";
import { Suspense } from "react";

import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
import { AromaSpielwiese } from "@/components/review/AromaSpielwiese";
import { SweetSpot } from "@/components/review/SweetSpot";
import { Schlagwort } from "@/components/story/Schlagwort";
import { buttonKlassen } from "@/components/ui";
import { herstellerProfil } from "@/lib/aromakarte";
import { mittleTerpenIntensitaet, parseTerpenIntensitaet, verdichteGeschmacksMatrix } from "@/lib/query/bewertung";
import { ladeAromaVorzeige } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";

/** Lädt die vorgeführte Sorte; ohne Daten entfällt die Sektion still (Spec 13.3). */
async function Inhalt() {
  const sorte = await sicher(() => ladeAromaVorzeige(), null, "Aroma-Karte der Startseite");
  if (!sorte) return null;

  const hersteller = herstellerProfil(sorte.terpene);
  const community = verdichteGeschmacksMatrix(sorte.reviews);
  const serien: AromaSerie[] = [
    ...(hersteller ? [{ name: "Laut Hersteller", ton: "gruen" as const, matrix: hersteller }] : []),
    ...(community.anzahlBewertungen > 0 ? [{ name: "Laut Community", ton: "lila" as const, matrix: community.matrix }] : []),
  ];
  const intensitaet = mittleTerpenIntensitaet(sorte.reviews.map((review) => parseTerpenIntensitaet(review.terpenIntensitaet)));

  return (
    <div className="mt-16 grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <AromaKarte titel={sorte.handelsname} terpene={sorte.terpene} serien={serien} />
      <div className="flex flex-col items-start gap-8">
        <SweetSpot
          titel="Intensität"
          zeilen={Object.entries(intensitaet).map(([terpen, { mittel, anzahl }]) => ({ terpen, wert: mittel, anzahl }))}
        />
        <Link href={`/produkte/${sorte.slug}`} className={buttonKlassen("secondary", "md")}>
          Zur Sorte
        </Link>
      </div>
      <div className="flex flex-col gap-6 lg:col-span-2">
        <h3 className="font-buch text-h1 font-medium text-text">
          Wie hast <em className="farbverlauf italic">du</em> sie geschmeckt?
        </h3>
        <p className="max-w-[60ch] text-body text-text-muted text-pretty">
          Schieb die Regler und sieh zu, wie sich die Karte verändert. Hier wird nichts gespeichert.
        </p>
        <AromaSpielwiese titel={sorte.handelsname} terpene={sorte.terpene} />
      </div>
    </div>
  );
}

/**
 * Sektion zwischen Schleife und Eintrag (Spec Redesign 16): die Aroma-Karte
 * als Referenz auf der Startseite. Hält, was der Hersteller angibt, dem
 * Urteil der Community gegenüber, dazu der Sweet Spot je Terpen.
 */
export function AromaSektion() {
  return (
    <section
      aria-labelledby="aroma-titel"
      data-story="aroma"
      className="relative isolate overflow-x-clip px-4 py-24 sm:px-8 sm:py-32"
    >
      <Schlagwort satz="stimmt das?" ton="gruen" />
      <div className="mx-auto w-full max-w-360">
        <h2 id="aroma-titel" className="max-w-4xl font-buch text-kapitel text-text text-balance">
          Was der Hersteller verspricht, <em className="farbverlauf italic">prüfen wir nach.</em>
        </h2>
        <p className="mt-6 max-w-[60ch] text-body text-text-muted text-pretty">
          Grün ist das Profil, das die angegebenen Terpene erwarten lassen. Lila ist, was wir beim Probieren gefunden
          haben. Umschalten zeigt dasselbe als Netz.
        </p>
        <Suspense fallback={<div className="mt-16 aspect-4/3 w-full max-w-4xl bg-surface-sunken" data-skelett="" />}>
          <Inhalt />
        </Suspense>
      </div>
    </section>
  );
}
