import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AnmeldeFormular } from "@/components/auth/AnmeldeFormular";
import { aktuellesMitglied } from "@/lib/session";
import { sicheresZiel } from "@/lib/weiterleitung";

export const metadata: Metadata = {
  title: "Anmelden",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ weiter?: string }>;
};

export default async function AnmeldenPage({ searchParams }: Props) {
  const { weiter } = await searchParams;
  const ziel = sicheresZiel(weiter, "/mitglied");

  // Wer schon angemeldet ist, braucht das Formular nicht.
  if (await aktuellesMitglied()) redirect(ziel);

  return (
    <div className="mx-auto w-full max-w-120 px-4 py-16 sm:px-8">
      <h1 className="text-h1 text-text">Anmelden</h1>
      <p className="mt-2 max-w-[68ch] text-body text-text-muted">
        Für Vorschläge und Abstimmungen. Das Stimmrecht vergibt der Betreiber
        nach der Registrierung von Hand.
      </p>

      <div className="mt-8">
        <AnmeldeFormular weiter={ziel} />
      </div>

      <p className="mt-8 text-small text-text-muted">
        Noch kein Konto?{" "}
        <Link
          href={`/registrieren?weiter=${encodeURIComponent(ziel)}`}
          className="rounded-sm text-accent underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Konto anlegen
        </Link>
      </p>
    </div>
  );
}
