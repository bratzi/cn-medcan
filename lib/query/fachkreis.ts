import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Fachkreis-Gate.
 *
 * SICHERHEITSREGEL, keine Stilfrage: Die Rolle wird ausschliesslich
 * serverseitig aus `app_metadata` des Supabase-Nutzers gelesen.
 * `app_metadata` kann der Nutzer selbst nicht schreiben (im Gegensatz zu
 * `user_metadata`). Die Rolle darf NIEMALS aus einem Cookie, einem
 * Query-Parameter, einem Header oder einem Request-Body uebernommen werden -
 * sonst laesst sich das Preisgate (§10 HWG) durch einen manipulierten
 * Request aushebeln.
 */
const FACHKREIS_ROLLEN = new Set(["fachkreis", "admin"]);

export async function istFachkreis(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return false;

    const rolle = data.user.app_metadata?.rolle;
    return typeof rolle === "string" && FACHKREIS_ROLLEN.has(rolle);
  } catch {
    // Absichtlich weit gefasst: `getSupabaseServerClient()` wirft, wenn
    // NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY fehlen - in .env.local stehen
    // derzeit nur Platzhalter. Ausserdem kann `cookies()` in einem statisch
    // gerenderten Kontext fehlschlagen. Der sichere Default ist in beiden
    // Faellen "kein Fachkreis": lieber Preise verbergen als leaken.
    return false;
  }
}
