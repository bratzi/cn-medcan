import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Einziger Zugriffspunkt auf Cloudflare-Bindings und Worker-Secrets.
 * Components, Pages und Route Handler greifen nie direkt auf `env` zu.
 */
export async function getEnv() {
  const { env } = await getCloudflareContext({ async: true });
  return env;
}

/** Synchrone Variante - nur im Request-Kontext (Route Handler, Server Action, Middleware). */
export function getEnvSync() {
  return getCloudflareContext().env;
}

/**
 * Liest eine Server-Variable. Auf Workers kommt sie aus dem Binding,
 * lokal aus process.env (.env.local). Wirft, wenn sie fehlt.
 */
export async function requireVar(name: string): Promise<string> {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;

  const env = (await getEnv()) as unknown as Record<string, string | undefined>;
  const value = env[name];
  if (!value) {
    throw new Error(
      `Variable ${name} fehlt. Lokal in .env.local eintragen, fuer den Worker mit \`wrangler secret put ${name}\` setzen.`
    );
  }
  return value;
}
