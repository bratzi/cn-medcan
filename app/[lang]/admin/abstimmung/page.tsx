import { Suspense } from "react";

import { AbstimmungBereich } from "@/components/admin/bereiche/Abstimmung";
import { ErgebnisBereich } from "@/components/admin/bereiche/Ergebnisse";
import { Spinner } from "@/components/ui";
import { adminSeite } from "@/lib/session";

export default async function AdminAbstimmungPage() {
  await adminSeite("/admin/abstimmung");
  return (
    <>
      <Suspense fallback={<Spinner text="Umfrage wird geladen" />}>
        <AbstimmungBereich />
      </Suspense>
      <Suspense fallback={<Spinner text="Ergebnisse werden geladen" />}>
        <ErgebnisBereich />
      </Suspense>
    </>
  );
}
