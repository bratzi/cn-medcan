import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { holeWoerterbuch } from "@/lib/i18n";

import { JurySeite } from "../../magazin";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.jury.titel, description: w.jury.metaBeschreibung };
}

export default async function JuryFolgeseitePage({ params }: { params: Promise<{ nummer: string }> }) {
  const { nummer } = await params;
  const seite = Number(nummer);
  // Seite 1 hat genau eine Adresse: /jury.
  if (!/^\d+$/.test(nummer) || seite < 2 || String(seite) !== nummer) notFound();
  return <JurySeite seite={seite} />;
}
