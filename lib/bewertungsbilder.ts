/**
 * Bilder zur Bewertung (Spec 2026-10-06): reine Regeln ohne Datenbank und
 * Sitzung, damit Server Action, Formular und Tests dieselben nutzen.
 */
import { BEWERTUNGSBILD_MAX, musterBildId } from "@/lib/budpics";
import { blueteBild } from "@/lib/medien";

/** Der Betreiber zeigt sofort, alle anderen warten auf die Freigabe in /admin. */
export function bildStatusFuer(rolle: string): "FREIGEGEBEN" | "OFFEN" {
  return rolle === "ADMIN" ? "FREIGEGEBEN" : "OFFEN";
}

/** Freie Plaetze einer Bewertung: offene und freigegebene belegen, abgelehnte (BLOB geleert) nicht. */
export function bilderFrei(status: readonly string[]): number {
  const belegt = status.filter((s) => s === "OFFEN" || s === "FREIGEGEBEN").length;
  return Math.max(0, BEWERTUNGSBILD_MAX - belegt);
}

/** Wie viele der gewaehlten Dateien der Browser annimmt. */
export function annehmbareDateien(gewaehlt: number, frei: number): number {
  return Math.max(0, Math.min(gewaehlt, frei));
}

/** Ersatzbild ohne eigenes Bild, wie in der Produktkarte: Herstellerbild, sonst Musterbild. */
export function ersatzBildId(bildPfad: string | null | undefined, slug: string): string {
  return blueteBild(bildPfad) ?? musterBildId(slug);
}
