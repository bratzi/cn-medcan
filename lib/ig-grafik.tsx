import { renderToStaticMarkup } from "react-dom/server";

import { GeschmackIcon, hatTerpenIcon, TerpenIcon } from "@/components/review/AromaIcon";
import { KONTUR, LINKS, RECHTS } from "@/components/review/BlattAnzeige";
import { GESCHMACKS_KATEGORIEN, type GeschmacksKategorie } from "@/db/enums";

/**
 * Grafiken für IG-Slides (Nutzer 2026-10-16: „ohne Bild zu den Blättern weiß keiner, von welchen
 * Blättern die Rede ist“). Dieselben Zeichnungen wie auf der Website, als fertiges SVG-Markup.
 */
export type IgGrafik =
  | { art: "blaetter"; note: number }
  | { art: "icons"; namen: string[] };

/** Merkmale des Bewertungsbogens und Funktionen des Portals, im 24er-Raster wie AromaIcon. */
const MERKMAL: Record<string, string> = {
  aussehen: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  geruch: '<path d="M10 3c0 4.5-3.5 8-3.5 11.5A2.5 2.5 0 0 0 9 17h2.5"/><path d="M14.5 9.5c1.3.8 2 2 2 3.5M17.5 7c2.2 1.5 3.5 3.6 3.5 6"/>',
  geschmack: '<path d="M4 9c0 6 3.5 11 8 11s8-5 8-11Z"/><path d="M12 9v6M9 4.5 12 3l3 1.5"/>',
  konsistenz: '<path d="M7 12V5.5a1.5 1.5 0 0 1 3 0V11M10 10V4a1.5 1.5 0 0 1 3 0v7M13 10.5V5.5a1.5 1.5 0 0 1 3 0V12M16 11.5V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.5 14a1.5 1.5 0 0 1 2.4-1.8L7 13.5"/>',
  restfeuchte: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/><path d="M9 14a3 3 0 0 0 3 3"/>',
  aromakarte: '<path d="M12 3 20 8v8l-8 5-8-5V8Z"/><path d="M12 7l4 3-1.5 5h-5L8 10Z"/>',
  community: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 20c.5-3.5 2.8-5.5 5.5-5.5s5 2 5.5 5.5M14 15c2.8-.6 6 .8 7 5"/>',
  abstimmen: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 3 3 5-6"/>',
  buch: '<path d="M4 5c3-1.5 5.5-1.5 8 0v15c-2.5-1.5-5-1.5-8 0ZM12 5c2.5-1.5 5-1.5 8 0v15c-3-1.5-5.5-1.5-8 0"/>',
  blatt: `<path d="${KONTUR}"/><path d="M12 17v4.5"/>`,
};

/** Name eines Icons: Merkmal (aussehen …), Geschmack (ZITRUS …) oder Terpen (myrcen …). */
export function igIconBekannt(name: string): boolean {
  return name in MERKMAL || (GESCHMACKS_KATEGORIEN as readonly string[]).includes(name) || hatTerpenIcon(name);
}

function icon(name: string): string {
  if (name in MERKMAL)
    return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${MERKMAL[name]}</svg>`;
  if ((GESCHMACKS_KATEGORIEN as readonly string[]).includes(name))
    return renderToStaticMarkup(<GeschmackIcon geschmack={name as GeschmacksKategorie} />);
  return renderToStaticMarkup(<TerpenIcon name={name} />);
}

/** Fünf Blätter wie auf der Website: voll, halb oder leer, gefüllt in der Säulenfarbe. */
function blaetter(note: number): string {
  return [1, 2, 3, 4, 5]
    .map((b) => {
      const links = note >= b - 0.5;
      const rechts = note >= b;
      return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${LINKS}" fill="currentColor" opacity="${links ? 1 : 0}"/><path d="${RECHTS}" fill="currentColor" opacity="${rechts ? 1 : 0}"/><path d="${KONTUR}" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linejoin="round"/><path d="M12 17v4.5" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"/></svg>`;
    })
    .join("");
}

export function igGrafikHtml(g: IgGrafik | undefined, beschriftung?: (name: string) => string): string {
  if (!g) return "";
  if (g.art === "blaetter") return `<div class="grafik blaetter">${blaetter(g.note)}</div>`;
  return `<div class="grafik icons">${g.namen
    .map((n) => `<figure>${icon(n)}${beschriftung ? `<figcaption>${beschriftung(n)}</figcaption>` : ""}</figure>`)
    .join("")}</div>`;
}
