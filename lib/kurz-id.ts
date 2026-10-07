/**
 * Kurz-Id des öffentlichen Profils (Spec Profil 9): 8 Zeichen, keine Namen in
 * der URL. Ohne 0, 1, i, l, o, damit sie sich abschreiben lässt. Zufall aus
 * crypto, verworfene Bytes vermeiden eine Schieflage zugunsten früher Zeichen.
 */
export const KURZ_ID_ZEICHEN = "23456789abcdefghjkmnpqrstuvwxyz";
export const KURZ_ID_LAENGE = 8;

const GRENZE = 256 - (256 % KURZ_ID_ZEICHEN.length);
const MUSTER = new RegExp(`^[${KURZ_ID_ZEICHEN}]{${KURZ_ID_LAENGE}}$`);

function zufallsBytes(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

export function neueKurzId(zufall: (n: number) => Uint8Array = zufallsBytes): string {
  let id = "";
  while (id.length < KURZ_ID_LAENGE) {
    for (const b of zufall(KURZ_ID_LAENGE - id.length)) {
      if (b < GRENZE) id += KURZ_ID_ZEICHEN[b % KURZ_ID_ZEICHEN.length];
    }
  }
  return id;
}

export function istKurzId(wert: string): boolean {
  return MUSTER.test(wert);
}

export function profilHref(kurzId: string): string {
  return `/profil/${kurzId}`;
}
