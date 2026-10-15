import { hwgTreffer } from "@/lib/hwg-filter";
import { IG_SPERRE, KARTEN_STIL, logoHtml, maske } from "@/lib/ig-karte";

/**
 * Karussell-Vorlagen für Instagram (Spec 2026-10-15 Produktmarke): Cover, Inhalt, CTA im Stil der
 * Themenkarte. Jede Säule hat eine Akzentfarbe, damit das Profilraster ruhig und wiedererkennbar wirkt.
 */
export type IgSaeule = "transparenz" | "mitbestimmen" | "wissen" | "portal";

export const SAEULEN_FARBE: Record<IgSaeule, string> = {
  transparenz: "#3fbf94",
  mitbestimmen: "#b48cf0",
  wissen: "#f2d129",
  portal: "#c98a3e",
};

export type IgSlide =
  | { typ: "cover"; kicker: string; titel: string }
  | { typ: "inhalt"; titel: string; text?: string; punkte?: string[] }
  | { typ: "cta"; titel: string; text: string };

export type IgKarussell = { saeule: IgSaeule; schluessel: string; slides: IgSlide[] };

const TITEL_MAX = 60;
const KICKER_MAX = 30;
const TEXT_MAX = 220;
const PUNKT_MAX = 60;

function texte(s: IgSlide): string[] {
  if (s.typ === "cover") return [s.kicker, s.titel];
  if (s.typ === "cta") return [s.titel, s.text];
  return [s.titel, s.text ?? "", ...(s.punkte ?? [])];
}

export function karussellPruefen(k: IgKarussell): string[] {
  const fehler: string[] = [];
  if (!(k.saeule in SAEULEN_FARBE)) fehler.push("saeule unbekannt");
  if (!/^[a-z0-9-]{2,40}$/.test(k.schluessel)) fehler.push("schluessel: nur a-z, 0-9 und Bindestrich, 2 bis 40 Zeichen");
  const n = k.slides.length;
  if (n < 3 || n > 10) fehler.push(`Slides: ${n} statt 3 bis 10`);
  if (k.slides[0]?.typ !== "cover") fehler.push("erste Slide muss Cover sein");
  if (k.slides[n - 1]?.typ !== "cta") fehler.push("letzte Slide muss CTA sein");
  k.slides.forEach((s, i) => {
    if (s.titel.length > TITEL_MAX) fehler.push(`Slide ${i + 1}: Titel länger als ${TITEL_MAX}`);
    if (s.typ !== "cover" && (s.text ?? "").length > TEXT_MAX) fehler.push(`Slide ${i + 1}: Text länger als ${TEXT_MAX}`);
    if (s.typ === "inhalt" && s.punkte && (s.punkte.length > 4 || s.punkte.some((p) => p.length > PUNKT_MAX)))
      fehler.push(`Slide ${i + 1}: höchstens 4 Punkte zu je ${PUNKT_MAX}`);
    if (s.typ === "cta" && /link in bio/i.test(s.text ?? "")) fehler.push(`Slide ${i + 1}: „Link in Bio“ steht schon fest auf der CTA`);
    const alles = texte(s).join(" ");
    // Handwerk (docs/instagram/handwerk.md): kurzer Kicker, ein Strich pro Slide liest sich nicht generiert.
    if (s.typ === "cover" && s.kicker.length > KICKER_MAX) fehler.push(`Slide ${i + 1}: Kicker länger als ${KICKER_MAX}`);
    if ((alles.match(/\s[–—]\s|—/g) ?? []).length > 1) fehler.push(`Slide ${i + 1}: mehr als ein Gedankenstrich`);
    const sperre = IG_SPERRE.exec(alles);
    if (hwgTreffer(alles)) fehler.push(`Slide ${i + 1}: HWG-Filter schlägt an`);
    if (sperre) fehler.push(`Slide ${i + 1}: Sperrwort ${sperre[0]}`);
  });
  return fehler;
}

export function karussellMarke(k: IgKarussell): string {
  return `bot-k-${k.saeule}-${k.schluessel}`;
}

function inhalt(s: IgSlide): string {
  if (s.typ === "cover") return `<p class="kicker">${maske(s.kicker)}</p><h1 class="gross">${maske(s.titel)}</h1>`;
  if (s.typ === "cta") return `<h1>${maske(s.titel)}</h1><p class="text">${maske(s.text)}</p><p class="cta">Link in Bio</p>`;
  const punkte = s.punkte?.length ? `<ul>${s.punkte.map((p) => `<li>${maske(p)}</li>`).join("")}</ul>` : "";
  return `<h1>${maske(s.titel)}</h1>${s.text ? `<p class="text">${maske(s.text)}</p>` : ""}${punkte}`;
}

export function igSlideHtml(k: IgKarussell, index: number, ursprung: string): string {
  const farbe = SAEULEN_FARBE[k.saeule];
  const s = k.slides[index];
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>${maske(s.titel)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mr+Dafoe&family=Newsreader:ital,opsz,wght@0,6..72,200;0,6..72,400;1,6..72,400&display=block">
<style>${KARTEN_STIL}
.karte{border-top:16px solid ${farbe}}
.kicker{font-family:"Mr Dafoe",cursive;font-size:80px;color:${farbe};margin:auto 0 0;line-height:1}
h1,.text{max-width:888px}
h1{font-weight:200;font-size:88px;line-height:1.05;margin:0;letter-spacing:-0.01em;text-wrap:balance}
h1:not(.gross){margin-top:auto}
h1.gross{font-size:120px;margin-bottom:auto}
.text{font-size:44px;line-height:1.4;margin:0;text-wrap:pretty}
ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;align-items:center;gap:32px}
li{font-size:40px}
li::before{content:"";display:block;width:48px;height:4px;margin:0 auto 16px;background:${farbe}}
.cta{font-family:"Mr Dafoe",cursive;font-size:96px;color:${farbe};margin:0;padding:0 16px}
.fuss{display:flex;justify-content:center;gap:24px}
</style></head><body><main class="karte">
${logoHtml(ursprung)}
${inhalt(s)}
<p class="fuss"><span>Book of Terpz</span><span aria-hidden="true">·</span><span>${index + 1} / ${k.slides.length}</span></p>
</main></body></html>`;
}
