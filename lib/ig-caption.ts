import type { GeschmacksKategorie } from "@/db/enums";
import type { IgReview } from "@/lib/ig-feed";
import { kartenZitat } from "@/lib/ig-karte";
import { de } from "@/lib/i18n/de";

/**
 * Instagram-Caption aus fester Vorlage (Weg 2 ohne Cowork, Nutzer 2026-10-14). Nur Aroma, Aussehen,
 * Charge und Note (HWG); das Zitat läuft durch denselben Filter wie die Karte.
 */
const GRUND_TAGS = ["#bookofterpz", "#medizinalcannabis", "#terpene", "#sortenbewertung", "#cannabisaroma"];

const note = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function igCaption(r: IgReview): string {
  const namen = r.aromen.map((a) => de.label.geschmack[a as GeschmacksKategorie] ?? a);
  const zitat = kartenZitat(r.notiz);
  const fakten = [
    r.gesamtnote !== null ? `${note(r.gesamtnote)} von 5 Blättern.` : "",
    namen.length ? `Im Vordergrund: ${namen.join(", ")}.` : "",
    r.charge ? `Charge ${r.charge}.` : "",
  ].filter(Boolean);
  const tags = [...GRUND_TAGS, ...r.aromen.map((a) => `#${a.toLowerCase()}`)];
  const titel = r.vertreiber ? `${r.bluete} von ${r.vertreiber}` : r.bluete;
  const absaetze = [fakten.join(" "), zitat ? `„${zitat}“` : "", "Ganze Bewertung: Link in Bio", tags.join(" ")];
  return `${titel}\n${absaetze.filter(Boolean).join("\n\n")}`;
}
