import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase-Client fuer Server Components und Route Handler.
 * Traegt das Nutzer-JWT, damit Row Level Security greift.
 * Das ist der Pfad fuer alles Nutzerbezogene - nicht Prisma.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // In Server Components ist Schreiben nicht erlaubt - die Middleware
            // erneuert die Session, deshalb ist das hier folgenlos.
          }
        },
      },
    }
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} fehlt. In .env.local eintragen.`);
  }
  return value;
}
