/**
 * Was der Schalter „Öffentliches Profil“ schreibt (Spec Profil 9). Die Kurz-Id
 * entsteht nur beim ersten Einschalten und bleibt beim Ausschalten stehen: so
 * führt eine einmal geteilte Adresse nach dem Wiedereinschalten wieder zum Profil.
 */
export function sichtbarkeitsDaten(
  an: boolean,
  kurzId: string | null,
  neu: () => string,
): { profilOeffentlich: boolean; kurzId?: string } {
  if (an && !kurzId) return { profilOeffentlich: true, kurzId: neu() };
  return { profilOeffentlich: an };
}
