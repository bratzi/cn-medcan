import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { EigeneLikes } from "@/components/reaktionen/EigeneLikes";
import { Buch } from "@/components/review/Buch";
import { BuchDoppelseite } from "@/components/review/BuchDoppelseite";
import { alsEintrag, eintragAnker } from "@/components/review/eintrag";
import { DoppelseitenSkelett } from "@/components/story/Skelette";
import { JuryBild } from "@/components/medien/Bild";
import { holeSprache, holeWoerterbuch, type Woerterbuch } from "@/lib/i18n";
import { t } from "@/lib/i18n/text";
import { ladeNeuestenJuryBeitrag, type JuryKarte } from "@/lib/query/jury";
import { Schlagwort } from "@/components/story/Schlagwort";
import { buttonKlassen } from "@/components/ui";
import { ladeNeuestenBetreiberEintrag, type BandEintrag } from "@/lib/query/buch-band";
import { reaktionenFuer } from "@/lib/query/reaktionen";
import { ladeTerpenKatalog } from "@/lib/query/strains";

/**
 * Der neueste Jury-Beitrag (Startseite zieht bei der Darstellung der Bewertungen mit): Titelbild
 * ganz im Rahmen, Sorte, Titel, Anriss, Autor und der Weg in den Beitrag. Ein Link, ein Knopf.
 */
function JuryAufmacher({ karte, w }: { karte: JuryKarte; w: Woerterbuch }) {
  const bild = karte.titelbild;
  return (
    <article className="grid grid-cols-1 gap-8 border border-border bg-surface-raised p-6 sm:p-10 lg:grid-cols-12 lg:items-center lg:gap-12">
      <div className="aspect-4/5 w-full overflow-hidden border border-border bg-surface-sunken sm:aspect-square lg:col-span-5 lg:aspect-4/5">
        {bild ? (
          <JuryBild
            id={bild.id}
            breite={bild.breite}
            hoehe={bild.hoehe}
            alt={bild.alt || karte.titel}
            className="block size-full object-contain"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col items-start gap-4 lg:col-span-7">
        {karte.sorte ? <p className="text-small text-text-muted wrap-break-word">{karte.sorte.name}</p> : null}
        <h3 className="font-buch text-kapitel text-balance text-text wrap-break-word">{karte.titel}</h3>
        {karte.anriss ? <p className="max-w-[56ch] text-body text-pretty text-text-muted">{karte.anriss}</p> : null}
        <p className="text-small text-text-muted">{t(w.jury.von, { name: karte.autor.name })}</p>
        <Link prefetch={false} href={`/jury/${karte.slug}`} className={buttonKlassen("primary", "md")}>
          {w.jury.lesen}
        </Link>
      </div>
    </article>
  );
}

/** Lädt den Eintrag; leer und Fehler haben eigene Sätze (Spec 5.2). */
async function EintragInhalt() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  // Ein sichtbarer Jury-Beitrag geht vor; ohne Beitrag (oder bei Fehler) bleibt der bisherige Eintrag.
  const juryBeitrag = await ladeNeuestenJuryBeitrag().catch((fehler: unknown) => {
    unstable_rethrow(fehler);
    console.error("ladeNeuestenJuryBeitrag fehlgeschlagen", fehler);
    return null;
  });
  if (juryBeitrag) return <JuryAufmacher karte={juryBeitrag} w={w} />;
  let neuester: BandEintrag | null;
  let katalog: Awaited<ReturnType<typeof ladeTerpenKatalog>>;
  try {
    [neuester, katalog] = await Promise.all([ladeNeuestenBetreiberEintrag(), ladeTerpenKatalog()]);
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("ladeNeuestenBetreiberEintrag fehlgeschlagen", fehler);
    return (
      <p className="border border-border bg-surface-raised p-8 text-body text-text">
        {w.start.eintrag.fehler}
      </p>
    );
  }

  if (!neuester) {
    return (
      <div className="flex flex-col items-start gap-6 border border-border bg-surface-raised p-8 sm:p-12">
        <p className="font-buch text-kapitel text-text">{w.start.eintrag.leerTitel}</p>
        <p className="max-w-[48ch] text-body text-text-muted">
          {w.start.eintrag.leerText}
        </p>
        <Link prefetch={false} href="#abstimmung" className={buttonKlassen("secondary", "md")}>
          {w.start.eintrag.zurAbstimmung}
        </Link>
      </div>
    );
  }

  // Dieselbe Doppelseite wie im großen Buch auf /reviews, mit Bild und Sorte (Nutzer 2026-10-09).
  const { review, produkt } = neuester;
  const zaehler = (await reaktionenFuer("BEWERTUNG", [review.id])).get(review.id);
  return (
    <EigeneLikes>
    <Buch
      bezeichnung={`${w.start.eintrag.vor} ${w.start.eintrag.betont} ${w.start.eintrag.nach}`}
      texte={{
        tastatur: w.buch.tastatur,
        seite: w.buch.seite,
        zurueck: w.buch.zurueck,
        weiter: w.buch.weiter,
        anhalten: w.buch.anhalten,
        abspielen: w.buch.abspielen,
      }}
      seiten={[
        {
          anker: eintragAnker(review.id),
          inhalt: (
            <BuchDoppelseite eintrag={alsEintrag(review, produkt, zaehler?.likes, zaehler?.kommentare)} ueberschrift="h3" w={w} sprache={sprache} katalog={katalog} sorte auszug />
          ),
        },
      ]}
    />
    </EigeneLikes>
  );
}

/** Sektion 5 (Spec 5.1): der Höhepunkt der Story. */
export async function NeuesterEintrag() {
  const w = await holeWoerterbuch();
  const texte = w.start.eintrag;
  return (
    <section
      aria-labelledby="eintrag-titel"
      data-story="eintrag"
      className="relative isolate overflow-x-clip bg-linear-to-b from-transparent via-surface-sunken to-transparent px-4 pt-24 pb-32 sm:px-8 sm:pt-32 sm:pb-48"
    >
      {/* Unter dem Eintrag, nicht darüber (Nutzer 2026-09-25). */}
      <Schlagwort satz={texte.schlagwort} ton="gruen" oben="bottom-8 sm:bottom-12" />
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12">
        <h2 id="eintrag-titel" className="font-buch text-kapitel text-text max-md:text-center">
          {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em> {texte.nach}
        </h2>
        <Suspense fallback={<DoppelseitenSkelett ansage={w.start.skelett.eintrag} />}>
          <EintragInhalt />
        </Suspense>
      </div>
    </section>
  );
}
