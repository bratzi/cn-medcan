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
