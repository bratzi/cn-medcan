/**
 * Kurz-Id fürs Buch (Spec Profil 9): der Name verlinkt nur, wenn das Profil
 * öffentlich ist. Die Kurz-Id eines privaten Profils verlässt den Server nie.
 */
export function autorProfilAus(autor: { profilOeffentlich: boolean; kurzId: string | null } | null): string | null {
  return autor?.profilOeffentlich && autor.kurzId ? autor.kurzId : null;
}
