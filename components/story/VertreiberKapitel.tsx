import { unstable_rethrow } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { Schlagwort } from "@/components/story/Schlagwort";
import { KAPITEL_RASTER, SortenExplorer } from "@/components/story/SortenExplorer";
import { SKELETT_FLAECHE, SkelettAnsage } from "@/components/story/Skelette";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { ladeSortenExplorer, type ExplorerSorte } from "@/lib/query/sorten-explorer";

/** Lädt die Sorten statisch mit der Startseite; leer und Fehler zeigen nur Kopf und Absatz (Spec 2026-10-15 Abschnitt 4). */
async function Explorer({ kopf }: { kopf: ReactNode }) {
  const ohne = (
    <div className={KAPITEL_RASTER}>
      <div className="flex flex-col gap-8">{kopf}</div>
    </div>
  );
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  let sorten: ExplorerSorte[];
  try {
    sorten = await ladeSortenExplorer();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("ladeSortenExplorer fehlgeschlagen", fehler);
    return ohne;
  }
  if (sorten.length === 0) return ohne;
  return <SortenExplorer sorten={sorten} texte={w.start.vertreiber} typen={w.label.kultivarTyp} sprache={sprache} kopf={kopf} />;
}

/** Nach TransparentMachen: wofür die Beschaffenheit zählt (Spec 2026-10-13 Vertreiber sichtbar). */
export async function VertreiberKapitel() {
  const w = await holeWoerterbuch();
  const texte = w.start.vertreiber;
  const kopf = (
    <>
      <h2 id="vertreiber-kapitel-titel" className="font-buch text-kapitel text-balance text-text max-md:text-center">
        {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em> {texte.nach}
      </h2>
      <p className="max-w-[56ch] text-body text-pretty text-text max-md:mx-auto max-md:text-center">{texte.absatz}</p>
    </>
  );
  return (
    <section
      aria-labelledby="vertreiber-kapitel-titel"
      data-story="vertreiber"
      className="relative isolate overflow-x-clip px-4 pt-24 pb-32 sm:px-8 sm:pt-32 sm:pb-48"
    >
      <Schlagwort satz={texte.schlagwort} ton="gruen" />
      <Suspense
        fallback={
          <div className={KAPITEL_RASTER}>
            <div className="flex flex-col gap-8">{kopf}</div>
            <div role="status" data-skelett="" className="flex flex-col gap-4">
              <SkelettAnsage text={w.start.skelett.vertreiber} />
              <span aria-hidden="true" className={`${SKELETT_FLAECHE} h-96 w-full`} />
            </div>
          </div>
        }
      >
        <Explorer kopf={kopf} />
      </Suspense>
    </section>
  );
}
