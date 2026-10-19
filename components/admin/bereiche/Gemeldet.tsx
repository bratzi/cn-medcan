import { GemeldeterKommentar } from "@/components/admin/GemeldeterKommentar";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";
import { gemeldeteKommentare } from "@/app/[lang]/reaktionen/kommentar-aktionen";

// Intl-Instanzen sind im Konstruktor teuer: einmal pro Isolate, nicht pro Zeile.
const DATUM = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

/** Von Mitgliedern gemeldete Kommentare: freigeben oder löschen. */
export async function GemeldeteBereich() {
  const kommentare = await gemeldeteKommentare();

  return (
    <section aria-labelledby="gemeldet-titel">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="gemeldet-titel" className="text-h3 text-text">
            Gemeldete Kommentare
          </h2>
          {kommentare.length > 0 ? <Badge variante="warning">{kommentare.length} offen</Badge> : null}
        </CardHeader>
        <CardBody>
          {kommentare.length === 0 ? (
            <p className="text-body text-text-muted">Nichts gemeldet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {kommentare.map((k) => (
                <li
                  key={k.id}
                  className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <p className="max-w-[68ch] text-body text-text">{k.text}</p>
                    <p className="text-small text-text-muted">
                      {k.autor.name} · {DATUM.format(new Date(k.erstelltAm))} ·{" "}
                      <span className="numeric">{k.meldungen}</span> {k.meldungen === 1 ? "Meldung" : "Meldungen"}
                    </p>
                    {k.gruende.length > 0 ? (
                      <ul className="flex flex-col gap-1 text-small text-text-muted">
                        {k.gruende.map((g, i) => (
                          <li key={i}>Grund: {g}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <GemeldeterKommentar id={k.id} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
