import { UeberlaufWort, ueberlaufPlatz } from "@/components/story/UeberlaufWort";
import { holeWoerterbuch } from "@/lib/i18n";

/**
 * Sektion 2: das Manifest. Seit 2026-09-25 ohne Chargen (Nutzer: nicht mehr
 * relevant); es trägt, was die Bewertung ausmacht: jedes Terpen einzeln und
 * die Abweichung zwischen Community und Herstellerangabe. Die Kopfzeile mit
 * dem Stand steht jetzt unten im Auftakt (Kopfzeile.tsx).
 */
/*
 * "Umschlag wird Seite" (bewegung/auftakt.ts): die Sektion ist die erste
 * Buchseite und gleitet über den gepinnten Auftakt, deshalb eigene Ebene
 * (`z-10`), deckendes Papier und das Feldbuch-Raster selbst (es deckt das
 * feste Raster darunter ab und liegt mit ihm auf denselben Spalten). Den
 * weichen Schatten nach oben trägt sie nur, solange der Pin besteht
 * (`data-umschlag-seite`, globals.css).
 */
export async function TransparentMachen() {
  const texte = (await holeWoerterbuch()).start.transparent;
  return (
    <section
      aria-labelledby="transparent-titel"
      data-story="transparent"
      className="feldbuch-raster relative isolate z-10 overflow-x-clip bg-surface px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto w-full max-w-360">
        <div data-story="manifest">
          {/* Schlusswort übergroß hinter dem Satz (UeberlaufWort, Nutzer 2026-09-25); das
              Wort-für-Wort-Aufdecken gilt nur dem Satz, nicht den Konturen. */}
          <h2
            id="transparent-titel"
            className="relative isolate mx-auto max-w-4xl text-center font-buch text-erzaehlung text-text text-balance"
            style={ueberlaufPlatz}
          >
            <span data-manifest-zeile="">{texte.satz}</span>{" "}
            <UeberlaufWort wort={texte.ueberlauf} absatz />
          </h2>
        </div>
      </div>
    </section>
  );
}
