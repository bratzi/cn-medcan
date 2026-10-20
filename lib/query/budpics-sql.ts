import { BUDPIC_MAX_ANZEIGE } from "@/lib/budpics";

/** Obergrenze der Abfrage: jede Liste hat ein Limit (siehe edge-stack-master). */
const MAX_ZEILEN = 400;

/**
 * SQL für ladeFreieBudpicsJeKultivar: eine Abfrage mit Join statt Prismas Relations-Folgeabfragen
 * (Budpic, Strain, Mitglied je eine) und je Blüte höchstens BUDPIC_MAX_ANZEIGE Zeilen schon in D1.
 */
export function BUDPICS_JE_KULTIVAR_SQL(anzahlIds: number): string {
  const platzhalter = Array.from({ length: anzahlIds }, () => "?").join(", ");
  return `SELECT id, kultivar_id AS k, erstellt_am AS e, breite AS b, hoehe AS h, anzeigename AS n FROM (
    SELECT bp.id, s.kultivar_id, bp.erstellt_am, bp.breite, bp.hoehe, m.anzeigename,
      ROW_NUMBER() OVER (PARTITION BY s.kultivar_id ORDER BY bp.erstellt_am DESC) AS rn
    FROM budpics bp JOIN strains s ON s.id = bp.strain_id JOIN mitglied m ON m.id = bp.mitglied_id
    WHERE bp.status = 'FREIGEGEBEN' AND s.kultivar_id IN (${platzhalter})
  ) WHERE rn <= ${BUDPIC_MAX_ANZEIGE} ORDER BY e DESC LIMIT ${MAX_ZEILEN}`;
}

