import type { Metadata } from "next";

import { BewertungenSeite } from "@/app/[lang]/reviews/seite";
import { holeWoerterbuch } from "@/lib/i18n";
import { sprachParameter } from "@/lib/i18n/vorrendern";

/**
 * Statisch je Sprache (Spec 2026-10-01, statische Seiten, 4.3). Neu gebaut beim
 * Speichern, Freigeben oder Bebildern einer Bewertung (D1-Tag-Cache, Session 54),
 * sonst einmal am Tag. Gerendert beim ersten Aufruf, nicht im Build: dort gibt es keine
 * erreichbare Datenbank. Die Seite ist nicht nutzerbezogen.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

/** Beide Sprachen im Build vorrendern, wenn die lokale D1 den Live-Abzug trägt (scripts/cf-build.mjs). */
export function generateStaticParams() {
  return sprachParameter();
}

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.reviews.titel, description: w.reviews.metaBeschreibung };
}

/** Band 1 des großen Buchs; die weiteren Bände liegen unter /reviews/band/[band]. */
export default function ReviewsPage() {
  return <BewertungenSeite band={1} />;
}
