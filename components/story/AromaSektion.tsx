import Link from "next/link";
import { Suspense } from "react";

import { AromaErkundung } from "@/components/review/AromaErkundung";
import { erkundungsDaten } from "@/components/review/erkundung-daten";
import { KartenBild, SortenKopf } from "@/components/review/SortenKopf";
import { Schlagwort } from "@/components/story/Schlagwort";
import { buttonKlassen } from "@/components/ui";
import { ladeAromaVorzeige, ladeTerpenKatalog } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";

/** Lädt die vorgeführte Sorte; ohne Daten entfällt die Sektion still (Spec 13.3). */
async function Inhalt() {
  const [sorte, katalog] = await Promise.all([
    sicher(() => ladeAromaVorzeige(), null, "Aroma-Karte der Startseite"),
    sicher(() => ladeTerpenKatalog(), [], "Terpen-Katalog"),
  ]);
  if (!sorte) return null;

  return (
    <div className="mt-16">
      <AromaErkundung
        titel={sorte.handelsname}
        bild={
          <SortenKopf
            handelsname={sorte.handelsname}
            bildPfad={sorte.herstellerBildPfad}
            kultivarName={sorte.kultivarName}
            kultivarTyp={sorte.kultivarTyp}
            genetik={sorte.genetik}
            herstellerName={sorte.herstellerName}
            thcMin={sorte.thcMinProzent}
            thcMax={sorte.thcMaxProzent}
            cbdMin={sorte.cbdMinProzent}
            cbdMax={sorte.cbdMaxProzent}
            terpene={sorte.terpene}
          />
        }
        kartenBild={<KartenBild bildPfad={sorte.herstellerBildPfad} />}
        terpene={sorte.terpene}
        katalog={katalog}
        {...erkundungsDaten(sorte.terpene, sorte.reviews)}
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
          Was der Hersteller verspricht,{" "}
          {/* Übergroße Display-Zeile (Nutzer 2026-09-25): ragt links über den Inhaltsrand
              in den Leerraum, Kontur macht die einstrichige Handschrift kräftiger. */}
          <em
            className="gross-hand farbverlauf -ml-[4vw] block font-hand text-kulisse not-italic whitespace-nowrap leading-[0.85] md:-ml-[6vw]"
            style={{ fontSize: "clamp(5rem, 1rem + 17vw, 22rem)" }}
          >
            prüfen wir nach.
          </em>
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
