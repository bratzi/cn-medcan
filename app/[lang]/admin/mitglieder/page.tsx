import { Suspense } from "react";

import { MitgliederBereich } from "@/components/admin/bereiche/Mitglieder";
import { Spinner } from "@/components/ui";
import { adminSeite } from "@/lib/session";

export default async function AdminMitgliederPage() {
  const mitglied = await adminSeite("/admin/mitglieder");
  return (
    <>
      <Suspense fallback={<Spinner text="Mitglieder werden geladen" />}>
        <MitgliederBereich eigeneMitgliedId={mitglied.mitgliedId} />
      </Suspense>
    </>
  );
}
