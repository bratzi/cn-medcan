import { cookies } from "next/headers";

import { COOKIE_NAME, tokenPruefen } from "@/lib/gate";

/**
 * Fachkreis-Gate.
 *
 * SICHERHEITSREGEL, keine Stilfrage: Die Rolle stammt ausschliesslich aus dem
 * HMAC-signierten Gate-Token (lib/gate.ts). Der Cookie-Inhalt wird nie roh
 * uebernommen - ohne gueltige Signatur gilt er als nicht vorhanden. Die Rolle
 * darf NIEMALS aus einem Query-Parameter, einem Header oder einem
 * Request-Body kommen, sonst laesst sich das Preisgate (Paragraph 10 HWG)
 * durch einen manipulierten Request aushebeln.
 *
 * Einordnung: Paragraph 10 HWG adressiert Fachkreise, also Angehoerige der
 * Heilberufe. Das zweite Passwort ist dafuer ein Behelf fuer die geschlossene
 * Entwicklungsphase, kein Nachweis. Mit Block B (Better Auth) wird daraus
 * eine echte Mitgliedsrolle; bis dahin bleibt die Seite ohnehin komplett
 * hinter dem Gate.
 */
export async function istFachkreis(): Promise<boolean> {
  const secret = process.env.SITE_SESSION_SECRET;
  if (!secret) return false;

  try {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    return (await tokenPruefen(secret, token)) === "fachkreis";
  } catch {
    // `cookies()` wirft in einem statisch gerenderten Kontext. Der sichere
    // Default ist dort "kein Fachkreis": lieber Preise verbergen als leaken.
    return false;
  }
}
