import Link from "next/link";
import { Suspense } from "react";

import { mittleBeschaffenheit } from "@/components/review/BeschaffenheitsLeiste";
import { mittleNoten } from "@/components/review/GesamteindruckLeiste";
import { AromaErkundung } from "@/components/review/AromaErkundung";
import { type AromaSerie } from "@/components/review/AromaKarte";
import { Bild } from "@/components/medien/Bild";
import { Schlagwort } from "@/components/story/Schlagwort";
import { buttonKlassen } from "@/components/ui";
import { blueteBild } from "@/lib/medien";
import { herstellerProfil, mittlereHerstellerTreue } from "@/lib/aromakarte";
import {
  mittleTerpenIntensitaet,
  parseGeschmacksMatrix,
  parseBeschaffenheit,
  parseTerpenIntensitaet,
  verdichteGeschmacksMatrix,
} from "@/lib/query/bewertung";
import { ladeAromaVorzeige, ladeTerpenKatalog } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";

/** Lädt die vorgeführte Sorte; ohne Daten entfällt die Sektion still (Spec 13.3). */
async function Inhalt() {
  const [sorte, katalog] = await Promise.all([
    sicher(() => ladeAromaVorzeige(), null, "Aroma-Karte der Startseite"),
    sicher(() => ladeTerpenKatalog(), [], "Terpen-Katalog"),
  ]);
  if (!sorte) return null;

  const bildId = blueteBild(sorte.herstellerBildPfad);
  const bild = bildId ? (
    <figure className="flex w-40 flex-col items-start gap-1 sm:w-48">
      <Bild id={bildId} dekorativ sizes="192px" className="aspect-square w-full object-contain" />
      <figcaption className="text-caption text-text-muted">Symbolbild</figcaption>
    </figure>
  ) : null;
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
        bild={bild}
        terpene={sorte.terpene}
        serien={serien}
        katalog={katalog}
        treue={mittlereHerstellerTreue(hersteller, sorte.reviews.map((review) => parseGeschmacksMatrix(review.geschmacksMatrix)))}
        zeilen={Object.entries(intensitaet).map(([terpen, { mittel, anzahl }]) => ({ terpen, wert: mittel, anzahl }))}
        gesamteindruck={mittleNoten(sorte.reviews)}
        beschaffenheit={mittleBeschaffenheit(
          sorte.reviews.map((review) => ({
            beschaffenheit: parseBeschaffenheit(review.beschaffenheit),
            feuchte: review.feuchtigkeitProzent,
          })),
        )}
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
      {/* Am Ende der Graphensektion, nicht am Anfang (Nutzer 2026-09-25). */}
      <Schlagwort satz="stimmt das?" ton="gruen" oben="bottom-0 translate-y-1/2" />
      <div className="mx-auto w-full max-w-360">
        <h2 id="aroma-titel" className="max-w-4xl font-buch text-kapitel text-text text-balance">
          Was der Hersteller verspricht, <em className="farbverlauf hand-betont">prüfen wir nach.</em>
        </h2>
        <p className="mt-6 max-w-[60ch] text-body text-text-muted text-pretty">
          Erst der Gesamteindruck, dann die Terpene: Grün ist das Profil, das die Herstellerangaben erwarten lassen,
          Lila ist, was wir beim Probieren gefunden haben. Zum Schluss die Beschaffenheit. Zieh an den Reglern, und alles
          zeigt deinen Eindruck.
        </p>
        <Suspense fallback={<div className="mt-16 aspect-4/3 w-full max-w-4xl bg-surface-sunken" data-skelett="" />}>
          <Inhalt />
        </Suspense>
      </div>
    </section>
  );
}
