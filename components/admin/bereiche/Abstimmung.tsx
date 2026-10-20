import { RundeSteuerung } from "@/components/admin/RundeSteuerung";
import { VorschlagListe } from "@/components/admin/VorschlagListe";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { aktiveUmfrage, vorschlaegeLaden } from "@/lib/query/umfragen";

/**
 * Die laufende Runde mit ihren Vorschlaegen. Runden laufen seit 2026-10-20 nach
 * Kalender (Strain of the Month): der Takt eroeffnet, schaltet und beendet sie,
 * der Betreiber steuert hier nichts mehr.
 */
export async function AbstimmungBereich() {
  const umfrage = await aktiveUmfrage();

  if (!umfrage) {
    return (
      <section aria-labelledby="neue-runde-titel">
        <Card>
          <CardHeader>
            <h2 id="neue-runde-titel" className="text-h3 text-text">
              Keine laufende Runde
            </h2>
          </CardHeader>
          <CardBody>
            <p className="max-w-[68ch] text-body text-text-muted">
              Derzeit läuft keine Runde. Die nächste eröffnet der Kalender automatisch zum Monatswechsel; die Vorschlagsphase endet jeweils am 15.
            </p>
          </CardBody>
        </Card>
      </section>
    );
  }

  const vorschlaege = await vorschlaegeLaden(umfrage.id);

  return (
    <div className="flex flex-col gap-8">
      <RundeSteuerung umfrage={umfrage} />
      <VorschlagListe vorschlaege={vorschlaege} phase={umfrage.phase} />
    </div>
  );
}
