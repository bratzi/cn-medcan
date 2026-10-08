import { BlattGlyphe, blattFuellungen } from "@/components/review/BlattAnzeige";
import { ablauf } from "@/components/review/eintritt";
import { formatiereWert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

const BLAETTER = [1, 2, 3, 4, 5] as const;

/**
 * Das Urteil oben auf der rechten Buchseite (Spec 2026-10-05): fünf große Blätter, darunter die
 * Zahl. Seit 2026-10-09 (Nutzer) zentriert im Fokus und die Note in der Akzentschrift (Mr Dafoe),
 * Ausnahme von „Zahlen gedruckt“ im Regelwerk; die Einzelnoten bleiben gedruckt. Die Blätter sind Dekoration, der Wert steht für Vorleser als
 * Text. Es gibt nur eine Blattzeichnung, BlattGlyphe, wie in Eingabe und Anzeige.
 */
export function BlattUrteil({ note, w, sprache }: { note: number; w: Woerterbuch; sprache: Sprache }) {
  const wert = formatiereWert(note, sprache);
  return (
    <div className="flex w-full flex-col items-center gap-2 border-b border-border pb-6 text-center">
      <span aria-hidden="true" className="flex w-56 shrink-0 sm:w-64 lg:w-48 xl:w-64">
        {blattFuellungen(note).map((fuellung, index) => (
          <span key={BLAETTER[index]} data-eintritt="blatt" style={ablauf(index)} className="relative aspect-square min-w-0 flex-1">
            <BlattGlyphe fuellung={fuellung} vorschau={false} />
          </span>
        ))}
      </span>
      <p data-eintritt="auf" style={ablauf(5)} className="flex flex-col items-center">
        <span aria-hidden="true" className="font-hand text-notiz text-logo">
          {wert}
        </span>
        <span aria-hidden="true" className="text-small text-text-muted">
          {w.buch.blaetter}
        </span>
        <span className="sr-only">{t(w.bewerten.blattWert, { wert })}</span>
      </p>
    </div>
  );
}
