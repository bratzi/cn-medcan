/**
 * Welche Datei unter Static Assets eine Leseseite trägt (Spec 2026-10-21, Seiten aus Assets, 3.1/3.2;
 * seit 2026-10-22 eine Datei je Strain, Plan 2026-10-22-eine-seite-je-strain).
 * Ohne Next- und ohne Node-Abhängigkeit: worker.mjs bündelt diese Datei direkt.
 * Keine Query wählt eine Datei; `?ware=` belegt nur die Variante im Formular vor (Insel).
 */
export const SEITEN_PRAEFIX = "/_seiten";

const FESTE = [/^\/$/, /^\/blueten$/, /^\/neu$/, /^\/jury(\/[a-z0-9-]+)*$/, /^\/reviews(\/[a-z0-9-]+)*$/];
const STRAIN = /^\/blueten\/([a-z0-9-]+)$/;
/** Varianten-Segment bis 2026-10-22: "standard", "v-<id>", "v-<id>-alle". */
const ALTE_VARIANTE = /^\/blueten\/([a-z0-9-]+)\/(standard|v-[A-Za-z0-9-]+)$/;
/** Seitenzustand bis 2026-10-22; heute nur noch Weiterleitung. */
const ALTE_PARAMETER = ["vertreiber", "alle"];

export function seitenDatei(sprache: "de" | "en", pfad: string, _suche: URLSearchParams): string | null {
  let sauber: string;
  try {
    sauber = decodeURIComponent(pfad);
  } catch {
    return null;
  }
  if (sauber.length > 1) sauber = sauber.replace(/\/+$/, "");
  if (!STRAIN.test(sauber) && !FESTE.some((muster) => muster.test(sauber))) return null;
  return sauber === "/" ? `${SEITEN_PRAEFIX}/${sprache}/index.html` : `${SEITEN_PRAEFIX}/${sprache}${sauber}/index.html`;
}

/**
 * Ziel für alte Strain-Adressen mit Vertreiber als Seitenzustand (`/blueten/<slug>/<variante>`,
 * `?vertreiber=`, `?alle=`): die eine Strain-Seite, übrige Query bleibt. Sonst null. Nur Regex, kein I/O.
 */
export function alteStrainAdresse(pfad: string, suche: URLSearchParams): string | null {
  const variante = ALTE_VARIANTE.exec(pfad);
  const strain = variante ? null : STRAIN.exec(pfad);
  const slug = variante?.[1] ?? strain?.[1];
  if (!slug) return null;
  if (!variante && !ALTE_PARAMETER.some((name) => suche.has(name))) return null;
  const rest = new URLSearchParams(suche);
  for (const name of ALTE_PARAMETER) rest.delete(name);
  const text = rest.toString();
  return `/blueten/${slug}${text ? `?${text}` : ""}`;
}
