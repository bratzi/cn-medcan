import { hwgTreffer } from "@/lib/hwg-filter";

/** Öffentlicher Feed für die Instagram-Pflege in Cowork (Nutzer 2026-10-14). Nur, was die Website ohnehin öffentlich zeigt. */
export type IgReviewZeile = { id: string; slug: string; handelsname: string; vertreiber: string | null; /** Sorte und Ware (Spec Sorte im Fokus 2); fehlt bei Altdaten ohne Kultivar. */ sorte?: { name: string; slug: string; vertreiberId: string | null; wareGenau: boolean } | null; charge: string | null; gesamtnote: number | null; aromen: string[]; notiz: string | null; bilder: Array<{ id: string; status: string }>; erstelltAm: Date; freigegeben: boolean; istRedaktionell: boolean; wirkung?: number };
export type IgReview = { id: string; url: string; karte: string; bluete: string; vertreiber: string | null; /** Handelsname nur bei genau bekannter Ware. */ produkt?: string | null; charge: string | null; gesamtnote: number | null; aromen: string[]; notiz: string | null; bilder: string[]; datum: string };

export function igReview(z: IgReviewZeile, ursprung: string): IgReview | null {
  if (!z.freigegeben || !z.istRedaktionell) return null;
  return {
    id: z.id,
    url: z.sorte
      ? `${ursprung}/blueten/${z.sorte.slug}${z.sorte.vertreiberId ? `?vertreiber=${encodeURIComponent(z.sorte.vertreiberId)}` : ""}`
      : `${ursprung}/blueten/${z.slug}`,
    karte: `${ursprung}/api/ig-karte/${z.id}`,
    bluete: z.sorte?.name ?? z.handelsname,
    vertreiber: z.vertreiber,
    produkt: z.sorte && z.sorte.wareGenau ? z.handelsname : null,
    charge: z.charge,
    gesamtnote: z.gesamtnote === null ? null : Math.round(z.gesamtnote * 10) / 10,
    aromen: z.aromen,
    notiz: z.notiz && !hwgTreffer(z.notiz) ? z.notiz : null,
    bilder: z.bilder.filter((b) => b.status === "FREIGEGEBEN").map((b) => `${ursprung}/api/bild/${b.id}`),
    datum: z.erstelltAm.toISOString(),
  };
}
