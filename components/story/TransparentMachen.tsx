import { Suspense } from "react";

import { Bild } from "@/components/medien/Bild";
import { formatiereDatum } from "@/lib/format";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";
import { neuesteRedaktionelleReview } from "@/lib/query/reviews";
import { sicher } from "@/lib/sicher";
import { Schlagwort } from "@/components/story/Schlagwort";

const ERLAEUTERUNG: Record<string, string> = Object.fromEntries(
  BEWERTUNGS_ACHSEN.map((achse) => [achse.key, achse.erlaeuterung]),
);

/** Drei Feldbuch-Notizen, dazu der Zoom Blatt, Blüte, Trichom (Spec 5.1, Sektion 2). */
const NOTIZEN = [
  { titel: "Aussehen", bild: "blatt", text: ERLAEUTERUNG.aussehen },
  { titel: "Geruch", bild: "bluete", text: ERLAEUTERUNG.geruch },
  {
    titel: "Restfeuchte",
    bild: "trichom",
    text: "Zwischen 8 und 13 Prozent ist gut. Darunter wird es staubig, darüber droht Schimmel.",
  },
] as const;

const BUEHNE_SIZES = "(min-width: 768px) 45vw, 100vw";

/** Kopfzeile wie bei einer Zeitung: Stand ist das Datum des neuesten Eintrags. */
async function Stand() {
  // undefined = Abfrage gescheitert: dieselbe Abfrage nutzt Sektion 5, die dann ihren
  // eigenen Fehlersatz zeigt. Hier bleibt die Seite einfach stehen (Spec 5.2).
  const review = await sicher(() => neuesteRedaktionelleReview(), undefined, "Stand der Kopfzeile");
  if (review === undefined) return <>Stand gerade nicht abrufbar</>;
  if (!review) return <>Erste Ausgabe in Arbeit</>;
  return (
    <>
      {"Stand "}
      <time dateTime={review.erstelltAm.toISOString()}>{formatiereDatum(review.erstelltAm)}</time>
    </>
  );
}

export function TransparentMachen() {
  return (
    <section
      aria-labelledby="transparent-titel"
      data-story="transparent"
      className="relative isolate overflow-x-clip px-4 py-24 sm:px-8 sm:py-32"
    >
      <Schlagwort satz="was drin ist" />
      <div className="mx-auto w-full max-w-360">
        <div className="grid grid-cols-1 gap-2 border-y-2 border-text py-2 text-small uppercase tracking-wide text-text sm:grid-cols-3 sm:items-center">
          <span className="font-buch text-h3 font-medium normal-case tracking-normal">Grünes Buch.</span>
          <span className="numeric sm:text-center">
            <Suspense fallback={<>Stand wird geladen</>}>
              <Stand />
            </Suspense>
          </span>
          <span className="sm:text-right">Charge für Charge.</span>
        </div>

        <h2
          id="transparent-titel"
          data-story="manifest"
          className="mt-16 max-w-6xl font-buch text-manifest text-text text-balance"
        >
          Hinter jedem Handelsnamen steckt eine Charge. <em className="italic">Ich schreibe auf,</em> was drin ist.
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-8">
          {/* Bühne ab Tablet: drei Bilder übereinander, per CSS sticky. Die
              StoryBuehne blendet sie scroll-gekoppelt über; ohne Bewegung
              steht das letzte oben. Die Bilder sind hier Wiederholung,
              die zugänglichen stehen in den Notizen. */}
          <div aria-hidden="true" className="hidden md:block">
            <div className="sticky top-16 grid">
              {NOTIZEN.map((notiz) => (
                <div key={notiz.bild} data-story="buehne-bild" className="col-start-1 row-start-1 overflow-hidden">
                  <Bild id={notiz.bild} sizes={BUEHNE_SIZES} dekorativ />
                </div>
              ))}
            </div>
          </div>

          <ol data-story="notizen" className="flex flex-col gap-16 md:gap-[40vh] md:py-[20vh]">
            {NOTIZEN.map((notiz) => (
              <li key={notiz.titel} className="flex flex-col gap-4">
                <div className="md:hidden">
                  <Bild id={notiz.bild} sizes="100vw" />
                </div>
                <h3 className="font-buch text-h1 font-medium text-text">{notiz.titel}</h3>
                <p className="max-w-[48ch] text-body text-text-muted text-pretty">{notiz.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
