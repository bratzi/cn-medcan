import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { MitgliedAktionen } from "@/components/admin/MitgliedAktionen";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { aktuellesMitglied } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { istMitgliedRolle, type MitgliedRolle } from "@/db/enums";

export const metadata: Metadata = {
  title: "Verwaltung",
  robots: { index: false, follow: false },
};

const ROLLEN_LABEL: Record<MitgliedRolle, string> = {
  MITGLIED: "Mitglied",
  FACHKREIS: "Fachkreis",
  ADMIN: "Betreiber",
};

// Intl-Instanzen sind im Konstruktor teuer: einmal pro Isolate, nicht pro Zeile.
const DATUM = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

/**
 * Obergrenze der Liste. Jede Listenabfrage hat ein `take` - auch wenn es
 * heute zwanzig Mitglieder sind. Reicht es nicht mehr, kommt Cursor-
 * Paginierung dazu, kein groesseres Limit.
 */
const MAX_ZEILEN = 200;

export default async function AdminPage() {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) redirect("/anmelden?weiter=%2Fadmin");

  // Kein redirect und keine Meldung "keine Berechtigung": wer kein Betreiber
  // ist, soll nicht erfahren, dass es diese Seite gibt. Die Rechtequelle ist
  // lib/session.ts, hier wird sie nur gelesen.
  if (mitglied.rolle !== "ADMIN") notFound();

  const prisma = await getPrisma();
  const [mitglieder, gesamt] = await Promise.all([
    prisma.mitglied.findMany({
      select: {
        id: true,
        anzeigename: true,
        instagramHandle: true,
        freigegeben: true,
        freigegebenAm: true,
        rolle: true,
        erstelltAm: true,
        user: { select: { email: true } },
      },
      // Offene Freigaben zuerst - das ist die Arbeit, die hier ansteht.
      orderBy: [{ freigegeben: "asc" }, { erstelltAm: "desc" }],
      take: MAX_ZEILEN,
    }),
    prisma.mitglied.count(),
  ]);

  const offen = mitglieder.filter((satz) => !satz.freigegeben).length;

  return (
    <div className="mx-auto w-full max-w-320 px-4 py-16 sm:px-8">
      <h1 className="text-h1 text-text">Verwaltung</h1>
      <p className="mt-2 max-w-[68ch] text-body text-text-muted">
        Mitglieder freigeben und Rollen vergeben. Erst mit der Freigabe bestehen
        Stimmrecht in Umfragen und Sicht auf die Preisangaben.
      </p>

      <section aria-labelledby="mitglieder-titel" className="mt-8">
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="mitglieder-titel" className="text-h3 text-text">
              Mitglieder
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {offen > 0 ? (
                <Badge variante="warning">
                  {offen} {offen === 1 ? "offene Freigabe" : "offene Freigaben"}
                </Badge>
              ) : (
                <Badge variante="success">Keine offene Freigabe</Badge>
              )}
              <Badge variante="neutral" zeichen={false}>
                {gesamt.toLocaleString("de-DE")} insgesamt
              </Badge>
            </div>
          </CardHeader>

          <CardBody className="flex flex-col gap-4">
            {mitglieder.length === 0 ? (
              <EmptyState
                titel="Noch keine Mitglieder"
                beschreibung="Sobald sich jemand registriert, erscheint der Eintrag hier zur Freigabe."
              />
            ) : (
              <>
                <Table
                  caption="Registrierte Mitglieder mit Freigabestatus und Rolle"
                  captionVersteckt
                >
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Mitglied</TableHeaderCell>
                      <TableHeaderCell>Instagram</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Registriert</TableHeaderCell>
                      <TableHeaderCell>Freigabe und Rolle</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mitglieder.map((satz) => {
                      // Ein Wert, der an den Triggern vorbei in die Spalte kam,
                      // faellt auf die niedrigste Rolle zurueck - wie in
                      // lib/session.ts, aus demselben Grund.
                      const rolle: MitgliedRolle = istMitgliedRolle(satz.rolle)
                        ? satz.rolle
                        : "MITGLIED";
                      const istSelbst = satz.id === mitglied.mitgliedId;

                      return (
                        <TableRow key={satz.id}>
                          <TableCell>
                            <span className="block font-medium text-text">
                              {satz.anzeigename}
                            </span>
                            <span className="block text-small text-text-muted">
                              {satz.user.email}
                            </span>
                            {istSelbst ? (
                              <span className="mt-2 inline-block text-small text-text-muted">
                                Eigenes Konto
                              </span>
                            ) : null}
                          </TableCell>

                          <TableCell>
                            {satz.instagramHandle ? (
                              <span className="text-body text-text">
                                @{satz.instagramHandle}
                              </span>
                            ) : (
                              <span className="text-body text-text-muted">
                                keine Angabe
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col items-start gap-2">
                              {/* Zustand nie nur ueber Farbe: Klartext und
                                  Formmarker im Badge, Rolle als eigenes Badge. */}
                              {satz.freigegeben ? (
                                <Badge variante="success">Freigegeben</Badge>
                              ) : (
                                <Badge variante="warning">Freigabe steht aus</Badge>
                              )}
                              <Badge variante="neutral" zeichen={false}>
                                {ROLLEN_LABEL[rolle]}
                              </Badge>
                              {satz.freigegebenAm ? (
                                <span className="text-small text-text-muted">
                                  seit {DATUM.format(satz.freigegebenAm)}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="numeric text-body text-text">
                              {DATUM.format(satz.erstelltAm)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <MitgliedAktionen
                              mitgliedId={satz.id}
                              anzeigename={satz.anzeigename}
                              freigegeben={satz.freigegeben}
                              rolle={rolle}
                              istSelbst={istSelbst}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {gesamt > mitglieder.length ? (
                  <p className="text-small text-text-muted">
                    Gezeigt werden {MAX_ZEILEN.toLocaleString("de-DE")} Konten,
                    offene Freigaben zuerst.
                  </p>
                ) : null}
              </>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
