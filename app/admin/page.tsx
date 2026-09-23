import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ErgebnisListe } from "@/components/admin/ErgebnisListe";
import { MitgliedAktionen } from "@/components/admin/MitgliedAktionen";
import { RundeAnlegenFormular } from "@/components/admin/RundeAnlegenFormular";
import { RundeSteuerung } from "@/components/admin/RundeSteuerung";
import { VorschlagListe } from "@/components/admin/VorschlagListe";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import type { SelectOption } from "@/components/ui";
import { formatiereDatum } from "@/lib/format";
import { reviewAuswahlFuerStrains } from "@/lib/query/reviews";
import { ladeStrainAuswahl } from "@/lib/query/strains";
import {
  aktiveUmfrage,
  beendeteRundenMitGewinnern,
  vorschlaegeLaden,
} from "@/lib/query/umfragen";
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

/**
 * Die laufende Runde mit ihren Vorschlaegen - oder das Formular, mit dem sie
 * eroeffnet wird.
 *
 * Ohne laufende Runde steht auf der Startseite dauerhaft, dass keine
 * Abstimmung laeuft; das Eroeffnen ist deshalb der erste Handgriff hier.
 */
async function UmfrageBereich() {
  const umfrage = await aktiveUmfrage();

  if (!umfrage) {
    return (
      <section aria-labelledby="neue-runde-titel">
        <Card>
          <CardHeader>
            <h2 id="neue-runde-titel" className="text-h3 text-text">
              Neue Runde eröffnen
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-6">
            <p className="max-w-[68ch] text-body text-text-muted">
              Derzeit läuft keine Runde. Solange keine läuft, steht auf der Startseite,
              dass keine Abstimmung offen ist. Eine neue Runde beginnt in der
              Vorschlagsphase.
            </p>
            <RundeAnlegenFormular />
          </CardBody>
        </Card>
      </section>
    );
  }

  // Erst hier, weil beides die Id der Runde braucht. Die Katalogauswahl ist
  // fuer den gesetzten Platz; in einer beendeten Runde gaebe es den nicht -
  // eine laufende Runde ist nie beendet, der Zweig ist die Absicherung.
  const [vorschlaege, strains] = await Promise.all([
    vorschlaegeLaden(umfrage.id),
    umfrage.phase === "BEENDET" ? Promise.resolve([]) : ladeStrainAuswahl(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <RundeSteuerung
        umfrage={umfrage}
        strains={strains.map((strain) => ({ wert: strain.id, label: strain.handelsname }))}
      />
      <VorschlagListe vorschlaege={vorschlaege} phase={umfrage.phase} />
    </div>
  );
}

/**
 * Die Ergebnisse beendeter Runden.
 *
 * Zwei Abfragen, nicht eine pro Platz: erst die Runden mit ihren Gewinnern,
 * dann in einem Zug die eigenen Bewertungen zu genau diesen Sorten.
 */
async function ErgebnisBereich() {
  const runden = await beendeteRundenMitGewinnern();
  // Ohne beendete Runde gibt es hier nichts zu tun - dann steht die Karte
  // auch nicht leer da.
  if (runden.length === 0) return null;

  const strainIds = runden.flatMap((runde) =>
    runde.plaetze.map((platz) => platz.strainId),
  );
  const reviews = await reviewAuswahlFuerStrains(strainIds);

  const reviewsJeStrain = new Map<string, SelectOption[]>();
  for (const review of reviews) {
    const liste = reviewsJeStrain.get(review.strainId) ?? [];
    liste.push({
      wert: review.id,
      // Datum und Charge unterscheiden zwei Bewertungen derselben Sorte; der
      // Entwurfsvermerk verhindert, dass eine unveroeffentlichte Bewertung
      // versehentlich als Ergebnis gesetzt wird.
      label:
        `${formatiereDatum(review.erstelltAm)}` +
        (review.chargenNr ? ` · Charge ${review.chargenNr}` : "") +
        (review.freigegeben ? "" : " · Entwurf"),
    });
    reviewsJeStrain.set(review.strainId, liste);
  }

  return <ErgebnisListe runden={runden} reviewsJeStrain={reviewsJeStrain} />;
}

/** Die Mitgliederliste mit Freigabe und Rollenvergabe. */
async function MitgliederBereich({ eigeneMitgliedId }: { eigeneMitgliedId: string }) {
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
    <section aria-labelledby="mitglieder-titel">
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
                    const istSelbst = satz.id === eigeneMitgliedId;

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
  );
}

export default async function AdminPage() {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) redirect("/anmelden?weiter=%2Fadmin");

  // Kein redirect und keine Meldung "keine Berechtigung": wer kein Betreiber
  // ist, soll nicht erfahren, dass es diese Seite gibt. Die Rechtequelle ist
  // lib/session.ts, hier wird sie nur gelesen.
  if (mitglied.rolle !== "ADMIN") notFound();

  // Drei eigene Suspense-Grenzen: die Umfrageverwaltung ist der Grund, warum
  // diese Seite aufgerufen wird, und soll nicht auf die Mitgliederliste
  // warten.
  return (
    <div className="mx-auto w-full max-w-320 px-4 py-16 sm:px-8">
      <h1 className="text-h1 text-text">Verwaltung</h1>
      <p className="mt-2 max-w-[68ch] text-body text-text-muted">
        Umfragen steuern, Ergebnisse verknüpfen, Mitglieder freigeben. Erst mit der
        Freigabe bestehen Stimmrecht in Umfragen und Sicht auf die Preisangaben.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        <Suspense fallback={<Spinner text="Umfrage wird geladen" />}>
          <UmfrageBereich />
        </Suspense>

        <Suspense fallback={<Spinner text="Ergebnisse werden geladen" />}>
          <ErgebnisBereich />
        </Suspense>

        <Suspense fallback={<Spinner text="Mitglieder werden geladen" />}>
          <MitgliederBereich eigeneMitgliedId={mitglied.mitgliedId} />
        </Suspense>
      </div>
    </div>
  );
}
