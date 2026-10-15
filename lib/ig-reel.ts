import { hwgTreffer } from "@/lib/hwg-filter";
import { IG_SPERRE } from "@/lib/ig-karte";
import { SAEULEN_FARBE, type IgSaeule } from "@/lib/ig-karussell";

/** Wochen-Reel (Spec 2026-10-15 Produktmarke): Daten und Prüfung; gerendert wird in video/ mit Remotion. */
export type IgReelSzene = { kicker?: string; titel: string; text?: string; sekunden: number };
export type IgReel = { saeule: IgSaeule; schluessel: string; szenen: IgReelSzene[] };

export function reelPruefen(r: IgReel): string[] {
  const fehler: string[] = [];
  if (!/^[a-z0-9-]{2,40}$/.test(r.schluessel)) fehler.push("schluessel: nur a-z, 0-9 und Bindestrich");
  if (!(r.saeule in SAEULEN_FARBE)) fehler.push("saeule unbekannt");
  if (r.szenen.length < 3 || r.szenen.length > 8) fehler.push(`Szenen: ${r.szenen.length} statt 3 bis 8`);
  const dauer = r.szenen.reduce((s, z) => s + z.sekunden, 0);
  if (dauer < 15 || dauer > 30) fehler.push(`Dauer: ${dauer} s statt 15 bis 30`);
  r.szenen.forEach((z, i) => {
    if (z.sekunden < 2 || z.sekunden > 6) fehler.push(`Szene ${i + 1}: 2 bis 6 Sekunden`);
    if (z.titel.length > 40 || (z.text ?? "").length > 120) fehler.push(`Szene ${i + 1}: zu lang`);
    const alles = [z.kicker, z.titel, z.text].filter(Boolean).join(" ");
    if (hwgTreffer(alles) || IG_SPERRE.test(alles)) fehler.push(`Szene ${i + 1}: HWG/Sperrwort`);
  });
  return fehler;
}
