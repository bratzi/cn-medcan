import type { GeschmacksKategorie } from "@/db/enums";

/**
 * Wie sich ein Terpen auf die Geschmacksachsen verteilt (Nutzer 2026-09-26:
 * Verbindungen korrekter, ein Terpen trägt oft mehrere Noten). Anteile je
 * Terpen summieren sich zu 1; der erste Eintrag ist die Hauptnote und deckt
 * sich mit `terpene.geschmack` in der Datenbank.
 *
 * Quellen der Zuordnung: gängige Aromabeschreibungen der Hauptterpene
 * (Myrcen erdig-moschusartig mit reifer Frucht; Limonen Zitrusschale;
 * beta-Caryophyllen Pfeffer, Nelke, holzig; Linalool Lavendel; alpha-Pinen
 * Kiefer und Harz, frisch-kampferartig; Terpinolen frisch-kräutrig, blumig,
 * zitrisch, Kiefer; Humulen Hopfen, erdig-holzig; Ocimen süß-krautig,
 * tropisch; Farnesen grüner Apfel; Nerolidol Holz, Rinde, blumig).
 *
 * Diesel und Gas stammen nicht aus Terpenen, sondern aus Schwefelverbindungen
 * (Thiole, v. a. 3-Methyl-2-buten-1-thiol; Oswald u. a., ACS Omega 2021).
 * Kein Terpen zahlt deshalb auf Diesel ein; die Karte verbindet die Achse mit
 * einem eigenen Knoten (THIOLE).
 */
export type AromaAnteil = { geschmack: GeschmacksKategorie; anteil: number };

const TABELLE: Record<string, readonly AromaAnteil[]> = {
  myrcen: [
    { geschmack: "ERDIG", anteil: 0.5 },
    { geschmack: "FRUCHTIG", anteil: 0.3 },
    { geschmack: "KRAEUTRIG", anteil: 0.2 },
  ],
  limonen: [
    { geschmack: "ZITRUS", anteil: 0.75 },
    { geschmack: "FRUCHTIG", anteil: 0.15 },
    { geschmack: "SUESS", anteil: 0.1 },
  ],
  "beta-caryophyllen": [
    { geschmack: "WUERZIG", anteil: 0.6 },
    { geschmack: "HOLZIG", anteil: 0.25 },
    { geschmack: "ERDIG", anteil: 0.15 },
  ],
  linalool: [
    { geschmack: "BLUMIG", anteil: 0.65 },
    { geschmack: "SUESS", anteil: 0.2 },
    { geschmack: "KRAEUTRIG", anteil: 0.15 },
  ],
  "alpha-pinen": [
    { geschmack: "HOLZIG", anteil: 0.6 },
    { geschmack: "KRAEUTRIG", anteil: 0.25 },
    { geschmack: "MINZIG", anteil: 0.15 },
  ],
  terpinolen: [
    { geschmack: "KRAEUTRIG", anteil: 0.35 },
    { geschmack: "BLUMIG", anteil: 0.25 },
    { geschmack: "ZITRUS", anteil: 0.2 },
    { geschmack: "HOLZIG", anteil: 0.2 },
  ],
  humulen: [
    { geschmack: "HOLZIG", anteil: 0.4 },
    { geschmack: "ERDIG", anteil: 0.4 },
    { geschmack: "WUERZIG", anteil: 0.2 },
  ],
  ocimen: [
    { geschmack: "SUESS", anteil: 0.35 },
    { geschmack: "KRAEUTRIG", anteil: 0.3 },
    { geschmack: "FRUCHTIG", anteil: 0.2 },
    { geschmack: "HOLZIG", anteil: 0.15 },
  ],
  farnesen: [
    { geschmack: "FRUCHTIG", anteil: 0.5 },
    { geschmack: "SUESS", anteil: 0.2 },
    { geschmack: "HOLZIG", anteil: 0.15 },
    { geschmack: "KRAEUTRIG", anteil: 0.15 },
  ],
  nerolidol: [
    { geschmack: "HOLZIG", anteil: 0.45 },
    { geschmack: "BLUMIG", anteil: 0.35 },
    { geschmack: "ZITRUS", anteil: 0.2 },
  ],
};

/** Knoten für Diesel/Gas: Schwefelverbindungen, kein Terpen. */
export const THIOLE = "Thiole";

/**
 * Anteile je Geschmacksachse für ein Terpen: aus der Tabelle, sonst die
 * Hauptnote aus der Datenbank allein (Anteil 1). Der Name wird ohne Groß-
 * und Kleinschreibung verglichen.
 */
export function aromaAnteile(terpen: { name: string; geschmack: GeschmacksKategorie }): readonly AromaAnteil[] {
  return TABELLE[terpen.name.trim().toLowerCase()] ?? [{ geschmack: terpen.geschmack, anteil: 1 }];
}
