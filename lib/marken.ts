/** Rechtsformen und Füllwörter zählen nicht für die Initialen-Marke. */
const RECHTSFORM = /^(gmbh|ag|kg|co|&|ug|se|ltd|inc|bv|b\.v\.|plc|ohg|mbh)$/i;

/**
 * Initialen-Marke eines Unternehmens, wenn kein Logo hinterlegt ist: Anfangsbuchstaben der ersten
 * zwei Wörter ohne Rechtsform, bei einem Wort dessen erste zwei Zeichen. Leerer Name: „?“.
 */
export function markenInitialen(name: string): string {
  const alle = name.trim().split(/\s+/).filter(Boolean);
  if (alle.length === 0) return "?";
  const woerter = alle.filter((wort) => !RECHTSFORM.test(wort));
  const basis = woerter.length > 0 ? woerter : alle;
  const zeichen = basis.length === 1 ? [...basis[0]].slice(0, 2) : basis.slice(0, 2).map((wort) => [...wort][0]);
  return zeichen.join("").toUpperCase();
}

const LOGO_PFAD = /^\/marken\/[a-z0-9/_-]+\.(svg|png|webp)$/i;

/**
 * Nur eigene Dateien unter public/marken/ dürfen als Logo stehen (kein Fremdlink, kein Ausbruch
 * mit „..“). Alles andere gilt als leer, dann zeigt die Seite die Initialen-Marke.
 */
export function sichererLogoPfad(roh: string | null | undefined): string | null {
  const pfad = roh?.trim() ?? "";
  if (!pfad || pfad.includes("..") || pfad.includes("//")) return null;
  return LOGO_PFAD.test(pfad) ? pfad : null;
}
