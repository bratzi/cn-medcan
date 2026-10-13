import type { Randnotiz } from "@/components/kapitel/Randnotizen";

/** Sprungziele der Profilzahlen in der Reihenfolge von profilNotizen (ohne Community). */
const PROFIL_ZIELE = ["#bewertungen-titel", "#topflop-titel", "#vertreiber-titel", "#bewertungen-titel"] as const;

/** Sprungziele der Kontozahlen in der Reihenfolge von kontoNotizen ohne „dabei seit“. */
const KONTO_ZIELE = ["#stimmen-titel", "#stimmen-titel", "#meine-vorschlaege-titel", "#nachrichten-titel"] as const;

/**
 * Die Zahlen im Profilkopf (Spec Profil und Konto vereint 3.1): erst das Profil, dann das Konto, jede
 * ein Sprunglink zu ihrer Box. „dabei seit“ steht schon unter dem Namen und entfällt. Ohne Bewertung
 * gibt es nur „0 bewertet“; Register, Top/Flop und Vertreiber werden dann nicht gerendert, darum
 * springt die Zahl zum Netz, das zur ersten Bewertung einlädt.
 */
export function kopfNotizen(profil: readonly Randnotiz[], konto: readonly Randnotiz[]): Randnotiz[] {
  const ohneBewertung = profil.length === 1;
  return [
    ...profil.slice(0, PROFIL_ZIELE.length).map((n, i) => ({ ...n, href: ohneBewertung ? "#netz-titel" : PROFIL_ZIELE[i] })),
    ...konto.slice(1, 1 + KONTO_ZIELE.length).map((n, i) => ({ ...n, href: KONTO_ZIELE[i] })),
  ];
}
