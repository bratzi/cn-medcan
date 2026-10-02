import { Suspense } from "react";

import { StimmzettelSkelett } from "@/components/story/Skelette";
import { UmfrageKarte } from "@/components/umfrage/UmfrageKarte";
import { aktiveUmfrage } from "@/lib/query/umfragen";
import { sicher } from "@/lib/sicher";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";

/**
 * Der Stimmzettel. Die Seite ist statisch (Spec 2026-10-01, statische Seiten,
 * 4.3): hier lädt nur die Runde; wer schaut und ob er schon gestimmt hat,
 * klärt der Browser über /api/startseite (StimmzettelAktion). Über das
 * Schreiben entscheidet die Server Action.
 */
async function Stimmzettel() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const geladen = await sicher(async () => ({ umfrage: await aktiveUmfrage() }), null, "Stimmzettel");
  if (!geladen) {
    return (
      <p className="max-w-[48ch] border border-border-strong bg-surface-raised p-8 text-body text-text">
        {w.start.abstimmung.fehler}
      </p>
    );
  }

  const { umfrage } = geladen;
  if (!umfrage) {
    return (
      <p className="max-w-[48ch] border border-border-strong bg-surface-raised p-8 text-body text-text">
        {w.start.abstimmung.keineRunde}
      </p>
    );
  }

  return <UmfrageKarte umfrage={umfrage} zustand="im-browser"w={w} sprache={sprache} />;
}

/**
 * Sektion 6 (Spec TP3 8.6): der Stimmzettel im Buch, "Wähl mit." von Hand.
 * Ziel des Buttons "Wähl mit".
 */
export async function Abstimmung() {
  const w = await holeWoerterbuch();
  const texte = w.start.abstimmung;
  return (
    <section
      id="abstimmung"
      aria-labelledby="abstimmung-titel"
      data-story="abstimmung"
      data-story-vorhang=""
      className="relative isolate overflow-x-clip px-4 pt-32 pb-24 sm:px-8 sm:pt-48 sm:pb-32"
    >
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 lg:grid-cols-[2fr_3fr] lg:items-start">
        <div className="flex flex-col items-start gap-6 max-lg:items-center max-lg:text-center">
          <h2 id="abstimmung-titel" className="font-buch text-kapitel text-text text-balance">
            {texte.titel}
          </h2>
          <p data-story="waehl-mit" className="farbverlauf font-hand text-notiz">
            {texte.waehlMit}
          </p>
          <p className="max-w-[48ch] text-body text-text-muted text-pretty">
            {texte.satz}
          </p>
        </div>

        <Suspense fallback={<StimmzettelSkelett ansage={w.start.skelett.abstimmung} />}>
          <Stimmzettel />
        </Suspense>
      </div>
    </section>
  );
}
