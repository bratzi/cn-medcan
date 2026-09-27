/**
 * Benachrichtigungen an Mitglieder: die EINE Stelle, an der sie entstehen.
 * Heute nur als Satz in der Datenbank (Mitgliederbereich). Kommt spaeter
 * Mailversand dazu, schliesst er hier an (Spec Bluete vorschlagen 3.2).
 */
import type { BenachrichtigungArt } from "@/db/enums";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

export type Nachricht = {
  mitgliedId: string;
  art: BenachrichtigungArt;
  /** Deutscher Satz: Rueckfall fuer alte Leser und einen spaeteren Mailversand. */
  text: string;
  /** JSON (BenachrichtigungParameter); der Satz entsteht beim Anzeigen in der Sprache des Lesers. */
  parameter: string | null;
  /** Interner Pfad, vom Server gesetzt. */
  link: string | null;
};

/** So viele zeigt /mitglied; mehr darf "gelesen" nicht markieren. */
export const MAX_BENACHRICHTIGUNGEN = 20;

/**
 * Ids aus dem Browser fuer "gelesen": nur Texte, ohne Doppelte, hoechstens
 * so viele, wie die Seite zeigt. Ob sie dem Mitglied gehoeren, entscheidet
 * die Abfrage (mitgliedId aus der Sitzung).
 */
export function gelesenIdsPruefen(roh: unknown): string[] {
  if (!Array.isArray(roh)) return [];
  const ids = roh.filter((id): id is string => typeof id === "string" && id.length > 0);
  return [...new Set(ids)].slice(0, MAX_BENACHRICHTIGUNGEN);
}

export function textFreigegeben(handelsname: string): string {
  return `Deine vorgeschlagene Blüte ${handelsname} steht jetzt im Katalog.`;
}

export function textAbgelehnt(handelsname: string, begruendung: string | null): string {
  const satz = `Deine vorgeschlagene Blüte ${handelsname} nehmen wir nicht in den Katalog auf.`;
  return begruendung ? `${satz} Grund: ${begruendung}` : satz;
}

export type BenachrichtigungParameter = { handelsname: string; begruendung?: string | null };

export function vorlageFreigegeben(handelsname: string): Omit<Nachricht, "mitgliedId" | "link"> {
  return {
    art: "VORSCHLAG_FREIGEGEBEN",
    text: textFreigegeben(handelsname),
    parameter: JSON.stringify({ handelsname } satisfies BenachrichtigungParameter),
  };
}

export function vorlageAbgelehnt(handelsname: string, begruendung: string | null): Omit<Nachricht, "mitgliedId" | "link"> {
  return {
    art: "VORSCHLAG_ABGELEHNT",
    text: textAbgelehnt(handelsname, begruendung),
    parameter: JSON.stringify({ handelsname, begruendung } satisfies BenachrichtigungParameter),
  };
}

function parameterLesen(roh: string | null): BenachrichtigungParameter | null {
  if (!roh) return null;
  try {
    const wert: unknown = JSON.parse(roh);
    if (wert && typeof wert === "object" && typeof (wert as { handelsname?: unknown }).handelsname === "string") {
      return wert as BenachrichtigungParameter;
    }
  } catch {
    // Kaputtes JSON: Rueckfall auf den gespeicherten Satz.
  }
  return null;
}

/** Satz in der Sprache des Lesers; alte oder unlesbare Zeilen zeigen ihren gespeicherten Text (Spec Englisch 5.4). */
export function benachrichtigungSatz(
  w: Woerterbuch["benachrichtigung"],
  zeile: { art: string; text: string; parameter: string | null },
): string {
  const p = parameterLesen(zeile.parameter);
  if (!p) return zeile.text;
  if (zeile.art === "VORSCHLAG_FREIGEGEBEN") return t(w.freigegeben, { handelsname: p.handelsname });
  if (zeile.art === "VORSCHLAG_ABGELEHNT") {
    const satz = t(w.abgelehnt, { handelsname: p.handelsname });
    return p.begruendung ? t(w.abgelehntMitGrund, { satz, begruendung: p.begruendung }) : satz;
  }
  return zeile.text;
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
