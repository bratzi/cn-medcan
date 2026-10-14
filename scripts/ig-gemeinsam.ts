/**
 * Gemeinsame Helfer der Instagram-Skripte (Spec 2026-10-14 Themen-Agent): Umgebung, Browser, Publora,
 * Marken. Läuft lokal (Windows, Edge) und in der Cloud-Routine (Linux, Playwright-Chromium unter
 * /opt/pw-browsers). Nur Node-Bordmittel, keine Pakete.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";

type Env = Record<string, string | undefined>;

const PUBLORA = "https://api.publora.com/api/v1";
const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"];
const PW_BROWSER = "/opt/pw-browsers";

function envLesen(datei: string): Record<string, string> {
  if (!existsSync(datei)) return {};
  return Object.fromEntries(
    readFileSync(datei, "utf8")
      .split(/\r?\n/)
      .map((z) => /^([A-Z0-9_]+)=(.*)$/.exec(z.trim()))
      .filter((t): t is RegExpExecArray => t !== null)
      .map((t) => [t[1], t[2].replace(/^["']|["']$/g, "")]),
  );
}

/** Lokale Dateien, darüber die echte Umgebung (Cloud-Routine setzt Variablen direkt). */
export function umgebung(): Env {
  return { ...envLesen(".env"), ...envLesen(".env.ig-feed"), ...process.env };
}

export function pflicht(env: Env, name: string): string {
  const wert = env[name];
  if (!wert) throw new Error(`${name} fehlt (Umgebung, .env oder .env.ig-feed)`);
  return wert;
}

/** Feed-Schlüssel aus IG_FEED_KEY oder dem key-Parameter von IG_FEED_URL. */
export function feedSchluessel(env: Env): string {
  if (env.IG_FEED_KEY) return env.IG_FEED_KEY;
  const ausUrl = env.IG_FEED_URL ? new URL(env.IG_FEED_URL).searchParams.get("key") : null;
  if (!ausUrl) throw new Error("IG_FEED_KEY fehlt (auch nicht in IG_FEED_URL)");
  return ausUrl;
}

export function browserPfad(
  plattform: NodeJS.Platform,
  gibts: (p: string) => boolean = existsSync,
  liste: (dir: string) => string[] = (d) => (existsSync(d) ? readdirSync(d) : []),
  env: Env = process.env,
): string {
  if (env.IG_BROWSER) return env.IG_BROWSER;
  if (plattform === "win32") {
    const edge = EDGE.find(gibts);
    if (edge) return edge;
  } else {
    const kandidaten = liste(PW_BROWSER)
      .filter((n) => /^chromium-\d+$/.test(n))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
      .map((n) => `${PW_BROWSER}/${n}/chrome-linux/chrome`);
    const treffer = kandidaten.find(gibts);
    if (treffer) return treffer;
  }
  throw new Error("kein Browser gefunden (IG_BROWSER setzen)");
}

/** Screenshot 1080 × 1350; url darf http(s) oder file:// sein. */
export function screenshot(url: string, ziel: string): void {
  const linux = process.platform !== "win32";
  execFileSync(
    browserPfad(process.platform),
    [
      "--headless",
      "--disable-gpu",
      ...(linux ? ["--no-sandbox"] : []),
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1080,1350",
      "--virtual-time-budget=8000",
      `--screenshot=${ziel}`,
      url,
    ],
    { stdio: "ignore", timeout: 60_000 },
  );
  if (!existsSync(ziel)) throw new Error(`Screenshot fehlt: ${ziel}`);
}

async function publora<T>(pfad: string, body?: unknown): Promise<T> {
  const schluessel = pflicht(umgebung(), "PUBLORA_API_KEY");
  const antwort = await fetch(`${PUBLORA}/${pfad}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", "x-publora-key": schluessel },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const daten = (await antwort.json().catch(() => ({}))) as T & { success?: boolean; error?: string };
  if (!antwort.ok || daten.success === false) throw new Error(`Publora ${pfad}: ${antwort.status} ${daten.error ?? ""}`.trim());
  return daten;
}

/** Entwurf ohne Termin mit einem Bild; dateiname ist zugleich die Marke. */
export async function entwurf(caption: string, png: string, dateiname: string): Promise<string> {
  const plattform = pflicht(umgebung(), "INSTAGRAM_PLATFORM_ID");
  const { postGroupId } = await publora<{ postGroupId: string }>("create-post", { content: caption, platforms: [plattform] });
  const { uploadUrl, mediaId } = await publora<{ uploadUrl: string; mediaId: string }>("get-upload-url", {
    fileName: dateiname,
    contentType: "image/png",
    type: "image",
    postGroupId,
  });
  const hoch = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: readFileSync(png) });
  if (!hoch.ok) throw new Error(`Bild-Upload: ${hoch.status}`);
  // Ohne diesen Schritt bleibt das Bild in Publora auf „uploading“ (Live 2026-10-14).
  const { mediaFile } = await publora<{ mediaFile?: { status?: string } }>(`complete-media/${mediaId}`, {});
  if (mediaFile?.status !== "ready") throw new Error(`Bild nicht bereit: ${mediaFile?.status ?? "unbekannt"} (Entwurf ${postGroupId})`);
  return postGroupId;
}

/** Alle Posts aus list-posts, Seite für Seite (Publora liefert 20 je Seite). */
export async function publoraPosts(): Promise<unknown[]> {
  const alle: unknown[] = [];
  for (let seite = 1; seite <= 50; seite++) {
    const { posts, pagination } = await publora<{ posts?: unknown[]; pagination?: { hasNextPage?: boolean } }>(`list-posts?page=${seite}`);
    alle.push(...(posts ?? []));
    if (!pagination?.hasNextPage) break;
  }
  return alle;
}

/**
 * Marken aller Posts aus den mediaUrls: Publora speichert …/images/<Zeitstempel>-<Dateiname>.png, die Marke
 * ist der Dateiname ohne Zeitstempel und Endung (Bewertungs-Id oder bot-thema-…).
 */
export function markenAus(posts: unknown[]): Set<string> {
  const marken = new Set<string>();
  for (const post of posts) {
    const urls = (post as { mediaUrls?: unknown } | null)?.mediaUrls;
    if (!Array.isArray(urls)) continue;
    for (const url of urls) {
      const name = typeof url === "string" ? /\/\d+-([^/]+)\.png$/i.exec(url)?.[1] : undefined;
      if (name) marken.add(name);
    }
  }
  return marken;
}
