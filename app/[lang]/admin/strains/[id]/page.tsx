import Link from "next/link";
import { notFound } from "next/navigation";

import { StrainStammFormular } from "@/components/admin/StrainStammFormular";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { getPrisma } from "@/lib/prisma";
import { adminSeite } from "@/lib/session";

export default async function AdminStrainBearbeitenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await adminSeite(`/admin/strains/${encodeURIComponent(id)}`);
  const prisma = await getPrisma();
  const [strain, kultivare, vertreiber, terpene] = await Promise.all([
    prisma.strain.findUnique({
      where: { id },
      select: {
        id: true,
        handelsname: true,
        kultivarId: true,
        vertreiberId: true,
        kultivarTyp: true,
        darreichungsform: true,
        thcMinProzent: true,
        thcMaxProzent: true,
        cbdMinProzent: true,
        cbdMaxProzent: true,
        aktiv: true,
        terpene: { select: { terpenId: true }, orderBy: { rang: "asc" } },
      },
    }),
    prisma.kultivar.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.unternehmen.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.terpen.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!strain) notFound();

  return (
    <section aria-labelledby="strain-titel" className="flex flex-col gap-4">
      <Link prefetch={false} href="/admin/strains" className="inline-flex min-h-11 items-center self-start text-body text-text-muted">
        ← Alle Strains
      </Link>
      <Card>
        <CardHeader>
          <h2 id="strain-titel" className="text-h3 text-text wrap-break-word">
            {strain.handelsname}
          </h2>
        </CardHeader>
        <CardBody>
          <StrainStammFormular
            strain={{ ...strain, terpenIds: strain.terpene.map((t) => t.terpenId) }}
            kultivare={kultivare}
            vertreiber={vertreiber}
            terpene={terpene}
          />
        </CardBody>
      </Card>
    </section>
  );
}
