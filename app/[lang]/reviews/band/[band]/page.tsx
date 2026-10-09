import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BewertungenSeite } from "@/app/[lang]/reviews/seite";
import { holeWoerterbuch } from "@/lib/i18n";

export const dynamic = "force-static";
// Wie /reviews: neu beim Speichern einer Bewertung (revalidiereSprachen("/reviews", "layout")), sonst täglich.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.reviews.titel, description: w.reviews.metaBeschreibung };
}

export default async function BandPage({ params }: { params: Promise<{ band: string }> }) {
  const { band } = await params;
  const nummer = Number(band);
  // Band 1 hat genau eine Adresse: /reviews.
  if (!/^\d+$/.test(band) || nummer < 2 || String(nummer) !== band) notFound();
  return <BewertungenSeite band={nummer} />;
}
