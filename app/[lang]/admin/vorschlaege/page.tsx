import type { Metadata } from "next";
import { Suspense } from "react";

import { BlueteVorschlaege } from "@/components/admin/BlueteVorschlaege";
import { Spinner } from "@/components/ui";
import { adminSeite } from "@/lib/session";

export const metadata: Metadata = {
  title: "Vorgeschlagene Blüten",
  robots: { index: false, follow: false },
};

/**
 * Prüfung der Blütenvorschläge als eigene Seite (Live-Befund 2026-09-25):
 * zusammen mit Umfrage, Bewertungen und Mitgliedern sprengte /admin die
 * 10-ms-CPU-Grenze des Workers. Rechte wie /admin: nur Rolle ADMIN, sonst 404.
 */
export default async function VorschlaegePage() {
  await adminSeite("/admin/vorschlaege");

  return (
    <div>
      <h1 className="text-h1 text-text">Vorgeschlagene Blüten</h1>
      <p className="mt-2 max-w-[68ch] text-body text-text-muted">
        Freigeben legt die Blüte im Katalog an, Zuordnen hängt die Vorschläge an eine vorhandene Blüte,
        Ablehnen schließt sie mit Begründung. Die Vorschlagenden bekommen jeweils eine Benachrichtigung.
      </p>
      <div className="mt-8">
        <Suspense fallback={<Spinner text="Vorschläge werden geladen" />}>
          <BlueteVorschlaege />
        </Suspense>
      </div>
    </div>
  );
}
