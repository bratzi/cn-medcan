import type { GeschmacksKategorie } from "@/db/enums";
import { QUALITAET_MITTE } from "@/lib/bewertung-v2";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";

/**
 * Geschmäcker auf der Katalogkarte (Task 2, 2026-10-20): was das Datenblatt verspricht und ob die
 * Community es bestätigt. Skala der Community-Mediane 0 bis 5, Sweet Spot 2,5 (lib/bewertung-v2.ts).
 */

/** Ab diesem Community-Median gilt ein Datenblatt-Geschmack als bestätigt: die Hälfte des Sweet Spots. */
export const BESTAETIGT_AB = QUALITAET_MITTE / 2;
/** Ab diesem Median zählt eine Achse außerhalb des Datenblatts als von der Community gefunden. */
export const GEFUNDEN_AB = QUALITAET_MITTE;
/** Hauptgeschmäcker der Top-3-Terpene, eindeutig. */
export const HOECHSTENS_DATENBLATT = 3;
/** Zusätzlich von der Community gefundene Achsen je Karte. */
export const HOECHSTENS_GEFUNDEN = 2;

export type GeschmackStatus = "bestaetigt" | "nichtBestaetigt" | "offen" | "gefunden";
export type GeschmackEintrag = { geschmack: GeschmacksKategorie; status: GeschmackStatus };

/** Median einer Achse; Text, NaN oder Unendlich zählen wie ein fehlender Wert. */
function wert(median: Readonly<Record<string, unknown>>, achse: string): number | null {
  const roh = median[achse];
  return typeof roh === "number" && Number.isFinite(roh) ? roh : null;
}

/**
 * Datenblatt-Geschmäcker (in Rangfolge der Terpene) mit Status, danach was die Community zusätzlich
 * gefunden hat. `median` ist `kultivar_kennwerte.geschmack_median` (Schlüssel wie „suess“), `null`
 * ohne Kennwerte; `undefined`, wenn das Katalog-JSON noch aus der Zeit vor `gm` stammt.
 */
export function geschmaeckerMitStatus(
  datenblatt: readonly (GeschmacksKategorie | null | undefined)[],
  median: Readonly<Record<string, unknown>> | null | undefined,
): GeschmackEintrag[] {
  const versprochen = [...new Set(datenblatt.filter((g): g is GeschmacksKategorie => Boolean(g)))].slice(0, HOECHSTENS_DATENBLATT);
  const eintraege: GeschmackEintrag[] = versprochen.map((geschmack) => {
    const achse = GESCHMACKS_ACHSEN.find((a) => a.enumWert === geschmack);
    const m = median && achse ? wert(median, achse.key) : null;
    return { geschmack, status: m === null ? "offen" : m >= BESTAETIGT_AB ? "bestaetigt" : "nichtBestaetigt" };
  });
  if (!median) return eintraege;

  const gefunden = GESCHMACKS_ACHSEN.flatMap((achse, rang) => {
    const m = wert(median, achse.key);
    return m !== null && m >= GEFUNDEN_AB && !versprochen.includes(achse.enumWert) ? [{ geschmack: achse.enumWert, m, rang }] : [];
  })
    .sort((a, b) => b.m - a.m || a.rang - b.rang)
    .slice(0, HOECHSTENS_GEFUNDEN);
  return [...eintraege, ...gefunden.map(({ geschmack }) => ({ geschmack, status: "gefunden" as const }))];
}
