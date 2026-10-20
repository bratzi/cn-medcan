import type { Metadata } from "next";

import { KatalogAnsicht } from "@/components/katalog/KatalogAnsicht";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { filtere, verdichte } from "@/lib/katalog/filtern";
import { ladeKatalog } from "@/lib/katalog/laden";
import type { KatalogDaten } from "@/lib/katalog/typen";
import { leererFilter } from "@/lib/query/filter";
import { sprachParameter } from "@/lib/i18n/vorrendern";

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.katalog.metaTitel, description: w.katalog.metaBeschreibung };
}

/**
 * Statisch mit stündlicher Revalidierung (Spec 2026-10-20 Blütenseite): Filter, Sortierung und
 * Blättern laufen im Browser (KatalogAnsicht). Der Server rendert nur die erste Seite ohne Filter
 * aus dem öffentlichen Katalog, einmal je Revalidierung.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

/** Beide Sprachen im Build vorrendern, wenn die lokale D1 den Live-Abzug trägt (scripts/cf-build.mjs). */
export function generateStaticParams() {
  return sprachParameter();
}

export default async function BluetenPage() {
  const [w, sprache, text] = await Promise.all([holeWoerterbuch(), holeSprache(), ladeKatalog(false)]);
  const daten = JSON.parse(text) as KatalogDaten;
  const ergebnis = filtere(verdichte(daten), leererFilter());
  const zeilen = ergebnis.ansicht === "bluete" ? ergebnis.zeilen : [];
  // Nur die Vertreiber der ersten Seite an den Client, nicht die ganze Liste.
  const benoetigt = new Set(zeilen.flatMap((z) => z.vertreiberIds));
  const start = {
    zeilen: zeilen.map((z) => ({ ...z, waren: [], suchtext: "" })),
    gesamt: ergebnis.gesamt,
    seitenAnzahl: ergebnis.seitenAnzahl,
    vertreiber: daten.vertreiber.filter((v) => benoetigt.has(v.i)),
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 text-text">{w.katalog.titel}</h1>
        <p className="max-w-[68ch] text-body text-text-muted">{w.katalog.einleitung}</p>
      </header>
      <KatalogAnsicht start={start} w={w} sprache={sprache} />
    </main>
  );
}
