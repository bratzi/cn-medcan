import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegistrierFormular } from "@/components/auth/RegistrierFormular";
import { aktuellesMitglied } from "@/lib/session";
import { holeWoerterbuch } from "@/lib/i18n";
import { sicheresZiel } from "@/lib/weiterleitung";

export async function generateMetadata(): Promise<Metadata> {
  const w = await holeWoerterbuch();
  return { title: w.auth.registrieren.titel, robots: { index: false, follow: false } };
}

type Props = {
  searchParams: Promise<{ weiter?: string }>;
};

export default async function RegistrierenPage({ searchParams }: Props) {
  const { weiter } = await searchParams;
  const ziel = sicheresZiel(weiter, "/profil");
  const w = await holeWoerterbuch();

  if (await aktuellesMitglied()) redirect(ziel);

  return (
    <div className="mx-auto w-full max-w-120 px-4 py-16 sm:px-8">
      <h1 className="text-h1 text-text">{w.auth.registrieren.titel}</h1>
      <p className="mt-2 max-w-[68ch] text-body text-text-muted">
        {w.auth.registrieren.satz}
      </p>

      <div className="mt-8">
        <RegistrierFormular weiter={ziel} texte={w.auth.formular} fehlertexte={w.auth.fehler} />
      </div>

      <p className="mt-8 text-small text-text-muted">
        {w.auth.registrieren.schonKonto}{" "}
        <Link prefetch={false}
          href={`/anmelden?weiter=${encodeURIComponent(ziel)}`}
          className="rounded-sm text-accent underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {w.auth.registrieren.anmelden}
        </Link>
      </p>
    </div>
  );
}
