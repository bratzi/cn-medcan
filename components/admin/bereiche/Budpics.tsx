import Link from "next/link";

import { BudpicFreigabe } from "@/components/admin/BudpicFreigabe";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";
import { bluetenHref } from "@/lib/alte-adressen";
import { ladeBudpicsNachStatus } from "@/lib/query/budpics";

// Intl-Instanzen sind im Konstruktor teuer: einmal pro Isolate, nicht pro Zeile.
const DATUM = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

/**
 * Budpics (T9): Bilder von Mitgliedern. Offene erscheinen erst nach der
 * Freigabe oeffentlich; freigegebene lassen sich hier wieder ablehnen oder
 * loeschen. Vorschau ohne Cache, dazu Sorte, Einreicher und Datum.
 */
export async function BudpicListe({ status }: { status: "OFFEN" | "FREIGEGEBEN" }) {
  const { eintraege, gesamt } = await ladeBudpicsNachStatus(status);
  const offen = status === "OFFEN";
  const titelId = offen ? "budpic-titel" : "budpic-frei-titel";
  return (
    <section aria-labelledby={titelId}>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <h2 id={titelId} className="text-h3 text-text">
            {offen ? "Budpics" : "Budpics: freigegeben"}
          </h2>
          {offen ? (
            gesamt > 0 ? (
              <Badge variante="warning">
                {gesamt} {gesamt === 1 ? "Bild wartet" : "Bilder warten"}
              </Badge>
            ) : (
              <Badge variante="success">Keine offene Freigabe</Badge>
            )
          ) : (
            <Badge variante="neutral" zeichen={false}>
              {gesamt.toLocaleString("de-DE")} sichtbar
            </Badge>
          )}
        </CardHeader>
        <CardBody>
          {eintraege.length === 0 ? (
            <p className="text-body text-text-muted">{offen ? "Kein Bild wartet auf Prüfung." : "Noch kein Bild freigegeben."}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {eintraege.map((b) => (
                <li key={b.id} className="flex flex-col gap-2">
                  <p className="text-body text-text">
                    <Link prefetch={false} href={bluetenHref(b.strainSlug, b.kultivarSlug)} className="font-medium underline underline-offset-4">
                      {b.handelsname}
                    </Link>
                  </p>
                  <p className="text-small text-text-muted">
                    von {b.nutzer}, {DATUM.format(b.erstelltAm)}, <span className="numeric">{b.breite} × {b.hoehe}</span> px
                  </p>
                  {b.ausBewertung ? (
                    <p>
                      <Badge variante="neutral" zeichen={false}>
                        aus einer Bewertung
                      </Badge>
                    </p>
                  ) : null}
                  <BudpicFreigabe id={b.id} breite={b.breite} hoehe={b.hoehe} handelsname={b.handelsname} freigegeben={!offen} />
                </li>
              ))}
            </ul>
          )}
          {gesamt > eintraege.length ? (
            <p className="mt-4 text-small text-text-muted">Gezeigt werden {offen ? "die ältesten" : "die neuesten"} {eintraege.length}.</p>
          ) : null}
        </CardBody>
      </Card>
    </section>
  );
}
