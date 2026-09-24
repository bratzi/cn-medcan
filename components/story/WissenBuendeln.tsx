import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { Textur } from "@/components/medien/Textur";
import { WandSkelett } from "@/components/story/Skelette";
import { wandTags, type CommunityZahlen } from "@/lib/query/community";
import { communityZahlen } from "@/lib/query/umfragen";

const DREHUNG = ["-rotate-3", "rotate-2", "-rotate-1"] as const;
const TEXTUR = ["nebel", "marmor", "nebel"] as const;

/**
 * Die Tags der Wand: echte Zähler oder, wenn es nichts zu zählen gibt oder
 * die Abfrage scheitert, die drei Leitsätze (Spec 5.2). Ein Fehler hier darf
 * die Seite nicht kosten; Next-interne Unterbrechungen gehen trotzdem durch.
 */
async function WandReihe() {
  let zahlen: CommunityZahlen | null = null;
  try {
    zahlen = await communityZahlen();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("communityZahlen fehlgeschlagen", fehler);
  }

  return (
    <ul data-story="wand-reihe" className="wand-reihe flex flex-wrap items-center gap-x-16 gap-y-8">
      {wandTags(zahlen).map((text, index) => (
        <li key={text} data-story="wand-tag" className="relative isolate">
          <Textur id={TEXTUR[index % TEXTUR.length]} weich className="absolute -inset-8 -z-10 opacity-30" />
          <span className={`block font-wand text-tag text-kopierstift ${DREHUNG[index % DREHUNG.length]}`}>{text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Sektion 3 (Spec 5.1): die Wand, erster Bruch in der Story. */
export function WissenBuendeln() {
  return (
    <section
      aria-labelledby="wissen-titel"
      data-story="wand"
      data-story-vorhang=""
      className="relative overflow-hidden bg-surface-sunken px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto w-full max-w-360">
        <h2 id="wissen-titel" className="max-w-4xl font-buch text-kapitel text-text text-balance">
          Einer allein weiß wenig. Hier sammelt sich, was viele erfahren.
        </h2>
        <div className="mt-16">
          <Suspense fallback={<WandSkelett />}>
            <WandReihe />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
