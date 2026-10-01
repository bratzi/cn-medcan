import { cn } from "@/lib/cn";

export type Fuellung = "voll" | "halb" | "leer";

const BLAETTER = [1, 2, 3, 4, 5] as const;

/** Je Blatt: voll ab der ganzen Stufe, halb ab der halben, sonst leer. */
export function blattFuellungen(note: number | null): Fuellung[] {
  return BLAETTER.map((blatt) => (note === null || note < blatt - 0.5 ? "leer" : note >= blatt ? "voll" : "halb"));
}

/*
 * Fächerblatt mit sieben schlanken Fingern im 24er-Raster, spiegelgleich zur
 * Mittelachse x = 12, alle aus dem Ansatz (12, 17). Feiner gezeichnet als zuvor
 * (Nutzer 2026-09-30: „ein bisschen feiner, besser ins Overall-Design“): schmale
 * Linsen statt breiter Finger, Kontur 0,75, runde Enden. Die zwei Hälften sind
 * eigene Flächen (der Mittelfinger längs auf x = 12 geteilt), so füllt sich ein
 * halbes Blatt ohne clipPath und ohne ids im Dokument; LINKS und RECHTS ergeben
 * zusammen genau die Fläche der KONTUR.
 */
const LINKS =
  "M12 17Q10.4 9.5 12 2ZM12 17Q9.9 10.5 5.2 5.6Q7.3 12.1 12 17ZM12 17Q7.87 13.26 2.5 11.8Q6.63 15.54 12 17ZM12 17Q9.6 18.84 6.6 19.2Q9 17.36 12 17Z";
const RECHTS =
  "M12 17Q13.6 9.5 12 2ZM12 17Q14.1 10.5 18.8 5.6Q16.7 12.1 12 17ZM12 17Q16.13 13.26 21.5 11.8Q17.37 15.54 12 17ZM12 17Q14.4 18.84 17.4 19.2Q15 17.36 12 17Z";
const KONTUR =
  "M12 17Q10.4 9.5 12 2Q13.6 9.5 12 17ZM12 17Q9.9 10.5 5.2 5.6Q7.3 12.1 12 17ZM12 17Q7.87 13.26 2.5 11.8Q6.63 15.54 12 17ZM12 17Q9.6 18.84 6.6 19.2Q9 17.36 12 17ZM12 17Q14.1 10.5 18.8 5.6Q16.7 12.1 12 17ZM12 17Q16.13 13.26 21.5 11.8Q17.37 15.54 12 17ZM12 17Q14.4 18.84 17.4 19.2Q15 17.36 12 17Z";
const STRICH = 0.75;

/**
 * Ein Blatt, rein dekorativ: gefüllt in `accent`, leer nur die Kontur in
 * gedämpftem `text-muted` (Nutzer 2026-09-30: ruhiger, feiner). Die
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
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn(
        "pointer-events-none absolute inset-0 size-full transition-colors duration-fast ease-standard",
        fuellung === "leer" ? "text-text-muted" : "text-accent",
      )}
    >
      <path d={LINKS} className={flaeche(fuellung !== "leer")} />
      <path d={RECHTS} className={flaeche(fuellung === "voll")} />
      <path d={KONTUR} fill="none" stroke="currentColor" strokeWidth={STRICH} strokeLinejoin="round" strokeLinecap="round" />
      <path d="M12 17v4.5" fill="none" stroke="currentColor" strokeWidth={STRICH} strokeLinecap="round" />
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
