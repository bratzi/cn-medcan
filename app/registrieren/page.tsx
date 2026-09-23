import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegistrierFormular } from "@/components/auth/RegistrierFormular";
import { aktuellesMitglied } from "@/lib/session";
import { sicheresZiel } from "@/lib/weiterleitung";

export const metadata: Metadata = {
  title: "Konto anlegen",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ weiter?: string }>;
};

export default async function RegistrierenPage({ searchParams }: Props) {
  const { weiter } = await searchParams;
  const ziel = sicheresZiel(weiter, "/mitglied");

  if (await aktuellesMitglied()) redirect(ziel);

  return (
    <div className="mx-auto w-full max-w-120 px-4 py-16 sm:px-8">
      <h1 className="text-h1 text-text">Konto anlegen</h1>
      <p className="mt-2 max-w-[68ch] text-body text-text-muted">
        Die Registrierung ist offen. Stimmrecht und die Sicht auf Preise gibt
        der Betreiber anschließend von Hand frei — eine Bestätigungsmail gibt
        es nicht.
      </p>

      <div className="mt-8">
        <RegistrierFormular weiter={ziel} />
      </div>

      <p className="mt-8 text-small text-text-muted">
        Schon ein Konto?{" "}
        <Link
          href={`/anmelden?weiter=${encodeURIComponent(ziel)}`}
          className="rounded-sm text-accent underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Anmelden
        </Link>
      </p>
    </div>
  );
}
