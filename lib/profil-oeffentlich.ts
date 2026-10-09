import type { Woerterbuch } from "@/lib/i18n/typen";
import type { ProfilWerte } from "@/lib/profil-typen";

/**
 * Reine Teile des öffentlichen Profils (Spec Profil 9) ohne Datenbankimport,
 * damit Komponenten und Tests die Query nicht mitladen.
 */

/** Länge der öffentlichen Liste; darüber steht „Die neuesten 50“. */
export const OEFFENTLICHE_BEWERTUNGEN = 50;

export type OeffentlicheBewertung = {
  id: string;
  slug: string;
  handelsname: string;
  gesamtnote: number | null;
  erstelltAm: Date;
};

export type OeffentlichesProfil = {
  anzeigename: string;
  avatarId: string | null;
  /** Freigegebene Bewertungen insgesamt, nicht nur die gezeigten. */
  anzahl: number;
  /** Gespeicherter Stand aus nutzer_profil; null, wenn noch nie gerechnet. */
  werte: ProfilWerte | null;
  bewertungen: OeffentlicheBewertung[];
};

/** Texte fürs Netz in dritter Person; alles Übrige wie im eigenen Profil. */
export function netzTexte(w: Woerterbuch): Woerterbuch["profil"] {
  const o = w.profilOeffentlich;
  return {
    ...w.profil,
    magIch: o.magIch,
    magIchNicht: o.magIchNicht,
    netzSkala: o.netzSkala,
    terpenSkala: o.terpenSkala,
    vorlaeufig: o.vorlaeufig,
    nurMittelfeld: o.nurMittelfeld,
    srMag: o.srMag,
    srMagNicht: o.srMagNicht,
  };
}
