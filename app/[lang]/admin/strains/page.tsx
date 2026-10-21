import Link from "next/link";

import { Button, Card, CardBody, CardHeader, Input } from "@/components/ui";
import { getPrisma } from "@/lib/prisma";
import { adminSeite } from "@/lib/session";

const GRENZE = 50;

export default async function AdminStrainsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  await adminSeite("/admin/strains");
  const roh = (await searchParams).q;
  const q = (Array.isArray(roh) ? roh[0] : roh)?.trim().slice(0, 100) ?? "";

  const prisma = await getPrisma();
  const strains = await prisma.strain.findMany({
    where: q ? { suchtext: { contains: q.toLowerCase() } } : undefined,
    select: { id: true, handelsname: true, kultivarTyp: true, aktiv: true, vertreiber: { select: { name: true } } },
    orderBy: { handelsname: "asc" },
    take: GRENZE + 1,
  });
  const mehr = strains.length > GRENZE;

  return (
    <section aria-labelledby="strains-titel">
      <Card>
        <CardHeader>
          <h2 id="strains-titel" className="text-h3 text-text">
            Strains
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-6">
          <form role="search" method="get" className="flex flex-wrap items-end gap-4">
            <Input id="strain-suche" name="q" type="search" label="Suche nach Handelsname oder Kultivar" defaultValue={q} feldClassName="min-w-0 flex-1" />
            <Button type="submit" variante="secondary">
              Suchen
            </Button>
          </form>
          {strains.length === 0 ? (
            <p className="text-body text-text-muted">Keine Strain gefunden.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {strains.slice(0, GRENZE).map((s) => (
                <li key={s.id}>
                  <Link
                    prefetch={false}
                    href={`/admin/strains/${s.id}`}
                    className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2 text-body text-text"
                  >
                    <span className="min-w-0 wrap-break-word">{s.handelsname}</span>
                    <span className="text-small text-text-muted">
                      {[s.vertreiber?.name, s.kultivarTyp, s.aktiv ? null : "inaktiv"].filter(Boolean).join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {mehr ? <p className="text-small text-text-muted">Mehr als {GRENZE} Treffer, bitte die Suche eingrenzen.</p> : null}
        </CardBody>
      </Card>
    </section>
  );
}
