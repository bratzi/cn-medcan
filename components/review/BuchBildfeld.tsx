import { Bild, BudpicBild } from "@/components/medien/Bild";
import { BudpicDiashow } from "@/components/produkt/BudpicDiashow";
import type { EintragDaten } from "@/components/review/eintrag";
import { NurAufgeschlagen } from "@/components/review/NurAufgeschlagen";
import { alsBuchBilder } from "@/lib/budpic-anzeige";
import { ersatzBildId } from "@/lib/bewertungsbilder";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

/** Rahmen des Bildes: unter lg 4:3 und nie höher als 60 % des Fensters, ab lg der Rest der Fläche. */
const RAHMEN = "relative aspect-[4/3] max-h-[60svh] w-full border border-border lg:aspect-auto lg:max-h-none lg:min-h-0 lg:flex-1";
const FIGUR = "flex flex-col gap-2 lg:h-full";
const UNTERSCHRIFT = "text-caption text-text-muted";

/**
 * Das Bildfeld links im Buch (Spec 2026-10-06): freigegebene Bilder der
 * Bewertung, eines statisch, mehrere als Diashow (nur auf nahen Seiten,
 * CPU-Limit; ferne Seiten zeigen das erste Bild). Ohne Bild ab lg das
 * Ersatzbild wie in der Produktkarte, Herstellerbild vor Musterbild, beide als
 * Symbolbild gekennzeichnet; unter lg dann nichts.
 */
export function BuchBildfeld({ eintrag, name, w, sprache }: { eintrag: EintragDaten; name: string; w: Woerterbuch; sprache: Sprache }) {
  const bilder = alsBuchBilder(eintrag.bilder ?? [], sprache);
  const alt = t(w.budpic.alt, { name: eintrag.handelsname });

  const erstes = bilder[0];
  if (!erstes) {
    return (
      <figure data-bildfeld="ersatz" title={w.budpic.muster} className={`${FIGUR} max-lg:hidden`}>
        <div className="relative min-h-0 flex-1 bg-surface-sunken">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Bild id={ersatzBildId(eintrag.bildPfad, eintrag.slug)} dekorativ sizes="(min-width: 1024px) 40vw, 1px" className="h-full! min-h-0 w-full object-contain" />
          </div>
        </div>
        <figcaption className={UNTERSCHRIFT}>{w.katalog.karte.symbolbild}</figcaption>
      </figure>
    );
  }

  const statisch = (
    <figure data-bildfeld="bild" className={FIGUR}>
      <div className={`${RAHMEN} overflow-hidden bg-surface-sunken`}>
        <BudpicBild id={erstes.id} breite={erstes.breite} hoehe={erstes.hoehe} alt={alt} className="absolute inset-0 size-full object-cover" />
      </div>
      <figcaption className={UNTERSCHRIFT}>{erstes.beschriftung}</figcaption>
    </figure>
  );
  if (bilder.length === 1) return statisch;

  return (
    <NurAufgeschlagen ersatz={statisch}>
      <div data-bildfeld="diashow" className="lg:h-full">
        <BudpicDiashow
          bilder={bilder}
          name={name}
          texte={{ ...w.budpic, diashow: w.buch.bilderDiashow }}
          className={FIGUR}
          rahmen={RAHMEN}
        />
      </div>
    </NurAufgeschlagen>
  );
}
