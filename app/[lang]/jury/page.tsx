import type { Metadata } from "next";

import { holeWoerterbuch } from "@/lib/i18n";

import { JurySeite } from "./magazin";

/**
 * Statisch je Sprache wie die Startseite; neu gebaut, wenn eine Jury-Aktion revalidiert, sonst
 * einmal am Tag. Seiten 2 und folgende liegen unter /jury/seite/<n> (jury/seite/[nummer]).
 */
export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.jury.titel, description: w.jury.metaBeschreibung };
}

export default function JuryPage() {
  return <JurySeite seite={1} />;
}
