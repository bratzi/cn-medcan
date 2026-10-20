/**
 * Gemeinsame Helfer der Instagram-Skripte (Spec 2026-10-14 Themen-Agent): Umgebung, Browser, Publora,
 * Marken. Läuft lokal (Windows, Edge) und in der Cloud-Routine (Linux, Playwright-Chromium unter
 * /opt/pw-browsers). Nur Node-Bordmittel, keine Pakete.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

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

/** Eingecheckte Schriften (SIL OFL, siehe LIZENZ.md): kein Google zur Laufzeit in der Cloud. */
const SCHRIFTEN_ORDNER = "scripts/ig-schriften";

/** Dateiname des Stylesheets (ohne Endung) zu einem Google-Fonts-Link. */
export function schriftHash(link: string): string {
  return createHash("sha1").update(link).digest("hex").slice(0, 16);
}

/**
 * Lokales Stylesheet (url(./datei.woff2)) mit Data-URLs füllen. `lese` liefert die Datei oder undefined;
 * fehlt eine, gibt es null (dann greift der Netz-Weg).
 */
export function cssLokal(css: string, lese: (name: string) => Buffer | undefined): string | null {
  let fehlt = false;
  const ergebnis = css.replace(/url\(\.\/([^)]+)\)/g, (alt, name: string) => {
    const daten = lese(name);
    if (!daten) {
      fehlt = true;
      return alt;
    }
    return `url(data:font/woff2;base64,${daten.toString("base64")})`;
  });
  return fehlt ? null : ergebnis;
}

/** Ersetzt den Google-Link durch die eingecheckten Schriften, ohne Netz; null, wenn eine Datei fehlt. */
export function htmlMitLokalenSchriften(html: string, ordner = resolve(SCHRIFTEN_ORDNER)): string | null {
  const link = FONT_LINK.exec(html)?.[1];
  if (!link) return html;
  const cssDatei = join(ordner, `${schriftHash(link)}.css`);
  if (!existsSync(cssDatei)) return null;
  const css = cssLokal(readFileSync(cssDatei, "utf8"), (name) => {
    const pfad = join(ordner, name);
    return existsSync(pfad) ? readFileSync(pfad) : undefined;
  });
  return css === null ? null : linkDurchStil(html, css);
}

/**
 * Macht eine Seite netzfrei: Zuerst die eingecheckten Schriften (scripts/ig-schriften). Fehlt eine, werden
 * Stylesheet und Schriftdateien einmal geholt und unter tmp/ig/fonts zwischengespeichert, danach steckt alles
 * als Data-URL im HTML. So hängt der Screenshot (--virtual-time-budget) nicht an Google Fonts (ETIMEDOUT 2026-10-15).
 */
export async function htmlOffline(html: string): Promise<string> {
  const link = FONT_LINK.exec(html)?.[1];
  if (!link) return html;
  const lokal = htmlMitLokalenSchriften(html);
  if (lokal !== null) return lokal;
  const ordner = resolve("tmp/ig/fonts");
  const cache = join(ordner, `${schriftHash(link)}.css`);
  if (!existsSync(cache)) {
    const holen = async (url: string, optionen: RequestInit = {}) => {
      const antwort = await fetch(url, { ...optionen, signal: AbortSignal.timeout(15_000) });
      if (!antwort.ok) throw new Error(`Schrift ${url}: ${antwort.status}`);
      return antwort;
    };
    const css = await (await holen(link, { headers: { "User-Agent": FONT_UA } })).text();
    const urls = schriftUrls(css);
    if (!urls.length) throw new Error(`Google Fonts lieferte keine Schriftdateien: ${link}`);
    const daten = new Map<string, string>();
    for (const url of urls) daten.set(url, Buffer.from(await (await holen(url)).arrayBuffer()).toString("base64"));
    mkdirSync(ordner, { recursive: true });
    const temp = `${cache}.${process.pid}.tmp`;
    writeFileSync(temp, cssMitDaten(css, daten));
    renameSync(temp, cache);
  }
  return linkDurchStil(html, readFileSync(cache, "utf8"));
}

