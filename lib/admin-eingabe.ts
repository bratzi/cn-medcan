/**
 * Pruefregeln fuer die Admin-Aktionen an einem Mitgliedssatz.
 *
 * Bewusst ohne Request, Prisma und Sitzung - wie lib/mitglied-eingabe.ts und
 * aus demselben Grund: ein Server-Action-Aufruf laesst sich von aussen
 * praktisch nicht nachbauen, diese Funktionen dagegen direkt (npx tsx).
 *
 * Die Funktionen entscheiden ueber *Gueltigkeit der Eingabe*, nicht ueber
 * Berechtigung. Dass der Aufrufer Admin ist, prueft adminErforderlich() in
 * lib/session.ts - das ist und bleibt die einzige Rechtequelle.
 */

import { istMitgliedRolle, type MitgliedRolle } from "@/db/enums";

export type FreigabeAktion = "FREIGEBEN" | "ZURUECKNEHMEN";

export type AdminPruefErgebnis<T> = { ok: true; wert: T } | { ok: false; fehler: string };

function idPruefen(roh: string): string | null {
  const id = roh.trim();
  return id.length > 0 ? id : null;
}

/**
 * Freigabe setzen oder zuruecknehmen.
 *
 * Die eigene Freigabe darf ein Admin sich nicht entziehen: er verloere damit
 * Stimmrecht und Preissicht und koennte es sich zwar zurueckgeben, aber der
 * Fall ist immer ein Versehen - abgelehnt statt stillschweigend ausgefuehrt.
 */
export function freigabeEingabePruefen(
  mitgliedIdRoh: string,
  aktionRoh: string,
  eigeneMitgliedId: string,
): AdminPruefErgebnis<{ mitgliedId: string; freigegeben: boolean }> {
  const mitgliedId = idPruefen(mitgliedIdRoh);
  if (!mitgliedId) return { ok: false, fehler: "Kein Mitglied angegeben." };

  if (aktionRoh !== "FREIGEBEN" && aktionRoh !== "ZURUECKNEHMEN") {
    return { ok: false, fehler: "Unbekannte Aktion." };
  }
  const aktion: FreigabeAktion = aktionRoh;

  if (mitgliedId === eigeneMitgliedId && aktion === "ZURUECKNEHMEN") {
    return { ok: false, fehler: "Die eigene Freigabe lässt sich nicht zurücknehmen." };
  }

  return { ok: true, wert: { mitgliedId, freigegeben: aktion === "FREIGEBEN" } };
}

/**
 * Rolle setzen.
 *
 * Die eigene Admin-Rolle darf niemand ablegen: gibt es keinen zweiten Admin,
 * ist /admin danach fuer alle zu und nur noch per `wrangler d1 execute`
 * wieder zu oeffnen. Diese Regel ersetzt keine Zaehlung der verbleibenden
 * Admins - sie deckt den Fall ab, der praktisch vorkommt.
 */
export function rolleEingabePruefen(
  mitgliedIdRoh: string,
  rolleRoh: string,
  eigeneMitgliedId: string,
): AdminPruefErgebnis<{ mitgliedId: string; rolle: MitgliedRolle }> {
  const mitgliedId = idPruefen(mitgliedIdRoh);
  if (!mitgliedId) return { ok: false, fehler: "Kein Mitglied angegeben." };

  const rolle = rolleRoh.trim();
  if (!istMitgliedRolle(rolle)) {
    return { ok: false, fehler: "Unbekannte Rolle." };
  }

  if (mitgliedId === eigeneMitgliedId && rolle !== "ADMIN") {
    return {
      ok: false,
      fehler: "Die eigene Betreiber-Rolle lässt sich nicht ablegen.",
    };
  }

  return { ok: true, wert: { mitgliedId, rolle } };
}
