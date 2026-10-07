import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { Lieblingshersteller as Daten } from "@/lib/profil-typen";

type Props = { daten: Daten | null; texte: Woerterbuch["profil"]; sprache: Sprache };

/** Lieblingshersteller (Spec Profil 10), privat. Kein Kauf- oder Apothekenlink (HWG). */
export function Lieblingshersteller({ daten, texte, sprache }: Props) {
  if (!daten) return <p className="max-w-[68ch] text-body text-text-muted text-pretty">{texte.herstellerLeer}</p>;
  return (
    <p className="max-w-[68ch] text-body text-text text-pretty">
      {t(texte.herstellerSatz, { name: daten.name, note: formatiereZahl(daten.mittel, 1, sprache), anzahl: daten.anzahl })}
    </p>
  );
}
