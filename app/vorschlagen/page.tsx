import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BlueteVorschlagFormular } from "@/components/vorschlag/BlueteVorschlagFormular";
import { terpenNamen } from "@/lib/query/vorschlaege";
import { aktuellesMitglied } from "@/lib/session";

export const metadata: Metadata = {
  title: "Blüte vorschlagen",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Fehlt eine Bluete im Katalog, traegt ein angemeldetes Mitglied sie hier ein (Spec 4.1). */
export default async function VorschlagenPage({ searchParams }: Props) {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) redirect("/anmelden?weiter=%2Fvorschlagen");

  const roh = (await searchParams).name;
  const nameVorbelegt = (typeof roh === "string" ? roh : "").slice(0, 120);

  return (
    <div className="mx-auto w-full max-w-180 px-4 py-16 sm:px-8">
      <h1 className="text-h1 text-text text-balance">Blüte vorschlagen</h1>
      <p className="mt-2 max-w-[68ch] text-body text-text-muted text-pretty">
        Dir fehlt eine Blüte im Katalog? Trag ein, was du weißt. Wir prüfen die Angaben und nehmen sie
        auf. Unter Mein Konto siehst du, wie es um deinen Vorschlag steht.
      </p>
      <div className="mt-8">
        <BlueteVorschlagFormular terpene={await terpenNamen()} nameVorbelegt={nameVorbelegt} />
      </div>
    </div>
  );
}
