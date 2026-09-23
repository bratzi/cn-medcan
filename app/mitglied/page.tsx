import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AbmeldeButton } from "@/components/auth/AbmeldeButton";
import { ProfilFormular } from "@/components/auth/ProfilFormular";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";
import { aktuellesMitglied } from "@/lib/session";
import type { MitgliedRolle } from "@/db/enums";

export const metadata: Metadata = {
  title: "Mein Konto",
  robots: { index: false, follow: false },
};

const ROLLEN_LABEL: Record<MitgliedRolle, string> = {
  MITGLIED: "Mitglied",
  FACHKREIS: "Fachkreis",
  ADMIN: "Betreiber",
};

export default async function MitgliedPage() {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) redirect("/anmelden?weiter=%2Fmitglied");

  return (
    <div className="mx-auto w-full max-w-180 px-4 py-16 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text">Mein Konto</h1>
          <p className="mt-2 text-body text-text-muted">{mitglied.email}</p>
        </div>
        <AbmeldeButton />
      </div>

      <section aria-labelledby="status-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="status-titel" className="text-h3 text-text">
              Status
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Zustand nie nur ueber Farbe: das Badge traegt Klartext und
                  einen Formmarker, daneben steht ein erklaerender Satz. */}
              {mitglied.freigegeben ? (
                <Badge variante="success">Freigegeben</Badge>
              ) : (
                <Badge variante="warning">Freigabe steht aus</Badge>
              )}
              <Badge variante="neutral" zeichen={false}>
                Rolle: {ROLLEN_LABEL[mitglied.rolle]}
              </Badge>
            </div>

            <p className="max-w-[68ch] text-body text-text-muted">
              {mitglied.freigegeben
                ? "Das Konto ist freigegeben. Damit bestehen Stimmrecht in Umfragen und Sicht auf die Preisangaben."
                : "Der Betreiber gibt Konten von Hand frei. Bis dahin sind Vorschläge und Abstimmungen gesperrt; der Katalog bleibt lesbar."}
            </p>

            {mitglied.freigegeben ? (
              // §10 HWG adressiert Fachkreise, also Angehoerige der
              // Heilberufe. Ein freigegebenes Mitglied ist das nicht - die
              // Preisanzeige ist eine Entscheidung des Betreibers und braucht
              // deshalb diesen Hinweis. Die Rolle FACHKREIS bleibt im
              // Datenmodell, damit die strengere Variante ohne
              // Schemaaenderung nachziehbar ist.
              <p className="max-w-[68ch] text-caption text-text-muted">
                Hinweis: Preisangaben richten sich nach § 10 Heilmittelwerbegesetz an
                Angehörige der Heilberufe. Sie dienen hier der Orientierung und sind
                keine Aufforderung zum Erwerb.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="profil-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="profil-titel" className="text-h3 text-text">
              Angaben
            </h2>
          </CardHeader>
          <CardBody>
            <ProfilFormular
              anzeigename={mitglied.anzeigename}
              instagramHandle={mitglied.instagramHandle}
            />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
