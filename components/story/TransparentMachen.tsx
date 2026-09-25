import { LoopSchalter } from "@/components/medien/LoopSchalter";
import { Suspense, type ReactNode } from "react";

import { Loop } from "@/components/medien/Loop";
import { formatiereDatum } from "@/lib/format";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";
import { neuesteRedaktionelleReview } from "@/lib/query/reviews";
import { sicher } from "@/lib/sicher";
import { Schlagwort } from "@/components/story/Schlagwort";

const ERLAEUTERUNG: Record<string, string> = Object.fromEntries(
  BEWERTUNGS_ACHSEN.map((achse) => [achse.key, achse.erlaeuterung]),
);

/**
 * Die drei Prüfpunkte zwischen den Absätzen (Spec Redesign 9 und 13): große
 * Bilder in ungleichen, leicht verlaufenen Kreisen (unperfekt mit Absicht),
 * um die der Manifest-Text fließt (float mit shape-outside: ellipse).
 */
const PUNKTE = [
  {
    titel: "Aussehen",
    video: "aussehen-loop",
    text: ERLAEUTERUNG.aussehen,
    seite: "rechts",
    form: "rounded-[62%_38%_55%_45%/48%_60%_40%_52%] rotate-3",
    verzoegerung: "0s",
  },
  {
    titel: "Geruch",
    video: "geruch-loop",
    text: ERLAEUTERUNG.geruch,
    seite: "links",
    form: "rounded-[45%_55%_40%_60%/58%_42%_62%_38%] -rotate-2",
    verzoegerung: "-5s",
  },
  {
    titel: "Restfeuchte",
    video: "feuchte-loop",
    text: "Zwischen 8 und 13 Prozent ist gut. Darunter wird es staubig, darüber droht Schimmel.",
    seite: "rechts",
    form: "rounded-[55%_45%_62%_38%/42%_56%_44%_58%] rotate-1",
    verzoegerung: "-9s",
  },
] as const;

/**
 * Ein Prüfpunkt: je ein Video zum Thema füllt den Blob randlos; der Blob
 * morpht langsam (blob-morph), das Video zoomt leicht (bild-zoom).
 * Reduzierte Bewegung: alles steht, das Standbild bleibt (globals.css).
 */
function Punkt({ punkt }: { punkt: (typeof PUNKTE)[number] }) {
  const seite = punkt.seite === "rechts" ? "float-right ml-8 md:ml-24" : "float-left mr-8 md:mr-24";
  return (
    <aside className={`${seite} my-16 flex w-56 flex-col items-center gap-4 text-center md:w-md [shape-outside:ellipse(50%_45%)]`}>
      <div
        className={`blob-morph relative aspect-square w-full overflow-hidden ${punkt.form}`}
        style={{ animationDelay: punkt.verzoegerung }}
      >
        <Loop id={punkt.video} className="bild-zoom h-full" />
      </div>
      {/* Pause fuer die Videos (WCAG 2.2.2); sichtbar erst, wenn loops.ts sie startet. */}
      <LoopSchalter />
      <h3 className="font-buch text-h3 font-medium text-text">{punkt.titel}</h3>
      <p className="text-small text-text-muted text-pretty">{punkt.text}</p>
    </aside>
  );
}

/** Ein Absatz des Manifests: scroll-gekoppelt Wort für Wort sichtbar (transparent.ts). */
function Zeile({ children }: { children: ReactNode }) {
  return (
    <p data-manifest-zeile="" className="mt-24 font-buch text-manifest text-text md:mt-32">
      {children}
    </p>
  );
}

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

        <div data-story="manifest" className="mt-16 flow-root">
          <h2 id="transparent-titel" data-manifest-zeile="" className="font-buch text-manifest text-text text-balance">
            Hinter jedem Handelsnamen steckt eine <em className="farbverlauf font-hand text-manifest not-italic">Charge.</em> Wir schreiben auf, was
            drin ist.
          </h2>
          <Punkt punkt={PUNKTE[0]} />
          <Zeile>
            Nicht, was auf der Dose steht. Sondern wie sie aussieht, wie sie riecht, wie sie sich anfühlt, wie
            feucht sie ist und wie sie brennt.
          </Zeile>
          <Punkt punkt={PUNKTE[1]} />
          <Zeile>
            Jede Bewertung hängt an <em className="farbverlauf font-hand text-manifest not-italic">genau einer Charge.</em> Gleiches Schema,
            jedes Mal, damit wir vergleichen können.
          </Zeile>
          <Punkt punkt={PUNKTE[2]} />
          <Zeile>
            Wir lesen, was wir gefunden haben. Wir stimmen ab, was als Nächstes drankommt. Und alle wissen
            danach ein bisschen mehr.
          </Zeile>
        </div>
      </div>
    </section>
  );
}
