/**
 * Reine Helfer fuer den Avatar (T8, Nutzer 2026-09-29): Initialen und eine
 * deterministische Farbe aus semantischen Tokens fuer Mitglieder ohne Bild.
 */

/** Grenzen des Avatars: 128 x 128 WebP, hoechstens 30 KB (Brief T8). */
export const AVATAR_SEITE = 128;
export const AVATAR_MAX_BYTES = 30 * 1024;

/** Hoechstens zwei Initialen, als ganze Zeichen (Emoji und Umlaute bleiben heil). */
export function initialen(name: string): string {
  const woerter = name.trim().split(/\s+/).filter(Boolean);
  if (woerter.length === 0) return "?";
  return woerter
    .slice(0, 2)
    .map((wort) => (Array.from(wort)[0] ?? "").toLocaleUpperCase("de-DE"))
    .join("");
}

/** Paare Flaeche + Schrift, die Paare accent, kopierstift und text auf accent-subtle stehen in scripts/farben-pruefen.mjs; text auf surface-sunken ist Tinte auf der hellsten Untergrundstufe. */
const FARBEN = [
  "bg-accent text-accent-fg",
  "bg-kopierstift text-kopierstift-fg",
  "bg-accent-subtle text-text border border-accent",
  "bg-surface-sunken text-text border border-border-strong",
] as const;

/** Gleicher Name, gleiche Farbe (einfacher Streuwert ueber die Codepunkte). */
export function avatarFarbe(name: string): string {
  let h = 0;
  for (const z of name.trim()) h = (h * 31 + (z.codePointAt(0) ?? 0)) >>> 0;
  return FARBEN[h % FARBEN.length];
}
