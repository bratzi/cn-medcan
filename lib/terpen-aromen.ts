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
 * tropisch; Farnesen grüner Apfel; Nerolidol Holz, Rinde, blumig; Bisabolol
 * Kamille; beta-Pinen grün-harzig; Terpineol Flieder; Eukalyptol, Borneol und
 * Fenchol kampferartig-kühl, tragen Minzig; Guajol Guajakholz, Rose).
 * Feinabstimmung nach Terpen-Audit 2026-10-20 (docs/terpene-audit-2026-10-20.md).
 *
 * Diesel und Gas stammen nicht aus Terpenen, sondern aus Schwefelverbindungen
 * (Thiole, v. a. 3-Methyl-2-buten-1-thiol; Oswald u. a., ACS Omega 2021).
 * Kein Terpen zahlt deshalb auf Diesel ein. Ebenso tragen Ester (etwa
 * Hexylacetat, Ethylester) viel vom Fruchtigen bei. Beide stehen als
 * Begleitstoffe (BEGLEITSTOFFE) mit eigenem Knoten in der Karte.
 */
/**
 * Ab diesem Anteil gilt eine Achse als Kandidat eines Terpens. Der Vergleich
 * trägt eine kleine Toleranz, damit ein Anteil von genau 0,2 nicht an der
 * Gleitkommarundung kippt (0,1 + 0,1 + ... oder 1 - 0,8).
 */
