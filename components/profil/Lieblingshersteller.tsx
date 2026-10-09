import Link from "next/link";

import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { namenLinkKlassen } from "@/components/ui";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { HerstellerRang } from "@/lib/profil-typen";

/** `undefined`: die Abfrage ist gescheitert; leer: noch keine Bewertung mit bekanntem Hersteller. */
type Props = { daten: readonly HerstellerRang[] | undefined; texte: Woerterbuch["profil"]; sprache: Sprache };

/**
 * Deine Hersteller (Spec 2026-10-09 C): bis zu fünf, bestes Mittel zuerst, je mit Blättern und der Zahl
 * deiner Bewertungen in Handschrift. Der Name führt in den Katalog, gefiltert nach diesem Hersteller.
 * Privat, kein Kauf- oder Apothekenlink, kein Logo (HWG).
 */
export function Lieblingshersteller({ daten, texte, sprache }: Props) {
  if (daten === undefined) return <p className="max-w-[68ch] text-body text-text text-pretty">{texte.herstellerFehler}</p>;
  if (daten.length === 0) return <p className="max-w-[68ch] text-body text-text-muted text-pretty">{texte.herstellerLeer}</p>;
  return (
    <ol className="flex flex-col gap-4">
      {daten.map((h) => (
        <li key={h.id} className="flex min-w-0 flex-col gap-1">
          <Link prefetch={false} href={`/blueten?hersteller=${h.id}`} className={`${namenLinkKlassen()} wrap-break-word`}>
            {h.name}
          </Link>
          <span className="flex items-center gap-3">
            <BlattAnzeige
              note={h.mittel}
              text={t(texte.herstellerZeile, { name: h.name, note: formatiereZahl(h.mittel, 1, sprache), anzahl: h.anzahl })}
            />
            <span aria-hidden="true" className="font-hand text-notiz text-logo numeric">
              {h.anzahl}×
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
