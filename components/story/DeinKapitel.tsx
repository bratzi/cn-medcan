import { unstable_rethrow } from "next/navigation";

import { kapitelTexte } from "@/components/kapitel-start/KapitelAufschlag";
import { KapitelImBrowser } from "@/components/kapitel-start/KapitelImBrowser";
import { Schlagwort } from "@/components/story/Schlagwort";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import type { KapitelDaten } from "@/lib/kapitel-start";
import { ladeSchaufensterKapitel } from "@/lib/query/kapitel-start";

/**
 * Sektion „Dein Kapitel“ (Spec Dein Kapitel, Nutzer 2026-10-09): nach der Abstimmung schließt sich
 * die Schleife beim Leser. Gäste sehen das öffentliche Kapitel des Betreibers, Mitglieder ihr eigenes.
 */
export async function DeinKapitel() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const texte = w.start.kapitel;
  const kapitelTexteFuerInsel = kapitelTexte(w);
  let daten: KapitelDaten | null;
  try {
    daten = await ladeSchaufensterKapitel();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("ladeSchaufensterKapitel fehlgeschlagen", fehler);
    daten = null;
  }
  return (
    <section
      id="kapitel"
      aria-labelledby="kapitel-titel"
      data-story="kapitel"
      className="relative isolate overflow-x-clip px-4 pt-24 pb-32 min-[640px]:px-8 min-[640px]:pt-32 min-[640px]:pb-48"
    >
      <Schlagwort satz={texte.schlagwort} ton="lila" />
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12">
        <h2 id="kapitel-titel" className="font-buch text-kapitel text-text text-center text-balance">
          {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em>
        </h2>
        <KapitelImBrowser schaufenster={daten} texte={kapitelTexteFuerInsel} sprache={sprache} />
      </div>
    </section>
  );
}
