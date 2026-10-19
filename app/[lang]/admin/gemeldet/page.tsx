import { Suspense } from "react";

import { GemeldeteBereich } from "@/components/admin/bereiche/Gemeldet";
import { Spinner } from "@/components/ui";
import { adminSeite } from "@/lib/session";

export default async function AdminGemeldetPage() {
  await adminSeite("/admin/gemeldet");
  return (
    <>
      <Suspense fallback={<Spinner text="Gemeldete Kommentare werden geladen" />}>
        <GemeldeteBereich />
      </Suspense>
    </>
  );
}
