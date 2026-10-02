"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { profilSpeichern } from "@/app/[lang]/mitglied/aktionen";
import { zaehlerZuruecksetzen } from "@/components/layout/konto-zaehler-speicher";
import { Button, Input, useHydriert } from "@/components/ui";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = {
  anzeigename: string;
  instagramHandle: string | null;
};

export function ProfilFormular({ anzeigename, instagramHandle, texte }: Props & { texte: Woerterbuch["mitglied"]["profil"] }) {
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const daten = new FormData(ereignis.currentTarget);
    setLaeuft(true);
    setFehler(null);
    setGespeichert(false);

    // Die Pruefung liegt in der Server Action, nicht hier: der Client kann
    // sie umgehen. Dies ist nur die Rueckmeldung.
    const ergebnis = await profilSpeichern(daten);
    setLaeuft(false);

    if (!ergebnis.ok) {
      setFehler(ergebnis.fehler);
      return;
    }

    setGespeichert(true);
    // Der Avatar an der Konto-Pille traegt die Initialen des Namens.
    zaehlerZuruecksetzen();
    router.refresh();
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-6">
      <Input
        id="profil-anzeigename"
        label={texte.anzeigename}
        name="anzeigename"
        type="text"
        required
        maxLength={60}
        defaultValue={anzeigename}
        autoComplete="nickname"
      />

      <Input
        id="profil-instagram"
        label={texte.instagram}
        name="instagramHandle"
        type="text"
        maxLength={30}
        defaultValue={instagramHandle ?? ""}
        autoComplete="off"
        hinweis={texte.instagramHinweis}
      />

      {fehler ? (
        <p role="alert" className="text-small text-danger">
          <span className="font-medium">{texte.fehler} </span>
          {fehler}
        </p>
      ) : null}

      {gespeichert && !fehler ? (
        <p role="status" className="text-small text-success">
          <span className="font-medium">{texte.gespeichert} </span>
          {texte.uebernommen}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={!hydriert || laeuft}>
          {laeuft ? texte.speichert : texte.speichern}
        </Button>
      </div>
    </form>
  );
}
