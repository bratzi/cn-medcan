import Link from "next/link";
import { Suspense } from "react";

import { AromaErkundung } from "@/components/review/AromaErkundung";
import { type AromaSerie } from "@/components/review/AromaKarte";
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
    <div className="mt-16">
      <AromaErkundung
        titel={sorte.handelsname}
        terpene={sorte.terpene}
        serien={serien}
        zeilen={Object.entries(intensitaet).map(([terpen, { mittel, anzahl }]) => ({ terpen, wert: mittel, anzahl }))}
      >
        <Link href={`/produkte/${sorte.slug}`} className={buttonKlassen("secondary", "md")}>
          Zur Sorte
        </Link>
      </AromaErkundung>
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
      <Schlagwort satz="stimmt das?" ton="gruen" oben="top-8" />
      <div className="mx-auto w-full max-w-360">
        <h2 id="aroma-titel" className="max-w-4xl font-buch text-kapitel text-text text-balance">
          Was der Hersteller verspricht, <em className="farbverlauf italic">prüfen wir nach.</em>
        </h2>
        <p className="mt-6 max-w-[60ch] text-body text-text-muted text-pretty">
          Grün ist das Profil, das die angegebenen Terpene erwarten lassen. Lila ist, was wir beim Probieren gefunden
          haben. Schieb die Punkte beim Sweet Spot, und die Karte zeigt deinen Eindruck.
        </p>
        <Suspense fallback={<div className="mt-16 aspect-4/3 w-full max-w-4xl bg-surface-sunken" data-skelett="" />}>
          <Inhalt />
        </Suspense>
      </div>
    </section>
  );
}
