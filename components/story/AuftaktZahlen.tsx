import { unstable_rethrow } from "next/navigation";

import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { auftaktEintraege, hatAuftaktZahlen, type AuftaktZahlen as Zahlen } from "@/lib/query/auftakt-zahlen";
import { auftaktZahlen } from "@/lib/query/start-zahlen";

/**
 * Die Zahlenleiste im Auftakt (Spec 2026-10-08 Auftakt, 3 und 5). Scheitert
 * die Abfrage oder ist alles 0, bleibt der Raum leer und der Auftakt steht
 * trotzdem; Next-interne Unterbrechungen gehen durch.
 *
 * Der Endwert steht im HTML: ohne JavaScript und bei reduzierter Bewegung
 * ist er sofort richtig. Die Ziffern sind aria-hidden, damit Vorleser nicht
 * das Hochzählen mitlesen; der Endwert steht als sr-only daneben. Das
 * Merkmal heißt data-auftakt-zaehler, nicht wie das der Noten: das greift
 * eintrag.ts seitenweit ab. select-none an den Ziffern: wer die Leiste
 * markiert und kopiert, bekommt jede Zahl einmal (aus dem sr-only). Zahlen gesetzt wie in der Randspalte (numeric).
 */
export async function AuftaktZahlen() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  let zahlen: Zahlen | null = null;
  try {
    zahlen = await auftaktZahlen();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("auftaktZahlen fehlgeschlagen", fehler);
  }
  if (!zahlen || !hatAuftaktZahlen(zahlen)) return null;

  return (
    <dl data-story="zahlen" data-story-einstieg="" className="grid w-full max-w-3xl grid-cols-3 gap-2 text-center sm:gap-8">
      {auftaktEintraege(zahlen, w.start.auftakt.zahlen, sprache).map((eintrag) => (
        <div key={eintrag.schluessel} className="flex flex-col-reverse items-center justify-end gap-2">
          <dt className="font-sans text-caption uppercase hyphens-auto text-balance text-text sm:text-small tracking-normal sm:tracking-gesperrt">{eintrag.wort}</dt>
          <dd className="numeric text-h1 sm:text-display leading-none text-text">
            <span aria-hidden="true" className="select-none" data-auftakt-zaehler="" data-ziel={eintrag.zahl}>
              {eintrag.text}
            </span>
            <span className="sr-only">{eintrag.text}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
