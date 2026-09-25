/**
 * Benachrichtigungen an Mitglieder: die EINE Stelle, an der sie entstehen.
 * Heute nur als Satz in der Datenbank (Mitgliederbereich). Kommt spaeter
 * Mailversand dazu, schliesst er hier an (Spec Bluete vorschlagen 3.2).
 */
import type { BenachrichtigungArt } from "@/db/enums";

export type Nachricht = {
  mitgliedId: string;
  art: BenachrichtigungArt;
  text: string;
  /** Interner Pfad, vom Server gesetzt. */
  link: string | null;
};

export function textFreigegeben(handelsname: string): string {
  return `Deine vorgeschlagene Blüte ${handelsname} steht jetzt im Katalog.`;
}

export function textAbgelehnt(handelsname: string, begruendung: string | null): string {
  const satz = `Deine vorgeschlagene Blüte ${handelsname} nehmen wir nicht in den Katalog auf.`;
  return begruendung ? `${satz} Grund: ${begruendung}` : satz;
}

export function nachrichtenFuer(
  mitgliedIds: readonly string[],
  vorlage: Omit<Nachricht, "mitgliedId">,
): Nachricht[] {
  return [...new Set(mitgliedIds)].map((mitgliedId) => ({ mitgliedId, ...vorlage }));
}

/**
 * Schreibt die Nachrichten. getPrisma wird erst hier geladen, damit die
 * reinen Funktionen oben ohne Cloudflare-Kontext testbar bleiben.
 */
export async function benachrichtigen(nachrichten: readonly Nachricht[]): Promise<void> {
  if (nachrichten.length === 0) return;
  const { getPrisma } = await import("@/lib/prisma");
  const prisma = await getPrisma();
  await prisma.benachrichtigung.createMany({ data: [...nachrichten] });
}
