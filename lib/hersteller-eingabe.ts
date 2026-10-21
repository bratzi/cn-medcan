import { sichererLogoPfad } from "@/lib/marken";

export type HerstellerDaten = { id: string; name: string; website: string | null; logoPfad: string | null };

export type HerstellerPruefung = { ok: true; daten: HerstellerDaten } | { ok: false; fehler: string };

const MAX_NAME = 120;
const MAX_WEBSITE = 300;

function feld(daten: FormData, name: string): string {
  const wert = daten.get(name);
  return typeof wert === "string" ? wert.trim() : "";
}

/**
 * Prüft die Pflege eines Unternehmens in admin/hersteller (Spec 2026-10-21, 3): Name Pflicht,
 * Website nur http(s), Logo nur als eigene Datei unter /marken/ (sichererLogoPfad). Leere Felder: null.
 */
export function herstellerPruefen(daten: FormData): HerstellerPruefung {
  const id = feld(daten, "id");
  const name = feld(daten, "name");
  const website = feld(daten, "website");
  const logo = feld(daten, "logoPfad");
  if (!id) return { ok: false, fehler: "Unternehmen fehlt." };
  if (!name) return { ok: false, fehler: "Der Name fehlt." };
  if (name.length > MAX_NAME) return { ok: false, fehler: `Der Name ist länger als ${MAX_NAME} Zeichen.` };
  if (website) {
    let url: URL | null = null;
    try {
      url = new URL(website);
    } catch {
      url = null;
    }
    if (!url || (url.protocol !== "https:" && url.protocol !== "http:") || website.length > MAX_WEBSITE) {
      return { ok: false, fehler: "Die Website muss mit https:// beginnen." };
    }
  }
  const logoPfad = logo ? sichererLogoPfad(logo) : null;
  if (logo && !logoPfad) {
    return { ok: false, fehler: "Das Logo muss eine Datei unter /marken/ sein (SVG, PNG oder WebP)." };
  }
  return { ok: true, daten: { id, name, website: website || null, logoPfad } };
}
