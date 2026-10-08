import Link from "next/link";
import { unstable_rethrow } from "next/navigation";

import { KapitelAufschlag, kapitelTexte } from "@/components/kapitel-start/KapitelAufschlag";
import { KapitelImBrowser } from "@/components/kapitel-start/KapitelImBrowser";
import { Schlagwort } from "@/components/story/Schlagwort";
import { buttonKlassen } from "@/components/ui";
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
  const schaufenster = daten ? (
    <KapitelAufschlag daten={daten} art="schaufenster" texte={kapitelTexteFuerInsel} sprache={sprache} />
  ) : (
    <div className="flex flex-col items-start gap-6">
      <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.satzGast}</p>
      <Link prefetch={false} href="/registrieren" className={buttonKlassen("primary")}>
        {texte.kontoAnlegen}
      </Link>
    </div>
  );
  return (
    <section
      id="kapitel"
      aria-labelledby="kapitel-titel"
      data-story="kapitel"
      className="relative isolate overflow-x-clip px-4 pt-24 pb-32 min-[640px]:px-8 min-[640px]:pt-32 min-[640px]:pb-48"
    >
      <Schlagwort satz={texte.schlagwort} ton="lila" />
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12">
        <h2 id="kapitel-titel" className="font-buch text-kapitel text-text text-center min-[640px]:text-left">
          {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em>
        </h2>
        <KapitelImBrowser schaufenster={schaufenster} texte={kapitelTexteFuerInsel} sprache={sprache} />
      </div>
    </section>
  );
}
