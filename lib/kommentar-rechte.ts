import type { KommentarStatus, KommentarZiel } from "@/db/enums";

export const MELDE_SCHWELLE = 3;
export const RATE_GRENZE = 10;

export function darfLoeschen(p: { ichId: string; istAdmin: boolean; autorId: string; inhaberId: string }): boolean {
  return p.istAdmin || p.ichId === p.autorId || p.ichId === p.inhaberId;
}

/** Privates Profil = keine Pinnwand; unfreigegebene Bewertung = nicht öffentlich (Spec Entscheidung 4). */
export function darfSchreiben(p: { ziel: KommentarZiel; zielOeffentlich: boolean }): boolean {
  return p.zielOeffentlich;
}

export function nachMeldung(anzahlNachher: number, status: KommentarStatus): KommentarStatus {
  if (status !== "SICHTBAR") return status;
  return anzahlNachher >= MELDE_SCHWELLE ? "GEMELDET" : "SICHTBAR";
}

/** anzahlLetzteStunde = schon geschriebene; der nächste wäre der (n+1)-te. */
export function zuSchnell(anzahlLetzteStunde: number): boolean {
  return anzahlLetzteStunde >= RATE_GRENZE;
}
