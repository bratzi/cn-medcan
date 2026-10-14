import type { GeschmacksKategorie } from "@/db/enums";
import type { Geschmack } from "@/lib/profil-typen";

/** Die stärksten positiven Geschmacksachsen für die Chips im Profilkopf. */
export function liebsteAromen(geschmack: Geschmack, n = 2): GeschmacksKategorie[] {
  return (Object.entries(geschmack) as [GeschmacksKategorie, number][])
    .filter(([, wert]) => wert > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([achse]) => achse);
}
