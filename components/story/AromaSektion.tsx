import Link from "next/link";
import { Suspense, type CSSProperties } from "react";

import { AromaWechsel } from "@/components/story/AromaWechsel";
import { Schlagwort } from "@/components/story/Schlagwort";
import { UeberlaufWort } from "@/components/story/UeberlaufWort";
import { buttonKlassen } from "@/components/ui";
import { ladeSortenExplorer } from "@/lib/query/sorten-explorer";
import { ladeAromaVorzeige, ladeTerpenKatalog } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";
import { holeSprache, holeWoerterbuch, type Woerterbuch } from "@/lib/i18n";
import { aromaTexte } from "@/lib/i18n/typen";

const EINSTIEGE = [
  { href: "/blueten?typ=INDICA", text: (w: Woerterbuch) => w.label.kultivarTyp.INDICA },
  { href: "/blueten?typ=SATIVA", text: (w: Woerterbuch) => w.label.kultivarTyp.SATIVA },
  { href: "/blueten?geschmack=ZITRUS", text: (w: Woerterbuch) => w.label.geschmack.ZITRUS },
  { href: "/blueten?nurVerfuegbar=1", text: (w: Woerterbuch) => w.start.katalog.nurVerfuegbar },
] as const;

/** Das Wort ist rund 4,7 em breit; 20cqi hält es in der Spalte der Überschrift. */
const UEBERLAUF_SPALTE = { "--ueberlauf-grad": "clamp(2.5rem, 20cqi, 9rem)" } as CSSProperties;

/** Überschrift und Absatz; stehen links über dem Bild der gewählten Sorte. */
function Kopf({ w }: { w: Woerterbuch }) {
  const texte = w.start.aroma;
  return (
    <>
      {/* Seit Explorer und Karte eine Sektion sind, steht der Kopf in der schmalen linken Spalte:
          das Wort in eigener Zeile, Grad an der Spaltenbreite (cqi), sonst läuft es über die
          Sortenwahl rechts (live 2026-10-20). */}
      <h2
        id="aroma-titel"
        className="@container relative isolate max-w-4xl font-buch text-kapitel text-text text-balance max-md:mx-auto max-md:text-center"
        style={UEBERLAUF_SPALTE}
      >
        {texte.titel} <UeberlaufWort wort={texte.ueberlauf} absatz />
      </h2>
      <p className="max-w-[60ch] text-body text-text-muted text-pretty max-md:mx-auto max-md:text-center">{texte.text}</p>
    </>
  );
}

/**
 * Lädt Explorer und Startkarte. Vorgewählt ist die Sorte der meistbewerteten Blüte; steht sie
 * nicht unter den Explorer-Sorten, die erste Sorte mit ihrer eigenen Karte. Ohne Explorer-Daten
 * bleibt die Karte allein; ohne beides entfällt der Inhalt still (Spec 13.3).
 */
async function Inhalt({ w }: { w: Woerterbuch }) {
  const [vorzeige, sorten, katalog, sprache] = await Promise.all([
    sicher(() => ladeAromaVorzeige(), null, "Aroma-Karte der Startseite"),
    sicher(() => ladeSortenExplorer(), [], "Startseiten-Explorer"),
    sicher(() => ladeTerpenKatalog(), [], "Terpen-Katalog"),
    holeSprache(),
  ]);
  const passend = sorten.find((s) => s.slug === vorzeige?.sorteSlug);
  const startSorte = passend ?? sorten[0];
  if (!startSorte && !vorzeige) return null;
  const daten = passend || !startSorte ? vorzeige : await sicher(() => ladeAromaVorzeige(startSorte.slug), null, "Aroma-Karte der Startseite");

  return (
    <AromaWechsel
      sorten={sorten}
      explorerTexte={w.start.vertreiber}
      typen={w.label.kultivarTyp}
      sprache={sprache}
      kopf={<Kopf w={w} />}
      start={{ slug: startSorte?.slug ?? vorzeige?.sorteSlug ?? "", name: startSorte?.name ?? vorzeige?.handelsname ?? "", daten }}
      blattTexte={w.bewerten}
      aromaTexte={aromaTexte(w, sprache)}
      serien={w.aroma.serien}
      katalog={katalog}
      texte={w.start.aroma}
      // Zwischen Qualität und Fazit (Nutzer 2026-09-26).
      zwischenruf={<Schlagwort satz={w.start.aroma.zwischenruf} ton="gruen" oben="top-8 sm:top-12" />}
    />
  );
}

/**
 * Bewertung und Katalog als eine Sektion (Nutzer 2026-10-20: Katalog steuert Bewertung). Oben
 * der Sorten-Explorer mit Suche und Vertreiber-Leiste, darunter die Aroma-Karte der gewählten
 * Sorte, am Ende die Einstiege in den ganzen Katalog.
 */
export async function AromaSektion() {
  const w = await holeWoerterbuch();
  const katalog = w.start.katalog;
  return (
    <section
      aria-labelledby="aroma-titel"
      data-story="aroma"
      className="relative isolate overflow-x-clip px-4 py-32 sm:px-8 sm:py-48"
    >
      <div className="mx-auto flex w-full max-w-360 flex-col gap-16">
        <Suspense fallback={<div className="aspect-4/3 w-full max-w-4xl bg-surface-sunken" data-skelett="" />}>
          <Inhalt w={w} />
        </Suspense>
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8 max-md:flex-col">
          <ul aria-label={katalog.einstiege} className="flex flex-wrap gap-2 max-md:justify-center">
            {EINSTIEGE.map((eintrag) => (
              <li key={eintrag.href}>
                <Link prefetch={false} href={eintrag.href} className={buttonKlassen("secondary", "sm")}>
                  {eintrag.text(w)}
                </Link>
              </li>
            ))}
          </ul>
          <Link prefetch={false} href="/blueten" className={buttonKlassen("secondary", "md")}>
            {katalog.ganzerKatalog}
          </Link>
        </div>
      </div>
    </section>
  );
}
