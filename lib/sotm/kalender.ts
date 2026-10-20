/** Kalender des Strain of the Month (Spec 2026-10-20, Teil B). Alles in UTC. */
export type SotmPhase = "VORSCHLAG" | "ABSTIMMUNG";

export function monatSchluessel(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function folgeMonat(schluessel: string): string {
  const [jahr, monat] = schluessel.split("-").map(Number);
  return monatSchluessel(new Date(Date.UTC(jahr, monat, 1)));
}

export function sotmLage(jetzt: Date) {
  const jahr = jetzt.getUTCFullYear();
  const monat = jetzt.getUTCMonth();
  const laufenderMonat = monatSchluessel(jetzt);
  const vorschlag = jetzt.getUTCDate() < 15;
  return {
    phase: (vorschlag ? "VORSCHLAG" : "ABSTIMMUNG") as SotmPhase,
    laufenderMonat,
    zielMonat: folgeMonat(laufenderMonat),
    phaseEndet: vorschlag ? new Date(Date.UTC(jahr, monat, 15)) : new Date(Date.UTC(jahr, monat + 1, 1)),
  };
}

export function resttage(jetzt: Date, ende: Date): number {
  return Math.max(0, Math.ceil((ende.getTime() - jetzt.getTime()) / 86_400_000));
}
