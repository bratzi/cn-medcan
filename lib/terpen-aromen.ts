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
 * Kein Terpen zahlt deshalb auf Diesel ein. Ebenso tragen Ester (etwa
 * Hexylacetat, Ethylester) viel vom Fruchtigen bei. Beide stehen als
 * Begleitstoffe (BEGLEITSTOFFE) mit eigenem Knoten in der Karte.
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

/** Aromastoffe, die keine Terpene sind, aber Noten der Karte prägen (Nutzer 2026-09-26). */
export type Begleitstoff = { name: string; hinweis: string; noten: readonly AromaAnteil[] };

export const BEGLEITSTOFFE: readonly Begleitstoff[] = [
  {
    name: "Ester",
    hinweis: "fruchtig, kein Terpen",
    noten: [
      { geschmack: "FRUCHTIG", anteil: 0.8 },
      { geschmack: "SUESS", anteil: 0.2 },
    ],
  },
  { name: "Thiole", hinweis: "Schwefel, kein Terpen", noten: [{ geschmack: "DIESEL", anteil: 1 }] },
];

/**
 * Anteile je Geschmacksachse für ein Terpen: aus der Tabelle, sonst die
 * Hauptnote aus der Datenbank allein (Anteil 1). Der Name wird ohne Groß-
 * und Kleinschreibung verglichen.
 */
export function aromaAnteile(terpen: { name: string; geschmack: GeschmacksKategorie }): readonly AromaAnteil[] {
  return TABELLE[terpen.name.trim().toLowerCase()] ?? [{ geschmack: terpen.geschmack, anteil: 1 }];
}

/**
 * Ein Satz je Terpen und Begleitstoff für den Infotext der Aroma-Karte (Nutzer
 * 2026-09-27). Nur Duft, Geschmack und Vorkommen, keine Wirkung (HWG).
 */
const SATZ: Record<string, string> = {
  myrcen: "Das häufigste Terpen in Cannabis, erdig und moschusartig mit einem Hauch reifer Mango.",
  limonen: "Steckt auch in Zitronen- und Orangenschalen und bringt die frische, spritzige Zitrusnote.",
  "beta-caryophyllen": "Kennt man aus schwarzem Pfeffer und Nelken: pfeffrig-würzig mit holzigem Unterton.",
  linalool: "Der Duft von Lavendel, blumig, weich und leicht süß.",
  "alpha-pinen": "Riecht nach Kiefernwald und Harz, frisch und ein wenig kühl.",
  terpinolen: "Vielschichtig und frisch: Kräuter, Blüten, ein Spritzer Zitrus und etwas Kiefer.",
  humulen: "Das Terpen des Hopfens, trocken, erdig und holzig.",
  ocimen: "Süß und krautig mit tropischem Einschlag, auch in Basilikum und Mango zu finden.",
  farnesen: "Erinnert an die Schale grüner Äpfel, fruchtig mit einer grünen Note.",
  nerolidol: "Holzig wie Rinde mit blumigem Einschlag, kommt auch in Neroliöl, Jasmin und Ingwer vor.",
  ester: "Kein Terpen, sondern die Stoffe hinter vielen Fruchtaromen, etwa Birne oder Banane.",
  thiole: "Kein Terpen, sondern Schwefelverbindungen, die schon in winzigen Mengen nach Gas und Diesel riechen.",
};

/** Der beschreibende Satz zu einem Terpen oder Begleitstoff, sonst null. */
export function aromaSatz(name: string): string | null {
  return SATZ[name.trim().toLowerCase()] ?? null;
}
