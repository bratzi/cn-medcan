import "server-only";

import { getPrisma } from "@/lib/prisma";
import { zuAuftaktZahlen, type AuftaktZahlen } from "@/lib/query/auftakt-zahlen";

/**
 * Drei Zähler für die Leiste im Auftakt (Spec 2026-10-08 Auftakt, 4).
 *
 * Eine Abfrage mit drei Unterabfragen statt drei `count()`: jede Query ist
 * ein Sub-Request, und eine Transaktion gibt es auf D1 nicht. Tabellennamen
 * wie in den @@map-Angaben des Schemas. Die Stimmen zählen dasselbe wie
 * `communityZahlen` in der Randspalte. Bewertungen zählen nur bei aktiven
 * Sorten: das Buch zeigt die anderen nicht.
 */
export async function auftaktZahlen(): Promise<AuftaktZahlen> {
  const prisma = await getPrisma();
  const zeilen = await prisma.$queryRaw<{ sorten: unknown; bewertungen: unknown; stimmen: unknown }[]>`
    SELECT
      (SELECT COUNT(*) FROM strains WHERE aktiv = 1) AS sorten,
      (SELECT COUNT(*) FROM reviews r JOIN strains s ON s.id = r.strain_id WHERE r.freigegeben = 1 AND s.aktiv = 1) AS bewertungen,
      (SELECT COUNT(*) FROM stimmen) AS stimmen
  `;
  return zuAuftaktZahlen(zeilen);
}