/** Gültiges PNG in genau dieser Größe: Signatur, IHDR-Maße, IEND am Ende (kein abgeschnittenes Bild). */
export function pngOk(datei: Buffer, breite: number, hoehe: number): boolean {
  if (datei.length < 33 || !datei.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return false;
  if (!datei.subarray(-12).includes("IEND")) return false;
  return datei.readUInt32BE(16) === breite && datei.readUInt32BE(20) === hoehe;
}

/** Breite × Höhe aus dem PNG-Kopf (IHDR), z. B. „1080×1300“; null ohne gültigen Kopf. */
export function pngMasse(datei: Buffer): string | null {
  if (datei.length < 24 || !datei.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return null;
  return `${datei.readUInt32BE(16)}×${datei.readUInt32BE(20)}`;
}

/** Screenshot (Standard 1080 × 1350); url darf http(s) oder file:// sein. */
export function screenshot(url: string, ziel: string, groesse = "1080,1350"): void {
  const linux = process.platform !== "win32";
  // Frisches Profil je Lauf: ein offener Browser oder ein altes Profil lässt den Start hängen.
  const profil = mkdtempSync(join(tmpdir(), "ig-browser-"));
  rmSync(ziel, { force: true });
  const [breite, hoehe] = groesse.split(",").map(Number);
  const bildOk = () => existsSync(ziel) && pngOk(readFileSync(ziel), breite, hoehe);
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
    // Edge speichert das Bild manchmal und hängt dann beim Beenden: ein vollständiges Bild gilt.
    if (!bildOk()) throw f;
  } finally {
    try {
      rmSync(profil, { recursive: true, force: true, maxRetries: 3 });
    } catch {
      // Aufräumen darf ein gelungenes Bild nicht kippen (EBUSY unter Windows).
    }
  }
  if (!bildOk()) {
    const ist = existsSync(ziel) ? (pngMasse(readFileSync(ziel)) ?? "kein gültiges PNG") : "keine Datei";
    throw new Error(`Screenshot unvollständig oder falsche Größe (erwartet ${breite}×${hoehe}, ist ${ist}): ${ziel}`);
  }
}

async function publora<T>(pfad: string, body?: unknown, methode?: "PUT" | "DELETE"): Promise<T> {
  const schluessel = pflicht(umgebung(), "PUBLORA_API_KEY");
  const antwort = await fetch(`${PUBLORA}/${pfad}`, {
    method: methode ?? (body === undefined ? "GET" : "POST"),
    headers: { "Content-Type": "application/json", "x-publora-key": schluessel },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const daten = (await antwort.json().catch(() => ({}))) as T & { success?: boolean; error?: string };
  if (!antwort.ok || daten.success === false) throw new Error(`Publora ${pfad}: ${antwort.status} ${daten.error ?? ""}`.trim());
  return daten;
}

type Medium = { pfad: string; name: string; typ: "image/png" | "video/mp4" };

/** Entwurf ohne Termin mit einem oder mehreren Medien (Karussell, Reel); Dateinamen tragen die Marke. */
export async function entwurfMedien(caption: string, medien: Medium[], alsStory = false): Promise<string> {
  const plattform = pflicht(umgebung(), "INSTAGRAM_PLATFORM_ID");
  const { postGroupId } = await publora<{ postGroupId: string }>("create-post", {
    content: caption,
    platforms: [plattform],
    // Publora kennt Storys nur als Video mit videoType STORIES (docs.publora.com/platforms/instagram).
    ...(alsStory ? { platformSettings: { instagram: { videoType: "STORIES" } } } : {}),
  });
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

/**
 * Planzeit für Publora: „jetzt“ heißt in drei Minuten (Publora braucht Vorlauf), sonst ein ISO-Zeitpunkt, der mindestens
 * zwei Minuten in der Zukunft liegt. Ungültiges oder Vergangenes ist ein Fehler, damit nie versehentlich sofort gepostet wird.
 */
export function planZeit(angabe: string, jetzt: Date = new Date()): string {
  if (angabe === "jetzt") return new Date(jetzt.getTime() + 3 * 60_000).toISOString();
  const zeit = new Date(angabe);
  if (Number.isNaN(zeit.getTime())) throw new Error(`keine gültige Zeit: ${angabe}`);
  if (zeit.getTime() < jetzt.getTime() + 2 * 60_000) throw new Error(`Zeit liegt nicht mindestens 2 Minuten in der Zukunft: ${angabe}`);
  return zeit.toISOString();
}

/** Ist heute (UTC) schon ein Post eingeplant oder erschienen? Dann legt die Routine keinen weiteren an. */
export function tagBelegt(posts: { status?: string; scheduledTime?: string }[], jetzt: Date = new Date()): boolean {
  const tag = jetzt.toISOString().slice(0, 10);
  return posts.some((p) => (p.status === "scheduled" || p.status === "published") && p.scheduledTime?.slice(0, 10) === tag);
}

/** Entwurf zur Veröffentlichung einplanen (Publora: update-post mit status „scheduled“). */
export async function planen(postGroupId: string, zeitpunkt: string): Promise<void> {
  await publora(`update-post/${postGroupId}`, { status: "scheduled", scheduledTime: zeitpunkt }, "PUT");
}

/** Entwurf samt Medien löschen. */
export async function loeschen(postGroupId: string): Promise<void> {
  await publora(`delete-post/${postGroupId}`, undefined, "DELETE");
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

/**
 * Story zu jedem Feed-Post (Betreiber 2026-10-15). Instagrams „Auch in Story teilen“ gibt es in der API nicht; deshalb
 * entsteht neben jedem Reel oder Karussell ein eigener Story-Entwurf mit der Marke bot-story-…, den planenMitStory
 * zusammen mit dem Feed-Post einplant.
 */
export function storyMarke(feedMarke: string): string {
  if (!feedMarke.startsWith("bot-")) throw new Error(`keine Feed-Marke: ${feedMarke}`);
  return `bot-story-${feedMarke.slice(4)}`;
}

type PostZeile = { postGroupId?: string; status?: string; mediaUrls?: unknown };

/** postGroupId des offenen Story-Entwurfs zum Feed-Post, sonst null. */
export function storyFuer(posts: readonly PostZeile[], feedGruppe: string): string | null {
  const feed = posts.find((p) => p.postGroupId === feedGruppe);
  const marke = feed ? [...markenAus([feed])][0] : undefined;
  if (!marke || marke.startsWith("bot-story-")) return null;
  const ziel = storyMarke(marke);
  const story = posts.find((p) => p.status === "draft" && markenAus([p]).has(ziel));
  return story?.postGroupId ?? null;
}

/** Hochformat-Seite: Karussell-Cover mittig auf dunklem 1080×1920-Grund. */
export function storyHtml(bildUrl: string): string {
  return `<!doctype html><html><body style="margin:0;width:1080px;height:1920px;background:#0d1210;display:flex;align-items:center;justify-content:center"><img src="${bildUrl}" style="width:1080px;display:block"></body></html>`;
}

/**
 * ffmpeg-Argumente: fertiges 1080×1920-Bild als 6 s stummes H.264-Video. Das ffmpeg aus Remotion kennt kein
 * pad/overlay, darum entsteht der Hochformat-Grund vorher per Screenshot (storyHtml).
 */
export function storyVideoArgumente(bild: string, ziel: string): string[] {
  return [
    "-y", "-loop", "1", "-i", bild, "-t", "6", "-r", "30",
    "-vf", "scale=1080:1920,format=yuv420p",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", ziel,
  ];
}

const FFMPEG = resolve("video/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");

/** Story-Entwurf aus einem Reel (dasselbe MP4) oder einem Karussell-Cover (PNG → MP4). */
export async function storyEntwurf(feedMarke: string, quelle: string): Promise<string> {
  const name = `${storyMarke(feedMarke)}.mp4`;
  let mp4 = quelle;
  if (quelle.endsWith(".png")) {
    mp4 = join(resolve("tmp/ig"), name);
    mkdirSync(resolve("tmp/ig"), { recursive: true });
    const html = join(resolve("tmp/ig"), `${storyMarke(feedMarke)}.html`);
    const hoch = html.replace(/\.html$/, ".png");
    writeFileSync(html, storyHtml(pathToFileURL(resolve(quelle)).href));
    screenshot(pathToFileURL(html).href, hoch, "1080,1920");
    execFileSync(existsSync(FFMPEG) ? FFMPEG : "ffmpeg", storyVideoArgumente(hoch, mp4), { stdio: "ignore" });
  }
  return entwurfMedien("Neu im Feed: Book of Terpz", [{ pfad: mp4, name, typ: "video/mp4" }], true);
}

/** Feed-Post einplanen und, falls vorhanden, seine Story eine Minute später. */
export async function planenMitStory(feedGruppe: string, zeitpunkt: string): Promise<string | null> {
  await planen(feedGruppe, zeitpunkt);
  const story = storyFuer((await publoraPosts()) as PostZeile[], feedGruppe);
  if (!story) return null;
  try {
    await planen(story, new Date(new Date(zeitpunkt).getTime() + 60_000).toISOString());
  } catch (f) {
    // Publora Free begrenzt geplante Posts; der Feed-Post steht schon, die Story bleibt Entwurf.
    console.error(`Story ${story} nicht geplant: ${f instanceof Error ? f.message : f}`);
    return null;
  }
  return story;
}
