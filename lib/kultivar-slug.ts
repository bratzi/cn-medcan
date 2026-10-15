import { slugAusName } from "@/lib/stamm-id";

/** Eindeutige Slugs je Kultivar; Reihenfolge nach id, damit der Lauf wiederholbar ist. */
export function kultivarSlugs(kultivare: readonly { id: string; name: string }[]): Map<string, string> {
  const vergeben = new Set<string>();
  const ergebnis = new Map<string, string>();
  for (const k of [...kultivare].sort((a, b) => a.id.localeCompare(b.id))) {
    const basis = slugAusName(k.name);
    let slug = basis;
    for (let n = 2; vergeben.has(slug); n++) slug = `${basis}-${n}`;
    vergeben.add(slug);
    ergebnis.set(k.id, slug);
  }
  return ergebnis;
}

/** Slug für einen neu angelegten Kultivar: Basis aus dem Namen, bei Kollision `-2`, `-3` … wie `kultivarSlugs`. */
export function freierKultivarSlug(name: string, vorhandene: Iterable<string>): string {
  const vergeben = new Set(vorhandene);
  const basis = slugAusName(name);
  let slug = basis;
  for (let n = 2; vergeben.has(slug); n++) slug = `${basis}-${n}`;
  return slug;
}
