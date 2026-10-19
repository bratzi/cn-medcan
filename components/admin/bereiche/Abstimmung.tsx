import { RundeAnlegenFormular } from "@/components/admin/RundeAnlegenFormular";
import { RundeSteuerung } from "@/components/admin/RundeSteuerung";
import { VorschlagListe } from "@/components/admin/VorschlagListe";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { ladeStrainAuswahl } from "@/lib/query/strains";
import { aktiveUmfrage, vorschlaegeLaden } from "@/lib/query/umfragen";

/**
 * Die laufende Runde mit ihren Vorschlaegen - oder das Formular, mit dem sie
 * eroeffnet wird.
 *
 * Ohne laufende Runde steht auf der Startseite dauerhaft, dass keine
 * Abstimmung laeuft; das Eroeffnen ist deshalb der erste Handgriff hier.
 */
export async function AbstimmungBereich() {
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
