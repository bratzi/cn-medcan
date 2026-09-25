/**
 * Ids fuer Katalogsaetze nach derselben Regel wie scripts/stamm/sql-erzeugen.py.
 *
 * Der Import schreibt `ON CONFLICT(id) DO UPDATE` und faengt nur Konflikte
 * auf der Id ab. Legt die Freigabe eines Vorschlags eine Bluete oder einen
 * Hersteller mit zufaelliger Id an, bricht ein spaeterer Import derselben
 * Bluete am Unique-Index (`strains.slug`, `unternehmen(name, rolle)`) ab.
 * Mit gleicher Id aktualisiert er stattdessen. Namensraum und Praefixe
 * ("s:", "u:") muessen deshalb exakt dem Skript entsprechen.
 */

const NAMENSRAUM = "6f1c2b8e-2d8a-4f4e-9a57-5b7c1e2d3a40";

const UMLAUTE: ReadonlyArray<[string, string]> = [
  ["ä", "ae"],
  ["ö", "oe"],
  ["ü", "ue"],
  ["ß", "ss"],
];

/** slug() aus dem Importskript: klein, Umlaute ausgeschrieben, sonst Bindestriche. */
export function slugAusName(name: string): string {
  let t = name.toLowerCase();
  for (const [a, b] of UMLAUTE) t = t.replaceAll(a, b);
  return t.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Schluessel aus firma(): Zusaetze wie GmbH/Pharma entfernt; "unbekannt" zaehlt nicht. */
export function unternehmensSchluessel(name: string): string | null {
  const klein = name.trim().toLowerCase();
  if (!klein || klein.startsWith("unbekannt") || klein.startsWith("nicht genannt")) return null;
  return klein.replace(/\s+(gmbh|pharma|pharmaceuticals|international)\b/g, "").trim() || null;
}

function hexZuBytes(hex: string): Uint8Array {
  const rein = hex.replaceAll("-", "");
  const bytes = new Uint8Array(rein.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(rein.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/** RFC 4122 Version 5 (SHA-1), wie Pythons uuid.uuid5. crypto.subtle gibt es in Workers und Node. */
async function uuid5(name: string): Promise<string> {
  const ns = hexZuBytes(NAMENSRAUM);
  const text = new TextEncoder().encode(name);
  const eingabe = new Uint8Array(ns.length + text.length);
  eingabe.set(ns);
  eingabe.set(text, ns.length);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-1", eingabe)).slice(0, 16);
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function strainIdAusSlug(slug: string): Promise<string> {
  return uuid5(`s:${slug}`);
}

export function unternehmensIdAusSchluessel(schluessel: string): Promise<string> {
  return uuid5(`u:${schluessel}`);
}
