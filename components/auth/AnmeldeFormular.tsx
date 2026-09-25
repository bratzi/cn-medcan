"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signIn } from "@/lib/auth-client";
import { zaehlerZuruecksetzen } from "@/components/layout/konto-zaehler-speicher";
import { Button, Input } from "@/components/ui";
import { fehlertext } from "./fehlertexte";

type Props = {
  /** Schon geprueftes, relatives Ziel - siehe lib/weiterleitung.ts. */
  weiter: string;
};

export function AnmeldeFormular({ weiter }: Props) {
  const router = useRouter();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const daten = new FormData(ereignis.currentTarget);
    setLaeuft(true);
    setFehler(null);

    const { error } = await signIn.email({
      email: String(daten.get("email") ?? ""),
      password: String(daten.get("passwort") ?? ""),
    });

    if (error) {
      setFehler(fehlertext(error.code, "Die Anmeldung ist fehlgeschlagen."));
      setLaeuft(false);
      return;
    }

    // refresh() ist nicht optional: die Serverkomponenten haben noch den
    // abgemeldeten Zustand im Cache, sonst zeigt /mitglied die Anmeldeseite.
    zaehlerZuruecksetzen();
    router.push(weiter);
    router.refresh();
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-6" noValidate={false}>
      <Input
        id="anmelden-email"
        label="E-Mail-Adresse"
        name="email"
        type="email"
        required
        autoComplete="email"
        autoFocus
      />

      <Input
        id="anmelden-passwort"
        label="Passwort"
        name="passwort"
        type="password"
        required
        autoComplete="current-password"
      />

      {fehler ? (
        // Fehler nicht nur farblich: Klartext mit vorangestelltem Wortmarker.
        <p role="alert" className="text-small text-danger">
          <span className="font-medium">Fehler: </span>
          {fehler}
        </p>
      ) : null}

      <Button type="submit" disabled={laeuft}>
        {laeuft ? "Wird geprüft …" : "Anmelden"}
      </Button>
    </form>
  );
}
