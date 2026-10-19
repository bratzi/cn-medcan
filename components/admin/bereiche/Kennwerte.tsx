import { KennwerteNeuKnopf } from "@/components/admin/KennwerteNeuKnopf";
import { Card, CardBody, CardHeader } from "@/components/ui";

export function KennwerteBereich() {
  return (
    <section aria-labelledby="kennwerte-titel">
      <Card>
        <CardHeader>
          <h2 id="kennwerte-titel" className="text-h3 text-text">
            Kennwerte
          </h2>
        </CardHeader>
        <CardBody>
          <KennwerteNeuKnopf />
        </CardBody>
      </Card>
    </section>
  );
}
