import { cn } from "@/lib/cn";

export type Fuellung = "voll" | "halb" | "leer";

const BLAETTER = [1, 2, 3, 4, 5] as const;

/** Je Blatt: voll ab der ganzen Stufe, halb ab der halben, sonst leer. */
export function blattFuellungen(note: number | null): Fuellung[] {
  return BLAETTER.map((blatt) => (note === null || note < blatt - 0.5 ? "leer" : note >= blatt ? "voll" : "halb"));
}

/*
 * Fächerblatt mit sieben Fingern im 24er-Raster, spiegelgleich zur Mittelachse
 * x = 12. Die zwei Hälften sind eigene Flächen (der Mittelfinger längs geteilt),
 * so füllt sich ein halbes Blatt ohne clipPath und ohne ids im Dokument.
 */
const KONTUR =
  "M12 16.5Q9 9 12 1.5Q15 9 12 16.5ZM12 16.5Q10.4 9.9 4.7 6.4Q6.2 13 12 16.5ZM12 16.5Q8 12.5 2.3 12.6Q6.3 16.6 12 16.5ZM12 16.5Q8.7 15.8 6.2 18.2Q9.6 18.9 12 16.5ZM12 16.5Q17.8 13 19.3 6.4Q13.6 9.9 12 16.5ZM12 16.5Q17.7 16.6 21.7 12.6Q16 12.5 12 16.5ZM12 16.5Q14.4 18.9 17.8 18.2Q15.3 15.8 12 16.5Z";
const LINKS =
  "M12 16.5Q9 9 12 1.5ZM12 16.5Q10.4 9.9 4.7 6.4Q6.2 13 12 16.5ZM12 16.5Q8 12.5 2.3 12.6Q6.3 16.6 12 16.5ZM12 16.5Q8.7 15.8 6.2 18.2Q9.6 18.9 12 16.5Z";
const RECHTS =
  "M12 16.5Q15 9 12 1.5ZM12 16.5Q17.8 13 19.3 6.4Q13.6 9.9 12 16.5ZM12 16.5Q17.7 16.6 21.7 12.6Q16 12.5 12 16.5ZM12 16.5Q14.4 18.9 17.8 18.2Q15.3 15.8 12 16.5Z";

/**
 * Ein Blatt, rein dekorativ: gefüllt in `accent`, leer nur die Kontur. Die
 * Vorschau unter dem Zeiger füllt in `accent-hover` (Hover über das eigene
 * Token, nicht über Deckkraft). Bewegung nur Farbe und Deckkraft, kurz; bei
 * reduzierter Bewegung (globale Regel) und im Sparmodus (globals.css,
 * `.blatt-note`) wechselt der Zustand sofort. Die einzige Blattzeichnung:
 * Eingabe (BlattNote) und Anzeige (BlattAnzeige) teilen sie.
 */
export function BlattGlyphe({ fuellung, vorschau }: { fuellung: Fuellung; vorschau: boolean }) {
  const flaeche = (an: boolean) =>
    cn(
      "transition-[fill,opacity] duration-fast ease-standard",
      vorschau ? "fill-accent-hover" : "fill-accent",
      an ? "opacity-100" : "opacity-0",
    );
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute inset-0 size-full text-accent">
      <path d={LINKS} className={flaeche(fuellung !== "leer")} />
      <path d={RECHTS} className={flaeche(fuellung === "voll")} />
      <path d={KONTUR} fill="none" stroke="currentColor" strokeWidth={1} strokeLinejoin="round" />
      <path d="M12 16.5v5.5" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" />
    </svg>
  );
}

/**
 * Die Gesamtnote nur zum Lesen (Buch, T7, Nutzer 2026-09-29): dieselben fünf
 * Blätter wie in der Eingabe, ohne Radios und ohne Zeiger. Der Wert steht
 * daneben als Text ("3,5 von 5 Blättern"); die Blätter sind Dekoration.
 */
export function BlattAnzeige({ note, text }: { note: number; text: string }) {
  return (
    // Zeile als inline-flex in einem Block: sie folgt der Textausrichtung der Seite
    // (/reviews ist schmal zentriert), statt als Flex-Kind die volle Breite zu nehmen.
    <div>
      <p className="inline-flex flex-wrap items-center gap-4">
        <span aria-hidden="true" className="flex w-40 shrink-0 sm:w-48">
          {blattFuellungen(note).map((fuellung, index) => (
            <span key={BLAETTER[index]} className="relative aspect-square min-w-0 flex-1">
              <BlattGlyphe fuellung={fuellung} vorschau={false} />
            </span>
          ))}
        </span>
        <span className="numeric text-small text-text-muted">{text}</span>
      </p>
    </div>
  );
}
