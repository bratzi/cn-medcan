import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { Schnitte as Daten } from "@/lib/profil-typen";

type Props = { daten: Daten; texte: Woerterbuch["profil"]; noten: Woerterbuch["schema"]["noten"]; sprache: Sprache };

const REIHE = ["aussehen", "geruch", "geschmack", "wirkung", "konsistenz"] as const;

/** Mittel je Kategorie über alle eigenen Bewertungen (Spec Profil 4.5). Wirkung nur hier, privat (HWG). */
export function Schnitte({ daten, texte, noten, sprache }: Props) {
  const werte = [
    ...REIHE.map((k) => ({ k, label: noten[k].label, wert: daten[k] })),
    { k: "gesamt", label: texte.gesamt, wert: daten.gesamt },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-small text-text-muted text-pretty">{texte.schnitteSatz}</p>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
        {werte.map((w) => (
          // gap-1 = 4px: Beschriftung und Wert bilden ein Paar, 8px löst die Zahl vom Wort.
          <div key={w.k} className="flex flex-col gap-1 border-t border-border pt-2">
            <dt className="text-small text-text-muted">{w.label}</dt>
            <dd className="numeric font-buch text-h3 text-text">{formatiereZahl(w.wert, 1, sprache)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
