export type HerstellerZeile = {
  id: string;
  name: string;
  land: string | null;
  rolle: string;
  _count: { hergestellt: number };
};

const schluessel = (name: string) => name.trim().toLowerCase();

/**
 * Hersteller-Facette des Katalogs. Gleichnamige Unternehmen (eindeutig ist nur Name plus Rolle) wären im
 * Filter nicht zu unterscheiden; sie bekommen das Land, ohne Land die Rolle in Klammern.
 */
export function herstellerFacette(liste: readonly HerstellerZeile[]): { id: string; name: string; anzahl: number }[] {
  const zaehler = new Map<string, number>();
  for (const h of liste) zaehler.set(schluessel(h.name), (zaehler.get(schluessel(h.name)) ?? 0) + 1);
  return liste.map((h) => {
    const name = h.name.trim();
    const doppelt = (zaehler.get(schluessel(h.name)) ?? 0) > 1;
    return { id: h.id, name: doppelt ? `${name} (${h.land ?? h.rolle})` : name, anzahl: h._count.hergestellt };
  });
}
