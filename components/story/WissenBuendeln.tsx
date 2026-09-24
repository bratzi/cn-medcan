import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { Randspalte } from "@/components/story/Randspalte";
import { RandspaltenSkelett } from "@/components/story/Skelette";
import { randnotizen, type CommunityZahlen } from "@/lib/query/community";
import { communityZahlen } from "@/lib/query/umfragen";

/**
 * Die Notizen der Randspalte: echte Zähler oder, wenn es nichts zu zählen
 * gibt oder die Abfrage scheitert, die drei Leitsätze (Spec 5.2). Ein Fehler
 * hier darf die Seite nicht kosten; Next-interne Unterbrechungen gehen
 * trotzdem durch.
 */
async function RandspaltenInhalt() {
  let zahlen: CommunityZahlen | null = null;
  try {
    zahlen = await communityZahlen();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("communityZahlen fehlgeschlagen", fehler);
  }
  return <Randspalte notizen={randnotizen(zahlen)} />;
}

/**
 * Sektion 3 (Spec TP3 8.3): eine Buchseite mit Randspalte. Links der
 * gedruckte Satz, ab lg rechts die Randnotizen der Community; darunter
 * stehen sie direkt unter dem Satz. Grund ist das Papier, kein Schwenk.
 */
export function WissenBuendeln() {
  return (
    <section
      aria-labelledby="wissen-titel"
      data-story="wissen"
      data-story-vorhang=""
      className="relative isolate overflow-x-clip px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
        <h2 id="wissen-titel" className="max-w-4xl font-buch text-kapitel text-text text-balance">
          Einer allein weiß wenig. Hier sammelt sich, was <em className="farbverlauf italic">viele</em> erfahren.
        </h2>
        <div className="lg:border-s lg:border-border lg:ps-8">
          <Suspense fallback={<RandspaltenSkelett />}>
            <RandspaltenInhalt />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
