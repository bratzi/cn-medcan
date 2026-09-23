"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { profilSpeichern } from "@/app/mitglied/aktionen";
import { Button, Input } from "@/components/ui";

type Props = {
  anzeigename: string;
  instagramHandle: string | null;
};

export function ProfilFormular({ anzeigename, instagramHandle }: Props) {
  const router = useRouter();
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
    router.refresh();
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-6">
      <Input
        id="profil-anzeigename"
        label="Anzeigename"
        name="anzeigename"
        type="text"
        required
        maxLength={60}
        defaultValue={anzeigename}
        autoComplete="nickname"
      />

      <Input
        id="profil-instagram"
        label="Instagram-Name"
        name="instagramHandle"
        type="text"
        maxLength={30}
        defaultValue={instagramHandle ?? ""}
        autoComplete="off"
        hinweis="Ohne @. Hilft dem Betreiber bei der Freigabe."
      />

      {fehler ? (
        <p role="alert" className="text-small text-danger">
          <span className="font-medium">Fehler: </span>
          {fehler}
        </p>
      ) : null}

      {gespeichert && !fehler ? (
        <p role="status" className="text-small text-success">
          <span className="font-medium">Gespeichert. </span>
          Die Änderungen sind übernommen.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={laeuft}>
          {laeuft ? "Wird gespeichert …" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
