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
 * damit sie ohne Scrollen sichtbar ist, als Band über die volle Breite, im
 * Nebentext-Stil der Unterzeile (Versalien, gesperrt; Nutzer 2026-09-25).
 */
export function Kopfzeile() {
  return (
    <div className="grid w-full grid-cols-1 gap-2 border-y border-border-strong px-4 py-2 font-sans text-caption uppercase tracking-gesperrt text-text-muted sm:grid-cols-3 sm:items-center sm:px-8">
      <span>Book of Terpz</span>
      <span className="tabular-nums sm:text-center">
        <Suspense fallback={<>Stand wird geladen</>}>
          <Stand />
        </Suspense>
      </span>
      <span className="sm:text-right">Terps for nerds</span>
    </div>
  );
}
