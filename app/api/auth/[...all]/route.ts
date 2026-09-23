import { getAuth } from "@/lib/auth";

/**
 * Alle Better-Auth-Endpunkte (`/api/auth/*`): Registrierung, Anmeldung,
 * Abmeldung, Session.
 *
 * Kein `toNextJsHandler`: der erwartet eine fertige Auth-Instanz auf
 * Modulebene, die es hier nicht geben kann - das D1-Binding steht erst im
 * Request zur Verfuegung (siehe lib/auth.ts).
 *
 * Diese Route bleibt zusaetzlich hinter dem Entwicklungs-Passwort aus
 * proxy.ts. Das ist gewollt, solange die Seite geschlossen ist.
 */
export async function GET(request: Request) {
  const auth = await getAuth();
  return auth.handler(request);
}

export async function POST(request: Request) {
  const auth = await getAuth();
  return auth.handler(request);
}
