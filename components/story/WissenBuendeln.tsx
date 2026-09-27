import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { Randspalte } from "@/components/story/Randspalte";
import { RandspaltenSkelett } from "@/components/story/Skelette";
import { randnotizen, type CommunityZahlen } from "@/lib/query/community";
import { communityZahlen } from "@/lib/query/umfragen";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";

/**
 * Die Notizen der Randspalte: echte Zähler oder, wenn es nichts zu zählen
 * gibt oder die Abfrage scheitert, die drei Leitsätze (Spec 5.2). Ein Fehler
 * hier darf die Seite nicht kosten; Next-interne Unterbrechungen gehen
 * trotzdem durch.
 */
async function RandspaltenInhalt() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  let zahlen: CommunityZahlen | null = null;
  try {
    zahlen = await communityZahlen();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("communityZahlen fehlgeschlagen", fehler);
  }
  return <Randspalte notizen={randnotizen(zahlen, w.start.wissen, sprache)} sprache={sprache} />;
}

/**
 * Sektion 3 (Spec TP3 8.3): eine Buchseite mit Randspalte. Links der
 * gedruckte Satz, ab lg rechts die Randnotizen der Community; darunter
 * stehen sie direkt unter dem Satz. Grund ist das Papier, kein Schwenk.
 */
export async function WissenBuendeln() {
  const w = await holeWoerterbuch();
  const texte = w.start.wissen;
  return (
    <section
      aria-labelledby="wissen-titel"
      data-story="wissen"
      data-story-vorhang=""
      className="relative isolate overflow-x-clip px-4 pt-32 pb-24 sm:px-8 sm:pt-48 sm:pb-32"
    >
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
        <h2 id="wissen-titel" className="max-w-4xl font-buch text-kapitel text-text text-balance">
          {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em> {texte.nach}
        </h2>
        <div className="lg:border-s lg:border-border lg:ps-8">
          <Suspense fallback={<RandspaltenSkelett ansage={w.start.skelett.zahlen} />}>
            <RandspaltenInhalt />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
