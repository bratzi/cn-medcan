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

export function kartenZitat(notiz: string | null): string | null {
  if (!notiz) return null;
  const text = notiz.replace(/\s+/g, " ").trim();
  if (!text || hwgTreffer(text)) return null;
  if (text.length <= ZITAT_MAX) return text;
  const schnitt = text.slice(0, ZITAT_MAX - 1);
  const grenze = schnitt.lastIndexOf(" ");
  return `${(grenze > 0 ? schnitt.slice(0, grenze) : schnitt).replace(/[\s,.;:–-]+$/, "")}…`;
}

function maske(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
<style>
html,body{margin:0;background:#0d1210}
.karte{width:1080px;height:1350px;box-sizing:border-box;padding:96px;display:flex;flex-direction:column;gap:40px;
background:radial-gradient(120% 80% at 50% 0%,#17221d 0%,#0d1210 70%);color:#e9efec;font-family:Newsreader,Georgia,serif}
.logo{width:240px;height:auto}
h1{font-weight:200;font-size:96px;line-height:1.05;margin:24px 0 0;letter-spacing:-0.01em;text-wrap:balance}
.vertreiber{font-size:40px;color:#93a39b;margin:-16px 0 0}
.note{font-size:40px;color:#93a39b;margin:0;display:flex;align-items:baseline;gap:24px}
.note span{font-family:"Mr Dafoe",cursive;font-size:160px;color:#3fbf94;line-height:1}
.aromen{font-size:40px;letter-spacing:0.08em;text-transform:uppercase;margin:0}
blockquote{margin:0;padding-left:32px;border-left:4px solid #3fbf94;font-style:italic;font-size:40px;line-height:1.4;text-wrap:pretty}
.charge{font-size:32px;color:#93a39b;margin:0}
.fuss{margin:auto 0 0;font-size:32px;color:#93a39b;letter-spacing:0.08em}
</style></head><body><main class="karte">
<img class="logo" src="${ursprung}/marke/pinsel.webp" alt="Book of Terpz">
<h1>${maske(r.bluete)}</h1>${zeilen}
<p class="fuss">Bewertung im Book of Terpz · Link in Bio</p>
</main></body></html>`;
}
