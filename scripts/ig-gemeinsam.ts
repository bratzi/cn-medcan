/**
 * Gemeinsame Helfer der Instagram-Skripte (Spec 2026-10-14 Themen-Agent): Umgebung, Browser, Publora,
 * Marken. Läuft lokal (Windows, Edge) und in der Cloud-Routine (Linux, Playwright-Chromium unter
 * /opt/pw-browsers). Nur Node-Bordmittel, keine Pakete.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

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

const FONT_LINK = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/[^"]+)">/;
const FONT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

/** Alle Schrift-URLs eines Google-Fonts-Stylesheets, ohne Dubletten. */
export function schriftUrls(css: string): string[] {
  return [...new Set([...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((t) => t[1]))];
}

/** Ersetzt jede Schrift-URL durch eine Data-URL (Base64 je URL aus `daten`). */
export function cssMitDaten(css: string, daten: Map<string, string>): string {
  return css.replace(/url\((https:\/\/[^)]+)\)/g, (alt, url: string) => {
    const b64 = daten.get(url);
    return b64 ? `url(data:font/woff2;base64,${b64})` : alt;
  });
}

/** Setzt den Google-Fonts-Link der Seite durch ein Inline-Stylesheet; ohne Link bleibt das HTML gleich. */
export function linkDurchStil(html: string, css: string): string {
  return html.replace(FONT_LINK, () => `<style>${css}</style>`);
}

/**
 * Macht eine Seite netzfrei: Das Stylesheet und die Schriftdateien werden einmal geholt und unter
 * tmp/ig/fonts zwischengespeichert, danach steckt alles als Data-URL im HTML. So hängt der Screenshot
 * (--virtual-time-budget) nicht mehr an Google Fonts (ETIMEDOUT-Fälle 2026-10-15).
 */
export async function htmlOffline(html: string): Promise<string> {
  const link = FONT_LINK.exec(html)?.[1];
  if (!link) return html;
  const ordner = resolve("tmp/ig/fonts");
  const cache = join(ordner, `${createHash("sha1").update(link).digest("hex").slice(0, 16)}.css`);
  if (!existsSync(cache)) {
    const css = await (await fetch(link, { headers: { "User-Agent": FONT_UA } })).text();
    const daten = new Map<string, string>();
    for (const url of schriftUrls(css)) {
      const antwort = await fetch(url);
      if (!antwort.ok) throw new Error(`Schrift ${url}: ${antwort.status}`);
      daten.set(url, Buffer.from(await antwort.arrayBuffer()).toString("base64"));
    }
    mkdirSync(ordner, { recursive: true });
    writeFileSync(cache, cssMitDaten(css, daten));
  }
  return linkDurchStil(html, readFileSync(cache, "utf8"));
}

/** Screenshot (Standard 1080 × 1350); url darf http(s) oder file:// sein. */
export function screenshot(url: string, ziel: string, groesse = "1080,1350"): void {
  const linux = process.platform !== "win32";
  // Frisches Profil je Lauf: ein offener Browser oder ein altes Profil lässt den Start hängen.
  const profil = mkdtempSync(join(tmpdir(), "ig-browser-"));
  rmSync(ziel, { force: true });
  try {
    execFileSync(
      browserPfad(process.platform),
      [
        "--headless",
        "--disable-gpu",
        ...(linux ? ["--no-sandbox"] : []),
        `--user-data-dir=${profil}`,
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        `--window-size=${groesse}`,
        "--virtual-time-budget=8000",
        `--screenshot=${ziel}`,
        url,
      ],
      { stdio: "ignore", timeout: 30_000 },
    );
  } catch (f) {
    // Edge speichert das Bild manchmal und hängt dann beim Beenden: ein vorhandenes Bild gilt.
    if (!existsSync(ziel) || statSync(ziel).size === 0) throw f;
  } finally {
    rmSync(profil, { recursive: true, force: true });
  }
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

type Medium = { pfad: string; name: string; typ: "image/png" | "video/mp4" };

/** Entwurf ohne Termin mit einem oder mehreren Medien (Karussell, Reel); Dateinamen tragen die Marke. */
export async function entwurfMedien(caption: string, medien: Medium[]): Promise<string> {
  const plattform = pflicht(umgebung(), "INSTAGRAM_PLATFORM_ID");
  const { postGroupId } = await publora<{ postGroupId: string }>("create-post", { content: caption, platforms: [plattform] });
  try {
    for (const m of medien) {
      const { uploadUrl, mediaId } = await publora<{ uploadUrl: string; mediaId: string }>("get-upload-url", {
        fileName: m.name,
        contentType: m.typ,
        type: m.typ === "video/mp4" ? "video" : "image",
        postGroupId,
      });
      const hoch = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": m.typ }, body: readFileSync(m.pfad) });
      if (!hoch.ok) throw new Error(`Upload ${m.name}: ${hoch.status}`);
      // Ohne diesen Schritt bleibt das Medium in Publora auf „uploading“ (Live 2026-10-14).
      const { mediaFile } = await publora<{ mediaFile?: { status?: string } }>(`complete-media/${mediaId}`, {});
      if (mediaFile?.status !== "ready") throw new Error(`${m.name} nicht bereit: ${mediaFile?.status ?? "unbekannt"}`);
    }
  } catch (f) {
    // Kein Auto-Löschen: der halbe Entwurf bleibt in Publora und muss von Hand weg.
    const grund = f instanceof Error ? f.message : String(f);
    throw new Error(`${grund} (Entwurf ${postGroupId} unvollständig, in Publora löschen)`);
  }
  return postGroupId;
}

export async function entwurf(caption: string, png: string, dateiname: string): Promise<string> {
  return entwurfMedien(caption, [{ pfad: png, name: dateiname, typ: "image/png" }]);
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

/** Themen-Posts des Agenten: alte Themenkarten (`bot-thema-`) und Karussells (`bot-k-`). */
export function istThemenMarke(marke: string): boolean {
  return marke.startsWith("bot-thema-") || marke.startsWith("bot-k-");
}

/**
 * Marken aller Posts aus den mediaUrls: Publora speichert …/images/<Zeitstempel>-<Dateiname>.png, die Marke
 * ist der Dateiname ohne Zeitstempel und Endung (Bewertungs-Id, bot-thema-… oder bot-k-…).
 */
export function markenAus(posts: unknown[]): Set<string> {
  const marken = new Set<string>();
  for (const post of posts) {
    const urls = (post as { mediaUrls?: unknown } | null)?.mediaUrls;
    if (!Array.isArray(urls)) continue;
    for (const url of urls) {
      const name = typeof url === "string" ? /\/\d+-([^/]+)\.(png|mp4)$/i.exec(url)?.[1] : undefined;
      if (name) marken.add(name.startsWith("bot-k-") ? name.replace(/-\d+$/, "") : name);
    }
  }
  return marken;
}
