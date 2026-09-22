import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Einziger Zugriffspunkt auf Cloudflare-Bindings.
 * Components und Routes greifen nie direkt auf `env` zu.
 */
export async function getEnv() {
  const { env } = await getCloudflareContext({ async: true });
  return env;
}

/** Synchrone Variante — nur in Request-Kontext (Route Handler, Server Action) erlaubt. */
export function getEnvSync() {
  return getCloudflareContext().env;
}

export async function getD1() {
  const env = await getEnv();
  if (!env.DB) {
    throw new Error(
      "D1-Binding `DB` fehlt. Pruefe wrangler.jsonc und starte den Dev-Server neu."
    );
  }
  return env.DB;
}
