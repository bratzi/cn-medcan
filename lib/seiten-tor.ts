/**
 * Welche Datei unter Static Assets eine Leseseite trägt (Spec 2026-10-21, Seiten aus Assets, 3.1/3.2).
 * Ohne Next- und ohne Node-Abhängigkeit: worker.mjs bündelt diese Datei direkt.
 * `?ware=` wählt seit dem Umbau keine eigene Datei mehr; die Insel belegt die Variante im Formular vor.
 */
export const SEITEN_PRAEFIX = "/_seiten";

const FESTE = [/^\/$/, /^\/blueten$/, /^\/neu$/, /^\/jury(\/[a-z0-9-]+)*$/, /^\/reviews(\/[a-z0-9-]+)*$/];
const STRAIN = /^\/blueten\/([a-z0-9-]+)$/;
const ID = /^[A-Za-z0-9-]{1,64}$/;

export function auswahlSegment(vertreiberId: string | null, alle: boolean): string {
  if (!vertreiberId) return "standard";
  return alle ? `v-${vertreiberId}-alle` : `v-${vertreiberId}`;
}

export function seitenDatei(sprache: "de" | "en", pfad: string, suche: URLSearchParams): string | null {
  let sauber: string;
  try {
    sauber = decodeURIComponent(pfad);
  } catch {
    return null;
  }
  if (sauber.length > 1) sauber = sauber.replace(/\/+$/, "");
  const strain = STRAIN.exec(sauber);
  if (strain) {
    const roh = suche.get("vertreiber");
    const vertreiber = roh && ID.test(roh) ? roh : null;
    return `${SEITEN_PRAEFIX}/${sprache}/blueten/${strain[1]}/${auswahlSegment(vertreiber, suche.get("alle") === "1")}.html`;
  }
  if (!FESTE.some((muster) => muster.test(sauber))) return null;
  return sauber === "/" ? `${SEITEN_PRAEFIX}/${sprache}/index.html` : `${SEITEN_PRAEFIX}/${sprache}${sauber}/index.html`;
}
