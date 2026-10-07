import { GESCHMACKS_KATEGORIEN, istGeschmacksKategorie, type GeschmacksKategorie } from "@/db/enums";
import { bewertungsGewicht, profilAus, type EigeneBewertung, type SortenAroma } from "@/lib/empfehlung";
import type { AuswertungsZeile, Auswertungen, BewertungsKurz, ProfilWerte, Schnitte } from "@/lib/profil-typen";
import { berechneGesamtnote } from "@/lib/query/bewertung";

/**
 * Profil und Dashboard, Stufe 1 (Spec 2026-10-07). Reine Rechnung: das Netz
 * aus dem Empfehlungsprofil (lib/empfehlung.ts), die Auswertungen aus den
 * eigenen Bewertungen. Nur Aroma im Netz, nie Wirkung (HWG).
 */

/** So lange gilt der gespeicherte Stand; danach rechnet /profil neu (neue Community-Werte). */
export const PROFIL_GUELTIG_MS = 24 * 60 * 60 * 1000;
/** Ab so vielen gewichteten Bewertungen gilt das Netz als aussagekräftig. */
export const PROFIL_AUSSAGEKRAEFTIG_AB = 3;

const TERPENE_POSITIV = 8;
const TERPENE_NEGATIV = 3;

export function profilVeraltet(berechnetAm: Date | null | undefined, jetzt: number): boolean {
  return !berechnetAm || jetzt - berechnetAm.getTime() > PROFIL_GUELTIG_MS;
}

/** Altbewertungen vor v2 haben keine Gesamtnote: dann das Mittel der fünf Noten. */
export function noteOderErsatz(r: {
  gesamtnote: number | null;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
}): number {
  return r.gesamtnote ?? berechneGesamtnote(r);
}

const zwei = (x: number) => Math.round(x * 100) / 100 + 0;
const eine = (x: number) => Math.round(x * 10) / 10 + 0;

function leererGeschmack(): Record<GeschmacksKategorie, number> {
  return Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])) as Record<GeschmacksKategorie, number>;
}

export function leereProfilWerte(): ProfilWerte {
  return { geschmack: leererGeschmack(), terpene: [], anzahl: 0, gewichtet: 0 };
}

/** Netz und Terpenliste aus dem Profilvektor, je auf das stärkste |Gewicht| normiert (Spec 4.2). */
export function profilAnzeige(bewertungen: readonly EigeneBewertung[], sorten: readonly SortenAroma[]): ProfilWerte {
  const { profil } = profilAus(bewertungen, sorten);
  const geschmack = leererGeschmack();
  let maxG = 0;
  for (const k of GESCHMACKS_KATEGORIEN) maxG = Math.max(maxG, Math.abs(profil.get(`g:${k}`) ?? 0));
  if (maxG > 0) for (const k of GESCHMACKS_KATEGORIEN) geschmack[k] = zwei((profil.get(`g:${k}`) ?? 0) / maxG);

  const terpenWerte: { name: string; wert: number }[] = [];
  for (const [k, x] of profil) if (k.startsWith("t:") && x !== 0) terpenWerte.push({ name: k.slice(2), wert: x });
  const maxT = Math.max(0, ...terpenWerte.map((t) => Math.abs(t.wert)));
  const normiert = maxT > 0 ? terpenWerte.map((t) => ({ name: t.name, wert: zwei(t.wert / maxT) })) : [];
  const nachName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "de");
  const positiv = normiert.filter((t) => t.wert > 0).sort((a, b) => b.wert - a.wert || nachName(a, b)).slice(0, TERPENE_POSITIV);
  const negativ = normiert.filter((t) => t.wert < 0).sort((a, b) => a.wert - b.wert || nachName(a, b)).slice(0, TERPENE_NEGATIV);

  return {
    geschmack,
    terpene: [...positiv, ...negativ],
    anzahl: bewertungen.length,
    gewichtet: bewertungen.filter((b) => bewertungsGewicht(b.gesamtnote) !== 0).length,
  };
}

/** Spalten für `nutzer_profil`. */
export function profilDaten(w: ProfilWerte) {
  return { geschmack: JSON.stringify(w.geschmack), terpene: JSON.stringify(w.terpene), anzahl: w.anzahl, gewichtet: w.gewichtet };
}

