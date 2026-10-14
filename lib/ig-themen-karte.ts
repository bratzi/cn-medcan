import { KARTEN_STIL, logoHtml, maske } from "@/lib/ig-karte";

/** Themen-Post für Instagram (Spec 2026-10-14 Themen-Agent): gleicher Stil wie die Bewertungskarte. */
export type IgThema = {
  art: "terpen" | "feature" | "mission" | "schema";
  kicker: string;
  titel: string;
  text: string;
  punkte: string[];
  farbe?: string;
};

const BLATT = "#3fbf94";

export function igThemenKarteHtml(t: IgThema, ursprung: string): string {
  // Nur echte Hex-Farben: der Wert landet im <style>.
  const farbe = t.farbe && /^#[0-9a-f]{6}$/i.test(t.farbe) ? t.farbe : BLATT;
  const punkte = t.punkte.length ? `<ul>${t.punkte.slice(0, 4).map((p) => `<li>${maske(p)}</li>`).join("")}</ul>` : "";
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>${maske(t.titel)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mr+Dafoe&family=Newsreader:ital,opsz,wght@0,6..72,200;0,6..72,400;1,6..72,400&display=block">
<style>${KARTEN_STIL}
.kicker{font-family:"Mr Dafoe",cursive;font-size:72px;color:${farbe};margin:24px 0 0;line-height:1}
h1{font-weight:200;font-size:104px;line-height:1.05;margin:0;letter-spacing:-0.01em;text-wrap:balance}
.text{font-size:44px;line-height:1.4;margin:0;text-wrap:pretty}
ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:16px}
li{font-size:36px;color:#93a39b;padding-left:32px;border-left:4px solid ${farbe}}
</style></head><body><main class="karte">
${logoHtml(ursprung)}
<p class="kicker">${maske(t.kicker)}</p><h1>${maske(t.titel)}</h1><p class="text">${maske(t.text)}</p>${punkte}
<p class="fuss">Book of Terpz · Link in Bio</p>
</main></body></html>`;
}
