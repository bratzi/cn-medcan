import type { Metadata } from "next";
import { Suspense } from "react";

import { HerstellerZeile } from "@/components/admin/HerstellerZeile";
import { Spinner } from "@/components/ui";
import { getPrisma } from "@/lib/prisma";
import { adminSeite } from "@/lib/session";

export const metadata: Metadata = {
  title: "Hersteller und Vertreiber",
  robots: { index: false, follow: false },
};

/** Höchstens so viele Unternehmen in einer Abfrage; der Stamm hat knapp hundert. */
const GRENZE = 300;

async function HerstellerListe() {
  const prisma = await getPrisma();
  const unternehmen = await prisma.unternehmen.findMany({
    orderBy: { name: "asc" },
    take: GRENZE,
    select: {
      id: true,
      name: true,
      rolle: true,
      website: true,
      logoPfad: true,
      _count: { select: { vertrieben: { where: { aktiv: true } } } },
    },
  });
  if (unternehmen.length === 0) return <p className="text-body text-text-muted">Noch keine Unternehmen im Stamm.</p>;
  // Wer viele Strains vertreibt, steht auf vielen Seiten: zuerst, dann nach Name.
  const sortiert = [...unternehmen].sort((a, b) => b._count.vertrieben - a._count.vertrieben || a.name.localeCompare(b.name, "de"));
  return (
    <ul className="flex flex-col gap-4">
      {sortiert.map((u) => (
        <HerstellerZeile key={u.id} id={u.id} name={u.name} rolle={u.rolle} website={u.website} logoPfad={u.logoPfad} strains={u._count.vertrieben} />
      ))}
    </ul>
  );
}

/**
 * Hersteller und Vertreiber pflegen (Spec 2026-10-21, 3): Name, Website, Logo-Pfad. Logos liegen als
 * Dateien unter public/marken/ (kein R2); ohne Logo zeigt die Strain-Seite eine Initialen-Marke.
 * Rechte wie /admin: nur Rolle ADMIN, sonst 404.
 */
export default async function HerstellerPage() {
  await adminSeite("/admin/hersteller");

  return (
    <div>
      <h1 className="text-h1 text-text">Hersteller und Vertreiber</h1>
      <p className="mt-2 max-w-[68ch] text-body text-text-muted">
        Name, Website und Logo der Unternehmen. Das Logo erscheint auf der Strain-Seite in der Auswahl des
        Vertreibers; ohne Logo stehen dort die Initialen.
      </p>
      <div className="mt-8">
        <Suspense fallback={<Spinner text="Unternehmen werden geladen" />}>
          <HerstellerListe />
        </Suspense>
      </div>
    </div>
  );
}
