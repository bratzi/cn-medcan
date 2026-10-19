import { Suspense } from "react";

import { BudpicListe } from "@/components/admin/bereiche/Budpics";
import { Spinner } from "@/components/ui";
import { adminSeite } from "@/lib/session";

export default async function AdminBudpicsPage() {
  await adminSeite("/admin/budpics");
  return (
    <>
      <Suspense fallback={<Spinner text="Budpics werden geladen" />}>
        <BudpicListe status="OFFEN" />
      </Suspense>
      <Suspense fallback={<Spinner text="Freigegebene Budpics werden geladen" />}>
        <BudpicListe status="FREIGEGEBEN" />
      </Suspense>
    </>
  );
}
