import { t } from "@/lib/i18n/text";

/**
 * Die Zeile „<Blüte> · <Vertreiber>“ (Spec Vertreiber und Blüte). Rein, damit Startseite, Kapitel und
 * Rangliste dieselbe Vorlage nehmen. Fehlt die Blüte (ältere gemerkte Antworten), gilt der Handelsname;
 * fehlt der Vertreiber, der Satz „unbekannt“.
 */
export function bluetenZeile(
  vorlage: string,
  unbekannt: string,
  s: { handelsname: string; bluete?: string | null; vertreiber?: string | null },
): string {
  return t(vorlage, { bluete: s.bluete || s.handelsname, vertreiber: s.vertreiber || unbekannt });
}
