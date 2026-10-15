export type WareProdukt = { id: string; vertreiberId: string | null; handelsname: string; aktiv: boolean };
export type WareWahl = { ok: true; strainId: string; wareGenau: boolean } | { ok: false; grund: "vertreiberFremd" | "produktFremd" };

/**
 * Ordnet die Bewertung einem Produkt zu (Spec 2026-10-15, Abschnitt 1): ohne gewählte Stärke steht das
 * erste aktive Produkt des Vertreibers als Platzhalter, `wareGenau` sagt, ob die Stärke bekannt ist.
 */
export function waehleWare(produkte: readonly WareProdukt[], vertreiberId: string, strainId: string | null): WareWahl {
  const beimVertreiber = produkte.filter((p) => p.vertreiberId === vertreiberId && p.aktiv);
  if (beimVertreiber.length === 0) return { ok: false, grund: "vertreiberFremd" };
  if (strainId) {
    const treffer = beimVertreiber.find((p) => p.id === strainId);
    return treffer ? { ok: true, strainId: treffer.id, wareGenau: true } : { ok: false, grund: "produktFremd" };
  }
  const sortiert = [...beimVertreiber].sort((a, b) => a.handelsname.localeCompare(b.handelsname, "de"));
  return { ok: true, strainId: sortiert[0].id, wareGenau: beimVertreiber.length === 1 };
}

export type ZielKandidat = { id: string; strainId: string; wareGenau: boolean };
export type ZielBewertung = { zielId: string | null; alteStrainId: string | null; strainId: string; wareGenau: boolean };

/**
 * Welche bestehende Bewertung ein Speichern überschreibt (Spec 2026-10-15). `kandidaten` sind die eigenen
 * Bewertungen derselben Sorte beim selben Vertreiber plus die auf genau dem Zielprodukt; aus der Zeit
 * „eine je Produkt“ können es mehrere sein.
 * - Die Bewertung auf genau dem Zielprodukt geht vor, sonst scheiterte das Umschreiben auf dieses Produkt
 *   an @@unique([autorId, strainId]); danach die kleinste id, damit die Wahl wiederholbar ist.
 * - Ohne gewählte Stärke bleibt eine bekannte Stärke beim Vertreiber erhalten, samt `wareGenau`.
 */
export function waehleZielBewertung(
  kandidaten: readonly ZielKandidat[],
  ware: { strainId: string; wareGenau: boolean },
  staerkeGewaehlt: boolean,
  produkteBeimVertreiber: readonly string[],
): ZielBewertung {
  const sortiert = [...kandidaten].sort((a, b) => a.id.localeCompare(b.id));
  if (!staerkeGewaehlt) {
    const bekannt = sortiert.find((k) => produkteBeimVertreiber.includes(k.strainId));
    if (bekannt) return { zielId: bekannt.id, alteStrainId: bekannt.strainId, strainId: bekannt.strainId, wareGenau: bekannt.wareGenau };
  }
  const ziel = sortiert.find((k) => k.strainId === ware.strainId) ?? sortiert[0] ?? null;
  return { zielId: ziel?.id ?? null, alteStrainId: ziel?.strainId ?? null, strainId: ware.strainId, wareGenau: ware.wareGenau };
}
