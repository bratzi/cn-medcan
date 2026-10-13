import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BlueteVorschlagFormular } from "@/components/vorschlag/BlueteVorschlagFormular";
import { getPrisma } from "@/lib/prisma";
import { terpenNamen } from "@/lib/query/vorschlaege";
import { aktuellesMitglied } from "@/lib/session";
import { vorschlagPfad } from "@/lib/vorschlag-eingabe";
import { budpicMeldungen } from "@/lib/budpic-anzeige";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await holeWoerterbuch()).vorschlag.titel, robots: { index: false, follow: false } };
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Fehlt eine Bluete im Katalog, traegt ein angemeldetes Mitglied sie hier ein (Spec 4.1). */
export default async function VorschlagenPage({ searchParams }: Props) {
  const roh = (await searchParams).name;
  const nameVorbelegt = (typeof roh === "string" ? roh : "").slice(0, 120);

  // Link „Vertreiber fehlt?“ von der Blütenseite: nur eine echte Kultivar-Id zählt.
  const kultivarRoh = (await searchParams).kultivar;
  const kultivarWert = typeof kultivarRoh === "string" ? kultivarRoh.trim().toLowerCase() : "";
  const kultivar = /^[0-9a-f-]{32,36}$/.test(kultivarWert)
    ? await (await getPrisma()).kultivar.findUnique({ where: { id: kultivarWert }, select: { id: true, name: true } })
    : null;

  // Der Suchbegriff aus dem Katalog soll die Anmeldung ueberleben.
  const [mitglied, w, sprache] = await Promise.all([aktuellesMitglied(), holeWoerterbuch(), holeSprache()]);
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
          kultivarId={kultivar?.id}
          kultivarName={kultivar?.name}
          texte={w.vorschlag}
          typen={w.label.kultivarTyp}
          sprache={sprache}
          meldungen={budpicMeldungen(w)}
        />
      </div>
    </div>
  );
}
