import { I18N_OEFFENTLICH } from "@/lib/i18n/schalter";
import { SPRACH_NAMEN, SPRACHEN, type Sprache } from "@/lib/i18n/sprache-kern";

type Props = {
  aktuell: Sprache;
  /** Name der Gruppe in der aktuellen Sprache (w.sprache.gruppe). */
  gruppe: string;
};

/** Flaggen als kleine, runde Marken; Deutschland und Vereinigtes Königreich (en-GB). */
function Flagge({ sprache }: { sprache: Sprache }) {
  if (sprache === "de") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="flagge">
        <path d="M0 0h24v8H0z" fill="#1a1a1a" />
        <path d="M0 8h24v8H0z" fill="#dd0000" />
        <path d="M0 16h24v8H0z" fill="#ffce00" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="flagge">
      <path d="M0 0h24v24H0z" fill="#012169" />
      <path d="M0 0l24 24M24 0L0 24" stroke="#fff" strokeWidth="4.8" />
      <path d="M0 0l24 24M24 0L0 24" stroke="#c8102e" strokeWidth="1.6" />
      <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="7" />
      <path d="M12 0v24M0 12h24" stroke="#c8102e" strokeWidth="4" />
    </svg>
  );
}

/**
 * Sprache in der Schalterleiste (T2, Nutzer 2026-09-29): ein Knopf, der die
 * Flagge der aktiven Sprache zeigt und zur anderen wechselt. Der zugängliche
 * Name ist das Ziel, in seiner eigenen Sprache (lang). Ein normales Formular
 * an /api/sprache (Spec 2026-10-01, statische Seiten, 4.1): geht ohne JS und vor
 * dem Hydrieren und lädt die Seite in der neuen Sprache neu.
 * Sichtbar, solange I18N_OEFFENTLICH gilt (lib/i18n/schalter.ts).
 */
export function SprachSchalter({ aktuell, gruppe }: Props) {
  if (!I18N_OEFFENTLICH) return null;
  const ziel = SPRACHEN.find((sprache) => sprache !== aktuell) ?? aktuell;
  return (
    <form method="post" action="/api/sprache" aria-label={gruppe}>
      <button type="submit" name="sprache" value={ziel} className="schalter-knopf" title={SPRACH_NAMEN[ziel]}>
        <Flagge sprache={aktuell} />
        <span className="sr-only" lang={ziel}>
          {SPRACH_NAMEN[ziel]}
        </span>
      </button>
    </form>
  );
}
