import { hwgTreffer } from "@/lib/hwg-filter";
import { igGrafikHtml, igIconBekannt, type IgGrafik } from "@/lib/ig-grafik";
import { IG_CTA, IG_SPERRE, KARTEN_STIL, logoHtml, maske } from "@/lib/ig-karte";

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
  | { typ: "cover"; kicker: string; titel: string; grafik?: IgGrafik }
  | { typ: "inhalt"; titel: string; text?: string; punkte?: string[]; grafik?: IgGrafik }
  | { typ: "cta"; titel: string; text: string; grafik?: IgGrafik };

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
    if (s.typ === "inhalt" && s.punkte && (s.punkte.length > 5 || s.punkte.some((p) => p.length > PUNKT_MAX)))
      fehler.push(`Slide ${i + 1}: höchstens 5 Punkte zu je ${PUNKT_MAX}`);
    if (/link in (der )?bio/i.test(texte(s).join(" "))) fehler.push(`Slide ${i + 1}: es gibt keinen Link in der Bio`);
    if (s.typ === "cta" && /DM/.test(s.text ?? "")) fehler.push(`Slide ${i + 1}: „${IG_CTA}“ steht schon fest auf der CTA`);
    // Jede Slide zeigt, wovon sie spricht (Nutzer 2026-10-16): Blätter oder Icons.
    if (!s.grafik) fehler.push(`Slide ${i + 1}: Grafik fehlt (Blätter oder Icons)`);
    else if (s.grafik.art === "blaetter" && !(s.grafik.note >= 0 && s.grafik.note <= 5)) fehler.push(`Slide ${i + 1}: Blätter nur 0 bis 5`);
    else if (s.grafik.art === "icons") {
      if (s.grafik.namen.length < 1 || s.grafik.namen.length > 5) fehler.push(`Slide ${i + 1}: 1 bis 5 Icons`);
      const fremd = s.grafik.namen.filter((n) => !igIconBekannt(n));
      if (fremd.length) fehler.push(`Slide ${i + 1}: Icon unbekannt: ${fremd.join(", ")}`);
    }
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
  const grafik = igGrafikHtml(s.grafik);
  if (s.typ === "cover") return `<p class="kicker">${maske(s.kicker)}</p><h1 class="gross">${maske(s.titel)}</h1>${grafik}`;
  if (s.typ === "cta") return `<h1>${maske(s.titel)}</h1>${grafik}<p class="text">${maske(s.text)}</p><p class="cta">${IG_CTA}</p>`;
  // Gleich viele Icons wie Punkte: jedes Icon steht über seinem Punkt.
  const jePunkt = s.grafik?.art === "icons" && s.punkte?.length === s.grafik.namen.length;
  if (jePunkt && s.grafik?.art === "icons") {
    const namen = s.grafik.namen;
    const zellen = s.punkte!.map((p, i) => `<figure>${igGrafikHtml({ art: "icons", namen: [namen[i]] }).replace(/^<div class="grafik icons">|<\/div>$/g, "")}<figcaption>${maske(p)}</figcaption></figure>`);
    return `<h1>${maske(s.titel)}</h1>${s.text ? `<p class="text">${maske(s.text)}</p>` : ""}<div class="grafik icons beschriftet">${zellen.join("")}</div>`;
  }
  const punkte = s.punkte?.length ? `<ul>${s.punkte.map((p) => `<li>${maske(p)}</li>`).join("")}</ul>` : "";
  return `<h1>${maske(s.titel)}</h1>${grafik}${s.text ? `<p class="text">${maske(s.text)}</p>` : ""}${punkte}`;
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
.text{font-size:44px;line-height:1.4;margin:0;text-wrap:balance}
ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;align-items:center;gap:32px}
li{font-size:40px}
li::before{content:"";display:block;width:48px;height:4px;margin:0 auto 16px;background:${farbe}}
.cta{font-family:"Mr Dafoe",cursive;font-size:96px;color:${farbe};margin:0;padding:0 16px}
.fuss{display:flex;justify-content:center;gap:24px}
.grafik{display:flex;justify-content:center;align-items:flex-start;color:${farbe}}
.blaetter{gap:16px}.blaetter svg{width:144px;height:144px}
.icons{gap:56px}.icons svg{width:120px;height:120px}
.icons figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:20px}
.icons figure>svg{display:block}
.beschriftet{flex-wrap:wrap;gap:48px 64px;max-width:900px}.beschriftet svg{width:104px;height:104px}
.beschriftet figcaption{font-size:38px;color:#e9efec}
</style></head><body><main class="karte">
${logoHtml(ursprung)}
${inhalt(s)}
<p class="fuss"><span>Book of Terpz</span><span aria-hidden="true">·</span><span>${index + 1} / ${k.slides.length}</span></p>
</main></body></html>`;
}
