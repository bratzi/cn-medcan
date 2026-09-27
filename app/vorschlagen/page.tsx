import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BlueteVorschlagFormular } from "@/components/vorschlag/BlueteVorschlagFormular";
import { terpenNamen } from "@/lib/query/vorschlaege";
import { aktuellesMitglied } from "@/lib/session";
import { vorschlagPfad } from "@/lib/vorschlag-eingabe";
import { holeWoerterbuch } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await holeWoerterbuch()).vorschlag.titel, robots: { index: false, follow: false } };
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Fehlt eine Bluete im Katalog, traegt ein angemeldetes Mitglied sie hier ein (Spec 4.1). */
export default async function VorschlagenPage({ searchParams }: Props) {
  const roh = (await searchParams).name;
  const nameVorbelegt = (typeof roh === "string" ? roh : "").slice(0, 120);

  // Der Suchbegriff aus dem Katalog soll die Anmeldung ueberleben.
  const [mitglied, w] = await Promise.all([aktuellesMitglied(), holeWoerterbuch()]);
  if (!mitglied) redirect(`/anmelden?weiter=${encodeURIComponent(vorschlagPfad(nameVorbelegt))}`);

  return (
    <div className="mx-auto w-full max-w-180 px-4 py-16 sm:px-8">
      <h1 className="text-h1 text-text text-balance">{w.vorschlag.titel}</h1>
      <p className="mt-2 max-w-[68ch] text-body text-text-muted text-pretty">
        {w.vorschlag.satz}
      </p>
      <div className="mt-8">
        <BlueteVorschlagFormular
          terpene={await terpenNamen()}
          nameVorbelegt={nameVorbelegt}
          texte={w.vorschlag}
          typen={w.label.kultivarTyp}
        />
      </div>
    </div>
  );
}