function json(roh: string): unknown {
  try {
    return JSON.parse(roh);
  } catch {
    return undefined;
  }
}

/** Liest `nutzer_profil` und prüft jede Angabe; Unbekanntes und Kaputtes fällt auf 0 bzw. weg. */
export function profilAusDaten(z: { geschmack: string; terpene: string; anzahl: number; gewichtet: number }): ProfilWerte {
  const geschmack = leererGeschmack();
  const g = json(z.geschmack);
  if (g && typeof g === "object" && !Array.isArray(g)) {
    for (const [k, v] of Object.entries(g)) {
      if (istGeschmacksKategorie(k) && typeof v === "number" && Number.isFinite(v)) geschmack[k] = Math.max(-1, Math.min(1, v));
    }
  }
  const t = json(z.terpene);
  const terpene = Array.isArray(t)
    ? t.filter(
        (x): x is { name: string; wert: number } =>
          !!x && typeof x.name === "string" && typeof x.wert === "number" && Number.isFinite(x.wert),
      ).map((x) => ({ name: x.name, wert: x.wert }))
    : [];
  return { geschmack, terpene, anzahl: z.anzahl, gewichtet: z.gewichtet };
}

/** Top, Flop, Vergleich und Schnitte je Aufruf (Spec 4.5); reine Arithmetik. */
export function auswertungen(zeilen: readonly AuswertungsZeile[]): Auswertungen {
  const mitNote = zeilen.map((z) => ({ z, note: noteOderErsatz(z) }));
  const sortiert = [...mitNote].sort((a, b) => b.note - a.note || b.z.erstelltAm.getTime() - a.z.erstelltAm.getTime());
  const kurz = ({ z, note }: { z: AuswertungsZeile; note: number }): BewertungsKurz => ({ slug: z.slug, handelsname: z.handelsname, note });
  const top = sortiert.slice(0, 3).map(kurz);
  const flop = sortiert.slice(3).slice(-3).reverse().map(kurz);

  // Community-Mittel ohne die eigene Note: freigegeben steckt sie in `mittel`.
  // `anzahl` zählt alle freigegebenen, `mittel` nur die mit Gesamtnote; seit v2
  // haben alle neuen eine, Altbewertungen ohne sind selten.
  const vergleiche: { z: AuswertungsZeile; eigene: number; community: number }[] = [];
  for (const { z, note } of mitNote) {
    const c = z.community;
    if (!c || c.mittel === null) continue;
    const eigeneDrin = z.freigegeben && z.gesamtnote !== null;
    const fremde = eigeneDrin ? c.anzahl - 1 : c.anzahl;
    if (fremde < 1) continue;
    const community = eigeneDrin ? (c.mittel * c.anzahl - z.gesamtnote!) / fremde : c.mittel;
    vergleiche.push({ z, eigene: note, community: eine(community) });
  }
  const differenz =
    vergleiche.length >= 2 ? eine(vergleiche.reduce((s, v) => s + (v.eigene - v.community), 0) / vergleiche.length) : null;
  const abweichungen = [...vergleiche]
    .sort((a, b) => Math.abs(b.eigene - b.community) - Math.abs(a.eigene - a.community))
    .slice(0, 3)
    .map((v) => ({ slug: v.z.slug, handelsname: v.z.handelsname, eigene: v.eigene, community: v.community }));

  let schnitte: Schnitte | null = null;
  if (zeilen.length > 0) {
    const mittel = (f: (z: AuswertungsZeile) => number) => eine(zeilen.reduce((s, z) => s + f(z), 0) / zeilen.length);
    schnitte = {
      aussehen: mittel((z) => z.aussehen),
      geruch: mittel((z) => z.geruch),
      geschmack: mittel((z) => z.geschmack),
      wirkung: mittel((z) => z.wirkung),
      konsistenz: mittel((z) => z.konsistenz),
      gesamt: eine(mitNote.reduce((s, x) => s + x.note, 0) / mitNote.length),
    };
  }

  return { top, flop, community: { differenz, vergleichbar: vergleiche.length, abweichungen }, schnitte };
}
