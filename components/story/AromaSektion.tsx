import Link from "next/link";
import { Suspense } from "react";

import { erkundungsDaten } from "@/components/review/erkundung-daten";
import { NoteUndErkundung } from "@/components/review/NoteUndErkundung";
import { SortenKopf } from "@/components/review/SortenKopf";
import { Schlagwort } from "@/components/story/Schlagwort";
import { UeberlaufWort, ueberlaufPlatz } from "@/components/story/UeberlaufWort";
import { buttonKlassen } from "@/components/ui";
import { ladeAromaVorzeige, ladeTerpenKatalog } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { aromaTexte } from "@/lib/i18n/typen";

/** Lädt die vorgeführte Sorte; ohne Daten entfällt die Sektion still (Spec 13.3). */
async function Inhalt() {
  const [sorte, katalog, w, sprache] = await Promise.all([
    sicher(() => ladeAromaVorzeige(), null, "Aroma-Karte der Startseite"),
    sicher(() => ladeTerpenKatalog(), [], "Terpen-Katalog"),
    holeWoerterbuch(),
    holeSprache(),
  ]);
  if (!sorte) return null;

  return (
    <div className="mt-16">
      {/* Blatt-Note wie in der Blütenbewertung über der Erkundung (Nutzer 2026-09-30). */}
      <NoteUndErkundung
        modus="example"
        blattTexte={w.bewerten}
        sprache={sprache}
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
            w={w}
            sprache={sprache}
          />
        }
        terpene={sorte.terpene}
        katalog={katalog}
        {...erkundungsDaten(sorte.terpene, sorte.reviews, w.aroma.serien, sorte.kennwerte)}
        texte={aromaTexte(w, sprache)}
        // Zwischen Qualität und Fazit, eins höher als zuvor am Sektionsende (Nutzer 2026-09-26).
        zwischenruf={<Schlagwort satz={w.start.aroma.zwischenruf} ton="gruen" oben="top-0 -translate-y-1/2" />}
      >
        <Link prefetch={false} href={`/blueten/${sorte.slug}`} className={buttonKlassen("secondary", "md")}>
          {w.start.aroma.zurSorte}
        </Link>
      </NoteUndErkundung>
    </div>
  );
}

/**
 * Sektion zwischen Schleife und Eintrag (Spec Redesign 16): die Aroma-Karte
 * als Referenz auf der Startseite. Hält, was der Hersteller angibt, dem
 * Urteil der Community gegenüber, dazu der Sweet Spot je Terpen.
 */
export async function AromaSektion() {
  const texte = (await holeWoerterbuch()).start.aroma;
  return (
    <section
      aria-labelledby="aroma-titel"
      data-story="aroma"
      className="relative isolate overflow-x-clip px-4 py-32 sm:px-8 sm:py-48"
    >
      <div className="mx-auto w-full max-w-360">
        <h2
          id="aroma-titel"
          className="relative isolate max-w-4xl font-buch text-kapitel text-text text-balance max-md:mx-auto max-md:text-center"
          style={ueberlaufPlatz}
        >
          {texte.titel}{" "}
          {/* Schmal eigene Zeile unter dem Satz (Nutzer 2026-09-29: ragte rechts aus dem Bild). */}
          <span className="max-md:hidden">
            <UeberlaufWort wort={texte.ueberlauf} />
          </span>
          <span className="md:hidden">
            <UeberlaufWort wort={texte.ueberlauf} absatz />
          </span>
        </h2>
        <p className="mt-6 max-w-[60ch] text-body text-text-muted text-pretty max-md:mx-auto max-md:text-center">
          {texte.text}
        </p>
        <Suspense fallback={<div className="mt-16 aspect-4/3 w-full max-w-4xl bg-surface-sunken" data-skelett="" />}>
          <Inhalt />
        </Suspense>
      </div>
    </section>
  );
}
