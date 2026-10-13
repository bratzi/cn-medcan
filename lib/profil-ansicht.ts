import type { GeschmacksKategorie } from "@/db/enums";
import type { Geschmack } from "@/lib/profil-typen";

export const PROFIL_ANSICHTEN = ["uebersicht", "aromen", "bewertungen", "vertreiber"] as const;
export type ProfilAnsicht = (typeof PROFIL_ANSICHTEN)[number];

/** Reiter aus `?ansicht=`; Unbekanntes oder Fehlendes zeigt die Übersicht, Mehrfachwerte den ersten. */
export function ansichtAus(roh: string | string[] | undefined): ProfilAnsicht {
  const wert = Array.isArray(roh) ? roh[0] : roh;
  return (PROFIL_ANSICHTEN as readonly string[]).includes(wert ?? "") ? (wert as ProfilAnsicht) : "uebersicht";
}

/** Die stärksten positiven Geschmacksachsen für die Chips der Seitenleiste. */
export function liebsteAromen(geschmack: Geschmack, n = 2): GeschmacksKategorie[] {
  return (Object.entries(geschmack) as [GeschmacksKategorie, number][])
    .filter(([, wert]) => wert > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([achse]) => achse);
}
