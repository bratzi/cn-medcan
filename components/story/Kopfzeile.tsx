import { Suspense } from "react";

import { formatiereDatum } from "@/lib/format";
import { neuesteRedaktionelleReview } from "@/lib/query/reviews";
import { sicher } from "@/lib/sicher";

/** Stand ist das Datum des neuesten Eintrags, wie bei einer Zeitung. */
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

/**
 * Kopfzeile wie bei einer Zeitung. Steht unten in der ersten Ansicht (Auftakt),
 * damit sie ohne Scrollen sichtbar ist (Nutzer 2026-09-25).
 */
export function Kopfzeile() {
  return (
    <div className="grid grid-cols-1 gap-2 border-y-2 border-text py-2 text-small uppercase tracking-wide text-text sm:grid-cols-3 sm:items-center">
      <span className="font-buch text-h3 font-medium normal-case tracking-normal">Grünes Buch.</span>
      <span className="numeric sm:text-center">
        <Suspense fallback={<>Stand wird geladen</>}>
          <Stand />
        </Suspense>
      </span>
      <span className="sm:text-right">Terpen für Terpen.</span>
    </div>
  );
}
