import type { StimmZustand } from "@/components/umfrage/UmfrageKarte";

/**
 * Der Stimmzustand des Betrachters aus bereits geladenen Daten - dieselbe
 * Entscheidung wie bisher in app/page.tsx, nur testbar. Die eigene Stimme
 * wird nur fuer freigegebene Mitglieder gelesen und ist deshalb optional.
 * Ueber das Schreiben entscheidet weiterhin allein die Server Action.
 */
export function stimmZustand(
  mitglied: { freigegeben: boolean } | null,
  eigeneOptionId: string | null,
): StimmZustand {
  if (!mitglied) return { art: "ANONYM" };
  if (!mitglied.freigegeben) return { art: "FREIGABE_OFFEN" };
  return eigeneOptionId ? { art: "ABGESTIMMT", optionId: eigeneOptionId } : { art: "STIMMBERECHTIGT" };
}
