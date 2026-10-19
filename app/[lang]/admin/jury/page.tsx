import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AusgabenVerwaltung } from "@/components/admin/jury/AusgabenVerwaltung";
import { BeitragAdmin, type AdminBeitrag } from "@/components/admin/jury/BeitragAdmin";
import { Spinner } from "@/components/ui";
import { de } from "@/lib/i18n/de";
import { t } from "@/lib/i18n/text";
import { ladeJuryAusgaben, ladeJuryBeitraegeNachStatus } from "@/lib/query/jury-admin";
import { adminSeite } from "@/lib/session";

export const metadata: Metadata = {
  title: "Jury verwalten",
  robots: { index: false, follow: false },
};

// Der Admin-Bereich ist nur deutsch (Betreiber); die Texte stehen trotzdem im Wörterbuch.
const texte = de.admin.jury;

const REITER = [
  { schluessel: "eingereicht", text: texte.reiter.eingereicht },
  { schluessel: "veroeffentlicht", text: texte.reiter.veroeffentlicht },
  { schluessel: "ausgaben", text: texte.reiter.ausgaben },
] as const;
type Reiter = (typeof REITER)[number]["schluessel"];

function reiterAus(wert: string | string[] | undefined): Reiter {
  return REITER.find((r) => r.schluessel === wert)?.schluessel ?? "eingereicht";
}

type Zeile = Awaited<ReturnType<typeof ladeJuryBeitraegeNachStatus>>[number];

function zuAdminBeitrag(z: Zeile): AdminBeitrag {
  const r = z.review;
  const sorte = r ? (r.kultivar?.name ?? r.strain.handelsname) : null;
  return {
    id: z.id,
    slug: z.slug,
    titel: z.titel,
    anriss: z.anriss,
    text: z.text,
    autor: z.autor.anzeigename,
    bewertung: sorte ? (r?.vertreiber ? t(de.profil.jury.bewertungLabel, { sorte, vertreiber: r.vertreiber.name }) : sorte) : null,
    ausgabeId: z.ausgabeId,
    position: z.position,
    igUrl: z.igUrl,
    igStatus: z.igStatus,
    bilder: z.bilder,
  };
}

async function Beitraege({ status }: { status: "EINGEREICHT" | "VEROEFFENTLICHT" }) {
  const eingereicht = status === "EINGEREICHT";
  const [zeilen, ausgaben] = await Promise.all([ladeJuryBeitraegeNachStatus(status), eingereicht ? ladeJuryAusgaben() : Promise.resolve([])]);
  if (zeilen.length === 0) {
    return <p className="text-body text-text-muted">{eingereicht ? texte.leerEingereicht : texte.leerVeroeffentlicht}</p>;
  }
  return (
    <ul className="flex flex-col gap-8">
      {zeilen.map((z) => (
        <li key={z.id}>
          <BeitragAdmin
            beitrag={zuAdminBeitrag(z)}
            modus={eingereicht ? "eingereicht" : "veroeffentlicht"}
            ausgaben={ausgaben.map((a) => ({ id: a.id, titel: a.titel }))}
            texte={texte}
          />
        </li>
      ))}
    </ul>
  );
}

async function Ausgaben() {
  return <AusgabenVerwaltung ausgaben={await ladeJuryAusgaben()} texte={texte} />;
}

export default async function AdminJuryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Wie /admin: wer kein Betreiber ist, erfährt nicht, dass es die Seite gibt.
  await adminSeite("/admin/jury");

  const reiter = reiterAus((await searchParams).reiter);

  return (
    <div>
      <h1 className="text-h1 text-text">{texte.titel}</h1>
      <p className="mt-2 max-w-[68ch] text-body text-text-muted">{texte.satz}</p>

      <nav aria-label={texte.reiterLeiste} className="mt-8">
        <ul className="flex flex-wrap gap-2 border-b border-border">
          {REITER.map((r) => (
            <li key={r.schluessel}>
              <Link
                prefetch={false}
                href={r.schluessel === "eingereicht" ? "/admin/jury" : `/admin/jury?reiter=${r.schluessel}`}
                aria-current={r.schluessel === reiter ? "page" : undefined}
                className={`-mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-small font-medium transition-colors duration-fast ${
                  r.schluessel === reiter ? "border-accent text-text" : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {r.text}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8">
        <Suspense fallback={<Spinner text="Wird geladen" />}>
          {reiter === "ausgaben" ? <Ausgaben /> : <Beitraege status={reiter === "eingereicht" ? "EINGEREICHT" : "VEROEFFENTLICHT"} />}
        </Suspense>
      </div>
    </div>
  );
}
