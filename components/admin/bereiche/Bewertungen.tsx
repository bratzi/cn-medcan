import { BewertungFreigabe } from "@/components/admin/BewertungFreigabe";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";
import { notizKuerzen } from "@/lib/admin-eingabe";
import { offeneBewertungen } from "@/lib/query/reviews";

// Intl-Instanzen sind im Konstruktor teuer: einmal pro Isolate, nicht pro Zeile.
const DATUM = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

/** Community-Bewertungen, die auf Freigabe warten. */
export async function BewertungenBereich() {
  const bewertungen = await offeneBewertungen();

  return (
    <section aria-labelledby="bewertungen-titel">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="bewertungen-titel" className="text-h3 text-text">
            Bewertungen zur Freigabe
          </h2>
          {bewertungen.length > 0 ? (
            <Badge variante="warning">{bewertungen.length} offen</Badge>
          ) : null}
        </CardHeader>
        <CardBody>
          {bewertungen.length === 0 ? (
            <p className="text-body text-text-muted">Keine Bewertungen offen.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {bewertungen.map((bewertung) => {
                const notiz = notizKuerzen(bewertung.notiz);
                const bezeichnung = `${bewertung.handelsname} vom ${DATUM.format(bewertung.erstelltAm)}`;
                return (
                  <li
                    key={bewertung.id}
                    className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="text-body text-text">
                        <span className="font-medium">{bewertung.handelsname}</span>
                        {bewertung.chargenNr ? (
                          <span className="text-text-muted"> · Charge {bewertung.chargenNr}</span>
                        ) : null}
                      </p>
                      <p className="numeric text-small text-text-muted">
                        Aussehen {bewertung.aussehen} · Geruch {bewertung.geruch} · Geschmack{" "}
                        {bewertung.geschmack} · Wirkung {bewertung.wirkung} · Konsistenz{" "}
                        {bewertung.konsistenz}
                      </p>
                      {notiz ? (
                        <p className="max-w-[68ch] text-small text-text">{notiz}</p>
                      ) : null}
                      <p className="text-small text-text-muted">
                        {bewertung.autor ?? "Ohne Autor"} · {DATUM.format(bewertung.erstelltAm)}
                      </p>
                    </div>
                    <BewertungFreigabe reviewId={bewertung.id} bezeichnung={bezeichnung} />
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
