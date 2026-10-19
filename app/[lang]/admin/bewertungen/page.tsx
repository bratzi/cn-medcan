import { Suspense } from "react";

import { BewertungenBereich } from "@/components/admin/bereiche/Bewertungen";
import { Spinner } from "@/components/ui";
import { adminSeite } from "@/lib/session";

export default async function AdminBewertungenPage() {
  await adminSeite("/admin/bewertungen");
  return (
    <>
      <Suspense fallback={<Spinner text="Bewertungen werden geladen" />}>
        <BewertungenBereich />
      </Suspense>
    </>
  );
}
