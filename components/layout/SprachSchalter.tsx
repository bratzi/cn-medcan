import { spracheSetzen } from "@/lib/i18n/aktionen";
import { I18N_OEFFENTLICH } from "@/lib/i18n/schalter";
import { SPRACH_NAMEN, SPRACHEN, type Sprache } from "@/lib/i18n/sprache-kern";

type Props = {
  aktuell: Sprache;
  /** Name der Gruppe in der aktuellen Sprache (w.sprache.gruppe). */
  gruppe: string;
};

/**
 * DE/EN neben dem Grow-Zelt (Spec 4.3). Keine Flaggen: Flaggen zeigen Laender,
 * nicht Sprachen. Jeder Knopf nennt seine Sprache in ihr selbst (lang).
 * Formular statt onClick: geht ohne JS und vor dem Hydrieren.
 * Verborgen, bis alle Wellen uebersetzt sind (lib/i18n/schalter.ts).
 */
export function SprachSchalter({ aktuell, gruppe }: Props) {
  if (!I18N_OEFFENTLICH) return null;
  return (
    <form action={spracheSetzen} className="sprach-schalter" aria-label={gruppe}>
      {SPRACHEN.map((sprache) => (
        <button
          key={sprache}
          type="submit"
          name="sprache"
          value={sprache}
          lang={sprache}
          aria-pressed={sprache === aktuell}
          className="inline-flex h-11 min-w-11 items-center justify-center rounded-full px-2 font-sans text-[0.75rem] font-medium uppercase tracking-gesperrt aria-pressed:underline aria-pressed:decoration-2 aria-pressed:underline-offset-4"
        >
          <span aria-hidden="true">{sprache.toUpperCase()}</span>
          <span className="sr-only">{SPRACH_NAMEN[sprache]}</span>
        </button>
      ))}
    </form>
  );
}
