import type { Randnotiz } from "@/components/kapitel/Randnotizen";
import type { UmfragePhase } from "@/db/enums";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

export type Ausgang = "laeuft" | "gewonnen" | "nichtGewonnen";

/** Was aus einer Stimme wurde (Spec 7): Gewinner stehen erst mit BEENDET fest. */
export function stimmAusgang(phase: UmfragePhase, istGewinner: boolean): Ausgang {
  if (phase !== "BEENDET") return "laeuft";
  return istGewinner ? "gewonnen" : "nichtGewonnen";
}

export type StimmZeile = {
  umfrageId: string;
  rundentitel: string;
  phase: UmfragePhase;
  abgegebenAm: Date;
  slug: string;
  handelsname: string;
  bildPfad: string | null;
  istGewinner: boolean;
  ergebnisReviewId: string | null;
};

/** Die Randnotizen des Kontos (Spec 5), immer fünf, auch mit Nullen. */
export function kontoNotizen(
  e: { dabeiSeit: Date; stimmen: number; gewonnen: number; vorgeschlagen: number; ungelesen: number },
  texte: Woerterbuch["mitglied"]["kapitel"],
): Randnotiz[] {
  const jahr = String(e.dabeiSeit.getUTCFullYear());
  return [
    { zahl: jahr, wort: texte.dabei, satz: t(texte.srDabei, { zahl: jahr }) },
    { zahl: String(e.stimmen), wort: texte.gestimmt, satz: t(texte.srGestimmt, { zahl: e.stimmen }) },
    { zahl: String(e.gewonnen), wort: texte.getroffen, satz: t(texte.srGetroffen, { zahl: e.gewonnen }) },
    { zahl: String(e.vorgeschlagen), wort: texte.vorgeschlagen, satz: t(texte.srVorgeschlagen, { zahl: e.vorgeschlagen }) },
    { zahl: String(e.ungelesen), wort: texte.neu, satz: t(texte.srNeu, { zahl: e.ungelesen }) },
  ];
}
