"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signIn } from "@/lib/auth-client";
import { zaehlerZuruecksetzen } from "@/components/layout/konto-zaehler-speicher";
import { Button, Input, useHydriert } from "@/components/ui";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { fehlertext } from "./fehlertexte";

type Props = {
  /** Schon geprueftes, relatives Ziel - siehe lib/weiterleitung.ts. */
  weiter: string;
  texte: Woerterbuch["auth"]["formular"];
  fehlertexte: Woerterbuch["auth"]["fehler"];
};

export function AnmeldeFormular({ weiter, texte, fehlertexte }: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
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
      setFehler(fehlertext(fehlertexte, error.code, texte.anmeldungFehlgeschlagen));
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
        label={texte.email}
        name="email"
        type="email"
        required
        autoComplete="email"
        autoFocus
      />

      <Input
        id="anmelden-passwort"
        label={texte.passwort}
        name="passwort"
        type="password"
        required
        autoComplete="current-password"
      />

      {fehler ? (
        // Fehler nicht nur farblich: Klartext mit vorangestelltem Wortmarker.
        <p role="alert" className="text-small text-danger">
          <span className="font-medium">{texte.fehler} </span>
          {fehler}
        </p>
      ) : null}

      <Button type="submit" disabled={!hydriert || laeuft}>
        {laeuft ? texte.wirdGeprueft : texte.anmelden}
      </Button>
    </form>
  );
}
