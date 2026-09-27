/**
 * D1 nimmt je Abfrage nur rund 100 Bind-Werte (der Prisma-Adapter rechnet mit
 * 98). Eine Liste von Ids in `where: { id: { in } }` teilt Prisma bei
 * `updateMany` nicht selbst auf; lange Listen deshalb hier in Haeppchen,
 * mit Luft fuer die uebrigen Werte derselben Abfrage.
 */
export const D1_HAEPPCHEN = 90;

export function inHaeppchen<T>(liste: readonly T[], groesse: number = D1_HAEPPCHEN): T[][] {
  const teile: T[][] = [];
  for (let i = 0; i < liste.length; i += groesse) teile.push(liste.slice(i, i + groesse));
  return teile;
}
