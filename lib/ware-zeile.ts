import { t } from "@/lib/i18n/text";

/** Die Ware einer Bewertung: Vertreiber, ob das Produkt genau bekannt ist, und dessen Handelsname. */
export type WareDaten = { vertreiberName: string | null; wareGenau: boolean; handelsname: string };

/**
 * Die Unterzeile unter dem Sortennamen (Spec Sorte im Fokus 2): „über <Vertreiber>“, bei genau
 * bekannter Ware dahinter „ · <Handelsname>“. Ohne Vertreiber leer: dann steht nur die Sorte.
 * `texte.ueber` ist die Vorlage mit {vertreiber}.
 */
export function wareZeile(r: WareDaten, texte: { ueber: string }): string {
  if (!r.vertreiberName) return "";
  const ueber = t(texte.ueber, { vertreiber: r.vertreiberName });
  return r.wareGenau && r.handelsname ? `${ueber} · ${r.handelsname}` : ueber;
}