export const KANDIDATEN_SCHWELLE = 0.2;
export const istKandidatAnteil = (anteil: number): boolean => anteil >= KANDIDATEN_SCHWELLE - 1e-9;

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
    { geschmack: "BLUMIG", anteil: 0.6 },
    { geschmack: "ZITRUS", anteil: 0.15 },
    { geschmack: "SUESS", anteil: 0.15 },
    { geschmack: "KRAEUTRIG", anteil: 0.1 },
  ],
  "alpha-pinen": [
    { geschmack: "HOLZIG", anteil: 0.55 },
    { geschmack: "KRAEUTRIG", anteil: 0.25 },
    { geschmack: "MINZIG", anteil: 0.2 },
  ],
  terpinolen: [
    { geschmack: "KRAEUTRIG", anteil: 0.3 },
    { geschmack: "HOLZIG", anteil: 0.25 },
    { geschmack: "ZITRUS", anteil: 0.25 },
    { geschmack: "SUESS", anteil: 0.2 },
  ],
  humulen: [
    { geschmack: "HOLZIG", anteil: 0.45 },
    { geschmack: "ERDIG", anteil: 0.3 },
    { geschmack: "WUERZIG", anteil: 0.25 },
  ],
  ocimen: [
    { geschmack: "SUESS", anteil: 0.3 },
    { geschmack: "KRAEUTRIG", anteil: 0.3 },
    { geschmack: "BLUMIG", anteil: 0.2 },
    { geschmack: "FRUCHTIG", anteil: 0.2 },
  ],
  farnesen: [
    { geschmack: "FRUCHTIG", anteil: 0.45 },
    { geschmack: "KRAEUTRIG", anteil: 0.25 },
    { geschmack: "HOLZIG", anteil: 0.15 },
    { geschmack: "SUESS", anteil: 0.15 },
  ],
  valencen: [
    { geschmack: "ZITRUS", anteil: 0.55 },
    { geschmack: "FRUCHTIG", anteil: 0.3 },
    { geschmack: "HOLZIG", anteil: 0.15 },
  ],
  geraniol: [
    { geschmack: "BLUMIG", anteil: 0.6 },
    { geschmack: "ZITRUS", anteil: 0.2 },
    { geschmack: "FRUCHTIG", anteil: 0.2 },
  ],
  caryophyllenoxid: [
    { geschmack: "HOLZIG", anteil: 0.45 },
    { geschmack: "WUERZIG", anteil: 0.35 },
    { geschmack: "ERDIG", anteil: 0.2 },
  ],
  camphen: [
    { geschmack: "HOLZIG", anteil: 0.4 },
    { geschmack: "MINZIG", anteil: 0.35 },
    { geschmack: "KRAEUTRIG", anteil: 0.25 },
  ],
  "delta-3-caren": [
    { geschmack: "HOLZIG", anteil: 0.5 },
    { geschmack: "WUERZIG", anteil: 0.25 },
    { geschmack: "ZITRUS", anteil: 0.25 },
  ],
  phellandren: [
    { geschmack: "KRAEUTRIG", anteil: 0.4 },
    { geschmack: "WUERZIG", anteil: 0.3 },
    { geschmack: "MINZIG", anteil: 0.3 },
  ],
  selinen: [
    { geschmack: "KRAEUTRIG", anteil: 0.5 },
    { geschmack: "HOLZIG", anteil: 0.3 },
    { geschmack: "ERDIG", anteil: 0.2 },
  ],
  nerolidol: [
    { geschmack: "HOLZIG", anteil: 0.45 },
    { geschmack: "BLUMIG", anteil: 0.35 },
    { geschmack: "FRUCHTIG", anteil: 0.2 },
  ],
  bisabolol: [
    { geschmack: "BLUMIG", anteil: 0.55 },
    { geschmack: "SUESS", anteil: 0.3 },
    { geschmack: "KRAEUTRIG", anteil: 0.15 },
  ],
  "beta-pinen": [
    { geschmack: "HOLZIG", anteil: 0.45 },
    { geschmack: "KRAEUTRIG", anteil: 0.35 },
    { geschmack: "WUERZIG", anteil: 0.2 },
  ],
  terpineol: [
    { geschmack: "BLUMIG", anteil: 0.5 },
    { geschmack: "HOLZIG", anteil: 0.25 },
    { geschmack: "ZITRUS", anteil: 0.25 },
  ],
  eukalyptol: [
    { geschmack: "MINZIG", anteil: 0.7 },
    { geschmack: "KRAEUTRIG", anteil: 0.2 },
    { geschmack: "WUERZIG", anteil: 0.1 },
  ],
  borneol: [
    { geschmack: "MINZIG", anteil: 0.45 },
    { geschmack: "HOLZIG", anteil: 0.35 },
    { geschmack: "ERDIG", anteil: 0.2 },
  ],
  fenchol: [
    { geschmack: "MINZIG", anteil: 0.4 },
    { geschmack: "KRAEUTRIG", anteil: 0.3 },
    { geschmack: "HOLZIG", anteil: 0.3 },
  ],
  guajol: [
    { geschmack: "HOLZIG", anteil: 0.6 },
    { geschmack: "BLUMIG", anteil: 0.25 },
    { geschmack: "SUESS", anteil: 0.15 },
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
  bisabolol: "Der Duft von Kamille, mild, blumig und leicht süß.",
  nerolidol: "Holzig wie Rinde mit blumigem Einschlag, kommt auch in Neroliöl, Jasmin und Ingwer vor.",
  "beta-pinen": "Grün und harzig wie Tannennadeln, etwas würziger als alpha-Pinen.",
  terpineol: "Erinnert an Flieder, mit einem Hauch Kiefer und Zitrus.",
  eukalyptol: "Der Duft von Eukalyptus, kühl und kampferartig.",
  borneol: "Kampferartig und holzig, mit einer erdigen Seite.",
  fenchol: "Kampferartig mit Kiefer und krautiger Frische.",
  guajol: "Holzig wie Guajakholz, mit einem Hauch Rose und Tee.",
  valencen: "Kennt man aus Valencia-Orangen: süße Orange mit holzigem Unterton.",
  geraniol: "Duftet nach Rose und Geranie, mit leichter Zitrusfrucht.",
  caryophyllenoxid: "Entsteht aus beta-Caryophyllen an der Luft, trocken holzig und würzig.",
  camphen: "Kampferartig wie Tannennadeln, holzig und kühl.",
  "delta-3-caren": "Süß-harzig wie Kiefer, mit einem Hauch Zitrus.",
  phellandren: "Pfeffrig und minzig, erinnert an Dill.",
  selinen: "Krautig wie Sellerie, kommt auch im Hopfen vor.",
  ester: "Kein Terpen, sondern die Stoffe hinter vielen Fruchtaromen, etwa Birne oder Banane.",
  thiole: "Kein Terpen, sondern Schwefelverbindungen, die schon in winzigen Mengen nach Gas und Diesel riechen.",
};

/** Der beschreibende Satz zu einem Terpen oder Begleitstoff, sonst null. */
export function aromaSatz(name: string): string | null {
  return SATZ[name.trim().toLowerCase()] ?? null;
}
