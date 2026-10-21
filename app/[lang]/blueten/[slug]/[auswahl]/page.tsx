import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ladeSorte } from "@/lib/query/sorte";
import { leseAuswahl, strainVarianten } from "@/lib/strain-varianten";

import { SortenSeite, sortenMetadaten } from "../sorten-inhalt";

/** Statisch je Variante, als Gast (Spec 2026-10-21, Seiten aus Assets, 3.1). Persönliches lädt die Insel. */
export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = true;
export function generateStaticParams() {
  return strainVarianten();
}

type Params = Promise<{ slug: string; auswahl: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return sortenMetadaten(slug);
}

/**
 * Eine Variante der Strain-Seite: "standard", "v-<id>" oder "v-<id>-alle" (lib/seiten-tor.ts). Liest
 * keine Cookies und keine Suchparameter. Ein Vertreiber, den die Sorte nicht führt, ergibt 404 statt
 * einer weiteren Kopie der Standardseite: sonst legte jede erfundene Id eine Seite im Cache an.
 */
export default async function StrainVariante({ params }: { params: Params }) {
  const { slug, auswahl: segment } = await params;
  const auswahl = leseAuswahl(segment);
  if (!auswahl) notFound();
  if (auswahl.vertreiberId) {
    const sorte = await ladeSorte(slug);
    if (!sorte?.waren.some((ware) => ware.vertreiberId === auswahl.vertreiberId)) notFound();
  }
  return <SortenSeite slug={slug} wahl={{ vertreiber: auswahl.vertreiberId ?? undefined, alle: auswahl.alle }} />;
}
