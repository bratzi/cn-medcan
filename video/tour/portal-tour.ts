/**
 * Portal-Tour als Reel-Rohmaterial (Spec 2026-10-15 Produktmarke).
 *   npx tsx tour/portal-tour.ts <pfad> <schluessel>      z. B. /ig ig-landing
 * Ergebnis: out/bot-reel-tour-<schluessel>.mp4 (1080 × 1920, höchstens 30 s, stumm).
 * HWG: keine Bewertungsseite mit Sortennamen im Fokus, nur Startseite, Schema, Umfragen, Aroma-Karte.
 * Zugang hinter dem Passwort-Gate über IG_TOUR_PASSWORT aus ../.env.ig-feed; ohne Passwort nur öffentliche Pfade (/ig).
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { chromium, type Page } from "playwright";

import { zuschnitt } from "./zuschnitt";

const BASIS = process.env.IG_TOUR_BASIS ?? "https://cn-medcan.w-helwich.workers.dev";
const OEFFENTLICH = new Set(["/ig"]);

/** Klickziele je Pfad; nur Seiten ohne Sortennamen im Fokus. */
const KLICKS: Record<string, string[]> = {
  "/": ['a[href="/umfragen"]'],
};

function passwort(): string | undefined {
  if (process.env.IG_TOUR_PASSWORT) return process.env.IG_TOUR_PASSWORT;
  const datei = "../.env.ig-feed";
  if (!existsSync(datei)) return undefined;
  const zeile = readFileSync(datei, "utf8").split(/\r?\n/).find((z) => z.startsWith("IG_TOUR_PASSWORT="));
  return zeile?.slice("IG_TOUR_PASSWORT=".length).trim().replace(/^"|"$/g, "") || undefined;
}

const warte = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Langsam scrollen: 120 px alle 60 ms bis zum Seitenende. */
async function scrollen(page: Page, maxPx = 6000) {
  await page.mouse.move(215, 600);
  for (let px = 0; px < maxPx; px += 120) {
    const ende = await page.evaluate(() => window.scrollY + window.innerHeight >= document.body.scrollHeight - 2);
    if (ende) break;
    await page.mouse.wheel(0, 120);
    await warte(60);
  }
  await warte(1000);
}

async function gate(page: Page, pw: string | undefined) {
  const feld = page.locator('input[type="password"]');
  if (!(await feld.count())) return;
  if (!pw) throw new Error("Passwort-Gate aktiv, aber kein IG_TOUR_PASSWORT");
  await feld.first().fill(pw);
  await feld.first().press("Enter");
  await page.waitForLoadState("networkidle");
}

async function main() {
  const [pfad, schluessel] = process.argv.slice(2);
  if (!pfad || !schluessel) throw new Error("Aufruf: portal-tour.ts <pfad> <schluessel>");
  const pw = passwort();
  if (!pw && !OEFFENTLICH.has(pfad)) throw new Error(`Ohne IG_TOUR_PASSWORT nur öffentliche Pfade: ${[...OEFFENTLICH].join(", ")}`);

  mkdirSync("out/raw", { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2.5,
    colorScheme: "dark",
    locale: "de-DE",
    // Playwright nimmt in CSS-Pixeln auf; eine größere size skaliert nicht, sondern füllt grau auf.
    recordVideo: { dir: "out/raw", size: { width: 430, height: 932 } },
  });
  const page = await context.newPage();
  await page.goto(BASIS + pfad, { waitUntil: "networkidle" });
  await gate(page, pw);
  await warte(1000);
  await scrollen(page);
  for (const sel of KLICKS[pfad] ?? []) {
    await page.evaluate(() => window.scrollTo({ top: 0 }));
    await page.locator(sel).first().click();
    await page.waitForLoadState("networkidle");
    await warte(1000);
    await scrollen(page, 3000);
  }
  const video = page.video();
  await context.close();
  await browser.close();
  if (!video) throw new Error("Keine Aufnahme");
  console.log(zuschnitt(await video.path(), schluessel));
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
