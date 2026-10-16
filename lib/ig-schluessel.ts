import { passwortPruefen } from "@/lib/gate";

/** Schlüssel `?key=` gegen das Secret IG_FEED_KEY; ohne Secret nie offen (zusätzlich zum Proxy). */
export async function igSchluesselOk(anfrage: Request): Promise<boolean> {
  const erwartet = process.env.IG_FEED_KEY;
  const key = new URL(anfrage.url).searchParams.get("key");
  return Boolean(erwartet && key && (await passwortPruefen(erwartet, key)));
}
