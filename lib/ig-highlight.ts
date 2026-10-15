import { KARTEN_STIL, maske } from "@/lib/ig-karte";
import { SAEULEN_FARBE, type IgSaeule } from "@/lib/ig-karussell";

/** Story-Highlight-Cover (Spec 2026-10-15): Instagram zeigt nur den mittleren Kreis. */
export function igHighlightHtml(titel: string, saeule: IgSaeule, _ursprung: string): string {
  const farbe = SAEULEN_FARBE[saeule];
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${maske(titel)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mr+Dafoe&display=block">
<style>${KARTEN_STIL}
.karte{height:1920px;align-items:center;justify-content:center}
.kreis{width:640px;height:640px;border-radius:50%;border:16px solid ${farbe};display:grid;place-items:center;box-sizing:border-box}
.kreis p{font-family:"Mr Dafoe",cursive;font-size:120px;color:${farbe};margin:0;padding:0 64px;text-align:center;line-height:1.2;text-wrap:balance}
</style></head><body><main class="karte"><div class="kreis"><p>${maske(titel)}</p></div></main></body></html>`;
}
