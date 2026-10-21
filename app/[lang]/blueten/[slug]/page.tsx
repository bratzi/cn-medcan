import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ladeSorte, produktZuSorte } from "@/lib/query/sorte";

import { SortenSeite, sortenMetadaten } from "./sorten-inhalt";

/**
 * Ausweichweg ohne Datei (Spec 2026-10-21, Seiten aus Assets, 5): läuft nur, wenn das Tor unter
 * /_seiten keine Datei fand (neue Sorte seit dem Build, unbekannter Vertreiber, alte Produktadresse,
 * `?ware=`). Rendert die Variante direkt, statt umzuleiten: eine Weiterleitung auf den internen Pfad
 * zeigte /de/... in der Adresszeile, eine auf die öffentliche Adresse käme ohne Datei wieder hierher.
 */
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type Suche = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return sortenMetadaten(slug);
}

function ersterWert(wert: string | string[] | undefined): string | undefined {
  const roh = Array.isArray(wert) ? wert[0] : wert;
  return roh?.trim() || undefined;
}

/** Query-String mit `?` für die Umleitung alter Produktadressen, leer ohne Parameter. */
function alsSuche(suche: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [schluessel, wert] of Object.entries(suche)) {
    for (const einzeln of Array.isArray(wert) ? wert : wert === undefined ? [] : [wert]) params.append(schluessel, einzeln);
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

export default async function SorteOhneDatei({ params, searchParams }: { params: Params; searchParams: Suche }) {
  const [{ slug }, suche] = await Promise.all([params, searchParams]);
  const sorte = await ladeSorte(slug);
  if (!sorte) {
    // Alte Produktadresse: dauerhaft auf die Sorte mit ?ware=, nur wenn der Slug keine Sorte ist (eine Abfrage).
    const ziel = await produktZuSorte(`/blueten/${slug}`, alsSuche(suche));
    if (ziel) permanentRedirect(ziel);
    notFound();
  }
  return (
    <SortenSeite
      slug={slug}
      wahl={{ ware: ersterWert(suche.ware), vertreiber: ersterWert(suche.vertreiber), alle: ersterWert(suche.alle) === "1" }}
    />
  );
}
