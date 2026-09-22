import { createBrowserClient } from "@supabase/ssr";

/** Supabase-Client fuer Client Components. Nutzt ausschliesslich den anon-Key. */
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
