import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { Doppelseite } from "@/components/review/Doppelseite";
import { DoppelseitenSkelett } from "@/components/story/Skelette";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { Schlagwort } from "@/components/story/Schlagwort";
import { buttonKlassen } from "@/components/ui";
import { neuesteRedaktionelleReview, type RedaktionelleReview } from "@/lib/query/reviews";

/** Lädt den Eintrag; leer und Fehler haben eigene Sätze (Spec 5.2). */
async function EintragInhalt() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  let review: RedaktionelleReview | null;
  try {
    review = await neuesteRedaktionelleReview();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("neuesteRedaktionelleReview fehlgeschlagen", fehler);
    return (
      <p className="border border-border bg-surface-raised p-8 text-body text-text">
        {w.start.eintrag.fehler}
      </p>
    );
  }

  if (!review) {
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

  return <Doppelseite eintrag={review} ueberschrift="h3" story w={w} sprache={sprache} />;
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
      <Schlagwort satz={texte.schlagwort} ton="gruen" oben="bottom-0 translate-y-1/2" />
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
