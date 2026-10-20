import type { GeschmacksKategorie } from "@/db/enums";
import { hwgTreffer } from "@/lib/hwg-filter";
import type { IgReview } from "@/lib/ig-feed";
import { de } from "@/lib/i18n/de";

/**
 * Instagram-Karte als eigenständiges HTML (Spec 2026-10-14 IG-Karten): Cowork öffnet sie und macht einen
 * Screenshot 1080 × 1350. Kein PNG im Worker (10 ms CPU), keine Wirkung (HWG). Farben sind die festen
 * Gegenstücke der dunklen Tokens, weil die Karte ohne globals.css läuft; Abstände im 8px-Raster.
 */
const ZITAT_MAX = 140;

/**
 * Strenger als der Kommentar-Filter: Instagram ist Werbung im Sinne des HWG. Alles, was nach Wirkung,
 * Rausch, Konsum oder Beschwerden klingt, nimmt das Zitat ganz heraus (Live-Probe 2026-10-14: „ballert“)
 * und sperrt Captions des Themen-Agenten (`igCaptionPruefen`).
 */
/**
 * Abschluss aller IG-Medien (Nutzer 2026-10-16): es gibt keinen Link in der Bio; Interessenten
 * schreiben per DM und bekommen Vorabzugang.
 */
// Seit 2026-10-20 (Nutzer) steht die Webseite in der Bio; den Zugang (Passwort-Gate) gibt es per DM.
export const IG_CTA = "Zugang per DM";

export const IG_SPERRE =
  /ballert|knallt|bal+ern|\bhigh\b|stoned|breit\b|wirk|rausch|rauch|kiff|dröhn|entspann|beruhig|schlaf|schmerz|angst|\bdaily\b|dosis|dosier|\bthc\b|\bcbd\b|hilft|lindert|gegen\s+(stress|schmerz|angst|übelkeit)|stimmungs|euphor|therap|heil/i;

export function kartenZitat(notiz: string | null): string | null {
  if (!notiz) return null;
  const text = notiz.replace(/\s+/g, " ").trim();
  if (!text || hwgTreffer(text) || IG_SPERRE.test(text)) return null;
  if (text.length <= ZITAT_MAX) return text;
  const schnitt = text.slice(0, ZITAT_MAX - 1);
  const grenze = schnitt.lastIndexOf(" ");
  return `${(grenze > 0 ? schnitt.slice(0, grenze) : schnitt).replace(/[\s,.;:–-]+$/, "")}…`;
}

export function maske(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Grundgerüst aller Instagram-Karten: Fläche, Farbwelt, Logo, Fußzeile. */
export const KARTEN_STIL = `
html,body{margin:0;background:#0d1210}
.karte{width:1080px;height:1350px;box-sizing:border-box;padding:96px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:40px;
background:radial-gradient(120% 80% at 50% 0%,#17221d 0%,#0d1210 70%);color:#e9efec;font-family:Newsreader,Georgia,serif}
.logo{position:relative;flex:none;width:256px;aspect-ratio:1726/1242}
.logo i{position:absolute;inset:0;-webkit-mask:var(--m) center/contain no-repeat;mask:var(--m) center/contain no-repeat}
.fuss{margin:auto 0 0;font-size:32px;color:#93a39b;letter-spacing:0.08em}`;

/** Pinsel-Logo wie auf der Website: Schrift in Blattgrün, „of“ in Kopierstift-Violett. */
export function logoHtml(ursprung: string): string {
  return `<div class="logo" role="img" aria-label="Book of Terpz"><i style="--m:url(${ursprung}/marke/pinsel.webp);background:#3fbf94"></i><i style="--m:url(${ursprung}/marke/pinsel-of.webp);background:#b48cf0"></i></div>`;
}

const note = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function igKarteHtml(r: IgReview, ursprung: string): string {
  const aromen = r.aromen.map((a) => de.label.geschmack[a as GeschmacksKategorie] ?? a).map(maske);
  const zitat = kartenZitat(r.notiz);
  const zeilen = [
    r.vertreiber ? `<p class="vertreiber">${maske(r.vertreiber)}</p>` : "",
    r.gesamtnote !== null ? `<p class="note"><span>${note(r.gesamtnote)}</span> von 5 Blättern</p>` : "",
    aromen.length ? `<p class="aromen">${aromen.join(" · ")}</p>` : "",
    zitat ? `<blockquote>„${maske(zitat)}“</blockquote>` : "",
    r.charge ? `<p class="charge">Charge ${maske(r.charge)}</p>` : "",
  ].join("");
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>${maske(r.bluete)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mr+Dafoe&family=Newsreader:ital,opsz,wght@0,6..72,200;0,6..72,400;1,6..72,400&display=block">
<style>${KARTEN_STIL}
h1{font-weight:200;font-size:96px;line-height:1.05;margin:24px 0 0;letter-spacing:-0.01em;text-wrap:balance}
.vertreiber{font-size:40px;color:#93a39b;margin:-16px 0 0}
.note{font-size:40px;color:#93a39b;margin:0;display:flex;align-items:baseline;justify-content:center;gap:24px}
.note span{font-family:"Mr Dafoe",cursive;font-size:160px;color:#3fbf94;line-height:1}
.aromen{font-size:40px;letter-spacing:0.08em;text-transform:uppercase;margin:0}
blockquote{margin:0;padding:32px 0 0;border-top:4px solid #3fbf94;max-width:800px;font-style:italic;font-size:40px;line-height:1.4;text-wrap:pretty}
.charge{font-size:32px;color:#93a39b;margin:0}
</style></head><body><main class="karte">
${logoHtml(ursprung)}
<h1>${maske(r.bluete)}</h1>${zeilen}
<p class="fuss">Bewertung im Book of Terpz · ${IG_CTA}</p>
</main></body></html>`;
}
