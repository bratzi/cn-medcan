import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ladeSorte, produktZuSorte } from "@/lib/query/sorte";
import { strainSlugs } from "@/lib/strain-slugs";

import { SortenSeite, sortenMetadaten } from "./sorten-inhalt";

/**
 * Eine statische Seite je Strain, als Gast (Plan 2026-10-22, eine Seite je Strain; Spec 2026-10-21,
 * Seiten aus Assets). Liest keine Cookies und keine Suchparameter: der Vertreiber ist kein Seitenzustand,
 * gewählt wird er im Bewertungsformular. Persönliches lädt die Insel /api/ich/strain.
 * Neue Sorten seit dem Build rendern beim ersten Aufruf (dynamicParams), bis der nächste Build die Datei legt.
 */
export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = true;
export function generateStaticParams() {
  return strainSlugs();
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return sortenMetadaten(slug);
}

export default async function StrainSeite({ params }: { params: Params }) {
  const { slug } = await params;
  if (!(await ladeSorte(slug))) {
    // Alte Produktadresse: dauerhaft auf die Sorte, nur wenn der Slug keine Sorte ist (eine Abfrage).
    const ziel = await produktZuSorte(`/blueten/${slug}`, "");
    if (ziel) permanentRedirect(ziel);
    notFound();
  }
  return <SortenSeite slug={slug} />;
}
