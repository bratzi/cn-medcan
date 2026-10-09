import type { Woerterbuch } from "@/lib/i18n/typen";

/*
 * Bewusst kein "use client": ProfilNetz ruft aromaNetzTexte auf dem Server auf. Aus einer
 * Client-Datei exportiert wäre die Funktion dort nur eine Referenz und der Aufruf scheitert
 * (live 2026-10-09: /profil ließ sich nicht laden).
 */
/** Nur die Texte, die das Netz im Browser braucht, nicht das ganze Profil-Wörterbuch. */
export type AromaNetzTexte = Pick<
  Woerterbuch["profil"],
  | "magIch"
  | "magIchNicht"
  | "vorher"
  | "netzSkala"
  | "netzHinweis"
  | "note"
  | "srMag"
  | "srMagNicht"
  | "srNeutral"
  | "staerker"
  | "schwaecher"
  | "aenderung"
  | "aenderungGleich"
  | "verlaufSchritt"
  | "verlaufRegler"
  | "verlaufAbspielen"
  | "verlaufAnhalten"
>;

export function aromaNetzTexte(p: Woerterbuch["profil"]): AromaNetzTexte {
  const { magIch, magIchNicht, vorher, netzSkala, netzHinweis, note, srMag, srMagNicht, srNeutral, staerker, schwaecher } = p;
  const { aenderung, aenderungGleich, verlaufSchritt, verlaufRegler, verlaufAbspielen, verlaufAnhalten } = p;
  return {
    magIch, magIchNicht, vorher, netzSkala, netzHinweis, note, srMag, srMagNicht, srNeutral, staerker, schwaecher,
    aenderung, aenderungGleich, verlaufSchritt, verlaufRegler, verlaufAbspielen, verlaufAnhalten,
  };
}

