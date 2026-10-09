import { vollFarbe } from "@/lib/aroma-farben";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";

const STREIFEN = `linear-gradient(90deg, ${GESCHMACKS_ACHSEN.map((a) => vollFarbe(a.enumWert)).join(", ")})`;

type Props = {
  /** Beschriftung der Fläche (Stand, der gilt). */
  mag: string;
  /** Beschriftung der Strichlinie; nur, wenn das Netz „mag nicht“ zeigt. */
  magNicht?: string | null;
  /** Beschriftung der dünnen Kontur; nur, wenn eine Kontur gezeichnet ist. */
  vorher?: string | null;
};

/** Legende mit Form, nicht nur Farbe: Fläche, Strichlinie, dünne Kontur (Tinte, wie im Netz). Die Texte nennt der Aufrufer. */
export function NetzLegende({ mag, magNicht = null, vorher = null }: Props) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-small text-text-muted">
      <li className="inline-flex items-center gap-2">
        {/* Die Fläche ist seit 2026-10-09 die Aroma-Blüte: Farbstreifen in den Geschmacksfarben, Rand in Tinte. */}
        <span aria-hidden="true" className="netz-bluete h-2 w-6 border border-text" style={{ background: STREIFEN }} />
        {mag}
      </li>
      {magNicht ? (
        <li className="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6 text-text">
            <line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" strokeWidth={1.5} strokeDasharray="4 4" />
          </svg>
          {magNicht}
        </li>
      ) : null}
      {vorher ? (
        <li className="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6 text-text">
            <line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1} />
          </svg>
          {vorher}
        </li>
      ) : null}
    </ul>
  );
}
