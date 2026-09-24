import { Suspense } from "react";

import { Textur } from "@/components/medien/Textur";
import { StimmzettelSkelett } from "@/components/story/Skelette";
import { UmfrageKarte } from "@/components/umfrage/UmfrageKarte";
import { stimmZustand } from "@/components/umfrage/stimmzustand";
import { aktiveUmfrage, eigeneStimme } from "@/lib/query/umfragen";
import { aktuellesMitglied } from "@/lib/session";
import { sicher } from "@/lib/sicher";

/**
 * Der Stimmzettel. Der Zustand entsteht hier und nur hier; die Karte zeigt
 * ihn an, und über das Schreiben entscheidet die Server Action erneut.
 * Umfrage und Sitzung laden parallel; die eigene Stimme nur für freigegebene
 * Mitglieder.
 */
async function Stimmzettel() {
  const geladen = await sicher(
    async () => {
      const [umfrage, mitglied] = await Promise.all([aktiveUmfrage(), aktuellesMitglied()]);
      const optionId =
        umfrage && mitglied?.freigegeben ? await eigeneStimme(umfrage.id, mitglied.mitgliedId) : null;
      return { umfrage, mitglied, optionId };
    },
    null,
    "Stimmzettel",
  );
  if (!geladen) {
    return (
      <p className="max-w-[48ch] border border-border-strong bg-surface-raised p-8 text-body text-text">
        Die Abstimmung lässt sich gerade nicht laden. Lade die Seite in ein paar Minuten neu, der Rest funktioniert weiter.
      </p>
    );
  }

  const { umfrage, mitglied, optionId } = geladen;
  if (!umfrage) {
    return (
      <p className="max-w-[48ch] border border-border-strong bg-surface-raised p-8 text-body text-text">
        Gerade läuft keine Runde. Die nächste steht hier, sobald sie eröffnet ist.
      </p>
    );
  }

  return <UmfrageKarte umfrage={umfrage} zustand={stimmZustand(mitglied, optionId)} />;
}

/** Sektion 6 (Spec 5.1): die Wand mit dem Stimmzettel. Ziel des Buttons "Wähl mit". */
export function Abstimmung() {
  return (
    <section
      id="abstimmung"
      aria-labelledby="abstimmung-titel"
      data-story="abstimmung"
      data-story-vorhang=""
      className="relative isolate overflow-hidden px-4 py-24 sm:px-8 sm:py-32"
    >
      <span
        aria-hidden="true"
        className="wasserzeichen pointer-events-none absolute -right-8 -bottom-16 -z-10 select-none font-wand text-surface-sunken"
      >
        gb
      </span>

      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 lg:grid-cols-[2fr_3fr] lg:items-start">
        <div className="flex flex-col items-start gap-6">
          <h2 id="abstimmung-titel" className="font-buch text-kapitel text-text text-balance">
            Was teste ich als Nächstes?
          </h2>
          <p data-story="waehl-mit" className="relative -rotate-3 font-wand text-tag text-kopierstift">
            Wähl mit.
            <Textur id="drip" className="absolute top-full left-1/3 -z-10 h-16 w-6" />
          </p>
          <p className="max-w-[48ch] text-body text-text-muted text-pretty">
            Gesetzte Plätze bestimme ich. Über die übrigen stimmen freigeschaltete Mitglieder ab, eine
            Stimme pro Runde.
          </p>
        </div>

        <Suspense fallback={<StimmzettelSkelett />}>
          <Stimmzettel />
        </Suspense>
      </div>
    </section>
  );
}
