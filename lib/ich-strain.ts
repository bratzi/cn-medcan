import type { Vorbelegung } from "@/lib/bewertung-vorbelegung";
import type { LiveNetzBasis } from "@/lib/live-netz";

export type IchStrain =
  | { zugang: "gast" }
  | { zugang: "mitglied" }
  | { zugang: "freigegeben"; istBetreiber: boolean; vorbelegung: Vorbelegung | null; liveNetz: LiveNetzBasis | null };

type Deps = {
  mitglied: () => Promise<{ mitgliedId: string; freigegeben: boolean; rolle: string } | null>;
  ladeEigeneBewertung: (autorId: string, kultivarId: string, vertreiberId: string | null) => Promise<unknown | null>;
  ladeLiveNetzBasis: (mitgliedId: string, strainId: string) => Promise<LiveNetzBasis | null>;
  vorbelegungAus: (review: never) => Vorbelegung;
};

/** Was die statische Strain-Seite nicht wissen darf (Spec 2026-10-21, 3.3). Rechte entscheidet der Server. */
export async function ichStrain(deps: Deps, e: { kultivarId: string; vertreiberId: string | null; strainId: string }): Promise<IchStrain> {
  const m = await deps.mitglied();
  if (!m) return { zugang: "gast" };
  if (!m.freigegeben) return { zugang: "mitglied" };
  const [eigene, liveNetz] = await Promise.all([
    // Ohne Vertreiber die jüngste eigene Bewertung der Sorte (Plan 2026-10-22): die Maske wählt deren Vertreiber vor.
    deps.ladeEigeneBewertung(m.mitgliedId, e.kultivarId, e.vertreiberId),
    deps.ladeLiveNetzBasis(m.mitgliedId, e.strainId).catch((fehler: unknown) => {
      console.error("ladeLiveNetzBasis fehlgeschlagen", fehler);
      return null;
    }),
  ]);
  return { zugang: "freigegeben", istBetreiber: m.rolle === "ADMIN", vorbelegung: eigene ? deps.vorbelegungAus(eigene as never) : null, liveNetz };
}
