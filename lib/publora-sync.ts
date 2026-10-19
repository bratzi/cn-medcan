/** Publora-Rohposts in Zeilen für den Admin-Kalender formen und den Sync-Body prüfen (Spec 2026-10-16). Rein. */
export type PostArt = "karussell" | "reel" | "story" | "bild";
export type PubloraZeile = { id: string; gruppe: string; plattform: string; art: PostArt; status: string; geplantAm: string | null; titel: string };

export const SYNC_MAX = 500;
export const PUBLORA_STATUS = ["draft", "scheduled", "published", "failed", "unbekannt"] as const;
const ARTEN: readonly PostArt[] = ["karussell", "reel", "story", "bild"];
const DREISSIG_TAGE = 30 * 24 * 60 * 60 * 1000;

const text = (v: unknown) => (typeof v === "string" ? v : "");

function artAus(urls: unknown): PostArt {
  const liste = Array.isArray(urls) ? urls.filter((u): u is string => typeof u === "string") : [];
  if (liste.some((u) => /\/\d+-bot-story-/.test(u))) return "story";
  if (liste.some((u) => /\.mp4$/i.test(u))) return "reel";
  return liste.length > 1 ? "karussell" : "bild";
}

export function publoraZeilen(posts: unknown[], jetzt: Date = new Date()): PubloraZeile[] {
  const grenze = jetzt.getTime() - DREISSIG_TAGE;
  const gesehen = new Set<string>();
  const zeilen: PubloraZeile[] = [];
  for (const roh of posts) {
    if (!roh || typeof roh !== "object") continue;
    const p = roh as Record<string, unknown>;
    const gruppe = text(p.postGroupId);
    const id = text(p.id) || gruppe;
    if (!id || gesehen.has(id)) continue;
    const zeit = text(p.scheduledTime);
    const geplantAm = zeit && !Number.isNaN(Date.parse(zeit)) ? new Date(zeit).toISOString() : null;
    if (geplantAm && Date.parse(geplantAm) < grenze) continue;
    gesehen.add(id);
    const status = text(p.status);
    zeilen.push({
      id,
      gruppe: gruppe || id,
      plattform: text(p.platform) || "instagram",
      art: artAus(p.mediaUrls),
      status: (PUBLORA_STATUS as readonly string[]).includes(status) ? status : "unbekannt",
      geplantAm,
      titel: text(p.content).split("\n")[0].trim().slice(0, 120),
    });
  }
  return zeilen;
}

export function syncPruefen(body: unknown): string[] {
  const posts = (body as { posts?: unknown } | null)?.posts;
  if (!Array.isArray(posts)) return ["posts fehlt"];
  if (posts.length > SYNC_MAX) return [`höchstens ${SYNC_MAX} Zeilen`];
  const fehler: string[] = [];
  posts.forEach((roh, i) => {
    const z = roh as Partial<PubloraZeile> | null;
    if (!z || typeof z.id !== "string" || !z.id || typeof z.gruppe !== "string" || typeof z.plattform !== "string" || typeof z.titel !== "string") fehler.push(`${i}: Felder`);
    else if (!ARTEN.includes(z.art as PostArt)) fehler.push(`${i}: art`);
    else if (!(PUBLORA_STATUS as readonly string[]).includes(z.status ?? "")) fehler.push(`${i}: status`);
    else if (z.geplantAm !== null && (typeof z.geplantAm !== "string" || Number.isNaN(Date.parse(z.geplantAm)))) fehler.push(`${i}: geplantAm`);
  });
  return fehler;
}
